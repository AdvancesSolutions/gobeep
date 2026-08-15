/**
 * BeepApp — Servidor de referência (Node + socket.io)
 * -----------------------------------------------------
 * Implementa o contrato de eventos esperado por AppWeb (TV) e AppMobile (celular):
 *
 *  TV (webOS) -> servidor                servidor -> TV
 *  -----------------------------------   -----------------------------------
 *  'mobile_pair'   (pin)                 'pair_success' / 'pair_error'
 *  'ping_tv'                             'pong_tv'          (heartbeat)
 *  'tv_reaction'   (emoji)               (broadcast p/ celular)
 *  'tv_channel_changed' (canal)
 *  'tv_score'      (amount)              '+X Beepix'
 *
 *  Celular (Expo) -> servidor            servidor -> celular
 *  -----------------------------------   -----------------------------------
 *  'pairTV'        (pin)                 'paired' / 'pair_error' / 'pairStatus'
 *  'sendReaction'  (emoji)               'tv_reaction'       (-> TV)
 *  'pong_tv' pode ser emitido pelo celular também
 *
 *  Desconexão de qualquer lado -> 'pair_lost' para o par.
 *
 *  HTTP:
 *    GET /saldo            -> saldo Beepix atual (usado por beepixService)
 *    GET /saldo/:pin       -> saldo do usuário pareado com aquele pin
 *    POST /saldo/:pin/add  -> corpo { amount } soma ao saldo (usado em testes)
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3002;
const DATA_FILE = path.join(__dirname, 'data.json');

// ---- Estado em memória (persistido em data.json) ----
/** @type {Record<string, {beepix:number, paired:boolean, tvId?:string, mobileId?:string, favorites?: any[]}>} */
let users = {};
let tvSocketId = null;
let mobileSocketId = null;
let tvOnline = false;
let tvIp = null;
let tvByPin = {}; // pin -> socketId da TV (suporta varias TVs)

// Extrai o IP do socket (IPv4 preferido).
const ipOf = (sock) => {
  try {
    const addr = sock.handshake?.address || sock.request?.connection?.remoteAddress || '';
    return String(addr).replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
  } catch { return ''; }
};
// Sub-rede /24 (primeiros 3 octetos), ex: "192.168.15".
const subnetOf = (ip) => (typeof ip === 'string' ? ip.split('.').slice(0, 3).join('.') : '');

function load() {
  try {
    users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    users = {};
  }
}
function save() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.warn('[beepapp] falha ao salvar data.json:', e.message);
  }
}
load();

function genPin() {
  let pin;
  do {
    pin = String(Math.floor(100000 + Math.random() * 900000));
  } while (users[pin]);
  return pin;
}

// ---- HTTP ----
const app = express();
app.use(cors());
app.use(express.json());

app.get('/saldo', (_req, res) => {
  // Saldo "global" de referência: soma de todos os usuários pareados,
  // ou o primeiro usuário encontrado. Ajuste conforme o backend real.
  const firstPin = Object.keys(users)[0];
  const saldo = firstPin ? users[firstPin].beepix : 0;
  res.json({ saldo });
});

app.get('/saldo/:pin', (req, res) => {
  const u = users[req.params.pin];
  if (!u) return res.status(404).json({ error: 'pin nao encontrado' });
  res.json({ saldo: u.beepix });
});

app.post('/saldo/:pin/add', (req, res) => {
  const u = users[req.params.pin];
  if (!u) return res.status(404).json({ error: 'pin nao encontrado' });
  const amount = Number(req.body?.amount) || 0;
  u.beepix += amount;
  save();
  res.json({ saldo: u.beepix });
});

app.get('/health', (_req, res) => res.json({ ok: true, tv: !!tvSocketId, mobile: !!mobileSocketId }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('[beepapp] cliente conectado:', socket.id);

  // ---- TV entra ----
  socket.on('register_tv', (data) => {
    tvSocketId = socket.id;
    tvIp = ipOf(socket);
    const p = data?.pin;
    if (p) tvByPin[p] = socket.id; // associa este socket à TV do PIN (varias TVs)
    console.log('[beepapp] TV registrada:', socket.id, tvIp || '', p ? '(pin ' + p + ')' : '');
  });

  // ---- Celular entra ----
  socket.on('register_mobile', () => {
    mobileSocketId = socket.id;
    console.log('[beepapp] Celular registrado:', socket.id);
  });

  // ---- Pareamento (celular envia PIN) ----
  socket.on('pairTV', (data, ack) => {
    const pin = String(data?.pin || '').trim();
    if (!/^\d{6}$/.test(pin)) {
      const err = { status: 'error', message: 'PIN deve ter 6 dígitos' };
      if (typeof ack === 'function') ack(err);
      socket.emit('pair_error', err);
      return;
    }
    // Cria/recupera usuário do PIN.
    if (!users[pin]) users[pin] = { beepix: 0, paired: false };
    users[pin].paired = true;
    users[pin].mobileId = socket.id;
    mobileSocketId = socket.id;
    if (tvByPin[pin]) users[pin].tvId = tvByPin[pin]; // TV do PIN (varias TVs)
    else if (tvSocketId) users[pin].tvId = tvSocketId;
    save();

    const ok = { status: 'ok', pin, beepix: users[pin].beepix };
    if (typeof ack === 'function') ack(ok);
    socket.emit('paired', ok);
    socket.emit('pairStatus', 'paired');
    const targetTv = users[pin].tvId || tvSocketId;
    if (targetTv) io.to(targetTv).emit('pair_success', { pin, beepix: users[pin].beepix });
    console.log('[beepapp] pareado PIN', pin);
  });

  // ---- Compatibilidade: TV também pode iniciar par por PIN ----
  socket.on('mobile_pair', (pin) => {
    // Aceita tanto string "123456" quanto objeto { pin: "123456" }.
    const raw = (pin && typeof pin === 'object' && pin.pin) ? pin.pin : pin;
    const p = String(raw || '').trim();
    if (!/^\d{6}$/.test(p)) {
      socket.emit('pair_error', { status: 'error', message: 'PIN inválido' });
      return;
    }
    if (!users[p]) users[p] = { beepix: 0, paired: false };
    users[p].paired = true;
    users[p].mobileId = socket.id; // quem chamou mobile_pair é o celular
    mobileSocketId = socket.id;
    if (tvByPin[p]) users[p].tvId = tvByPin[p]; // TV do PIN (varias TVs)
    else if (tvSocketId) users[p].tvId = tvSocketId;
    save();
    socket.emit('pair_success', { pin: p, beepix: users[p].beepix });
    const targetTv = users[p].tvId || tvSocketId;
    if (targetTv) io.to(targetTv).emit('pair_success', { pin: p, beepix: users[p].beepix });
  });

  // ---- Auto-vínculo por rede (mesma sub-rede, sem PIN) ----
  socket.on('auto_pair', (data, ack) => {
    // Só o celular dispara; precisa de uma TV online.
    if (socket.id === tvSocketId) {
      const e = { status: 'error', message: 'Apenas o celular pode auto-vincular' };
      if (typeof ack === 'function') ack(e);
      return;
    }
    if (!tvSocketId) {
      const e = { status: 'error', message: 'Nenhuma TV encontrada na rede' };
      if (typeof ack === 'function') ack(e);
      socket.emit('pair_error', e);
      return;
    }
    const mobIp = ipOf(socket);
    const sameNet = tvIp && subnetOf(mobIp) === subnetOf(tvIp);
    if (!sameNet) {
      const e = { status: 'error', message: 'TV não está na mesma rede Wi-Fi' };
      if (typeof ack === 'function') ack(e);
      socket.emit('pair_error', e);
      return;
    }
    // Reusa o PIN da TV se já houver usuário pareado com essa TV; senão gera um.
    let pin = Object.keys(users).find((k) => users[k].tvId === tvSocketId);
    if (!pin) {
      do { pin = String(Math.floor(100000 + Math.random() * 900000)); } while (users[pin]);
      users[pin] = { beepix: 0, paired: false };
    }
    users[pin].paired = true;
    users[pin].tvId = tvSocketId;
    users[pin].mobileId = socket.id;
    mobileSocketId = socket.id;
    save();
    const ok = { status: 'ok', pin, auto: true, beepix: users[pin].beepix };
    if (typeof ack === 'function') ack(ok);
    socket.emit('paired', ok);
    socket.emit('pairStatus', 'paired');
    if (tvSocketId) io.to(tvSocketId).emit('pair_success', { pin, beepix: users[pin].beepix });
    console.log('[beepapp] auto-pareado PIN', pin, '(mesma rede)', mobIp, '<->', tvIp);
  });

  // ---- Heartbeat TV -> servidor -> pong_tv ----
  socket.on('ping_tv', () => {
    tvSocketId = socket.id;
    tvOnline = true;
    socket.emit('pong_tv', { ts: Date.now() });
    // Avisa o celular que a TV ficou online (notificação push no mobile).
    if (mobileSocketId) io.to(mobileSocketId).emit('tv_status', { online: true, ts: Date.now() });
  });

  // ---- Canal alterado: roteia bidirecional (TV <-> Celular) ----
  socket.on('tv_channel_changed', (data) => {
    // Só a TV (não o celular) atualiza o socketId global da TV ativa.
    if (socket.id !== mobileSocketId) tvSocketId = socket.id;
    // Se veio da TV, repassa ao celular; se veio do celular, repassa à TV alvo.
    if (socket.id === tvSocketId) {
      if (mobileSocketId) io.to(mobileSocketId).emit('tv_channel_changed', data);
    } else {
      const tvId = targetTvId(data);
      if (tvId) io.to(tvId).emit('tv_channel_changed', data);
    }
  });

  // ---- Celular pede a lista de canais da TV ----
  socket.on('request_channels', (data) => {
    const tvId = targetTvId(data);
    if (tvId) io.to(tvId).emit('request_channels', { from: socket.id });
  });

  // ---- TV responde com a lista (repassada ao celular que pediu) ----
  socket.on('channels_list', (data) => {
    const from = data?.from;
    if (from && io.sockets.sockets.get(from)) io.to(from).emit('channels_list', data);
    else if (mobileSocketId) io.to(mobileSocketId).emit('channels_list', data);
  });

  // ---- Chat ao vivo compartilhado (TV <-> Celular) ----
  socket.on('chat_message', (data) => {
    const msg = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      from: socket.id === tvSocketId ? 'tv' : 'mobile',
      text: String(data?.text || '').slice(0, 280),
      ts: Date.now(),
    };
    if (!msg.text) return;
    // Deduz o papel pelo estado atual (o app real não emite register explícito).
    const isTv = socket.id === tvSocketId;
    if (isTv) { if (mobileSocketId) io.to(mobileSocketId).emit('chat_message', msg); }
    else { const tvId = targetTvId(data); if (tvId) io.to(tvId).emit('chat_message', msg); }
  });

  // ---- Reações (celular e TV) -> feed agregado para ambos ----
  const pushReaction = (emoji) => {
    const pin = pinOf(socket.id);
    if (!pin) return;
    const e = String(emoji || '').slice(0, 8);
    if (!e) return;
    if (!Array.isArray(users[pin].reactions)) users[pin].reactions = [];
    if (!users[pin].stats) users[pin].stats = { reactionCount: 0, channels: [], watchStart: Date.now() };
    users[pin].reactions.push({ emoji: e, ts: Date.now() });
    if (users[pin].reactions.length > 50) users[pin].reactions = users[pin].reactions.slice(-50);
    users[pin].stats.reactionCount += 1;
    const feed = users[pin].reactions;
    if (tvSocketId) io.to(tvSocketId).emit('reaction_feed', feed);
    if (mobileSocketId) io.to(mobileSocketId).emit('reaction_feed', feed);
  };

  // Celular envia reação.
  socket.on('sendReaction', (emoji) => { pushReaction(emoji); });
  // TV também pode emitir reação local.
  socket.on('tv_reaction', (emoji) => { pushReaction(emoji); });

  // ---- Favoritos unificados (TV <-> Celular) ----
  // Encontra o PIN do usuário dono deste socket.
  const pinOf = (sid) => Object.keys(users).find((k) => users[k].tvId === sid || users[k].mobileId === sid);

  // Resolvo o socketId da TV alvo de um comando do celular.
  // Prioriza tvByPin[pin] (TV específica), depois users[pin].tvId, depois TV global (compat 1:1).
  const targetTvId = (data) => {
    const p = data?.pin || data?.targetPin;
    if (p) {
      if (tvByPin[p]) return tvByPin[p];
      if (users[p] && users[p].tvId) return users[p].tvId;
    }
    return tvSocketId;
  };

  // Recebe toggle/set de favorito e sincroniza com o par + persiste.
  socket.on('favorite_toggle', (data) => {
    const pin = pinOf(socket.id);
    if (!pin) return;
    const favs = Array.isArray(users[pin].favorites) ? users[pin].favorites : [];
    const item = data?.item;
    if (!item || !item.id) return;
    const idx = favs.findIndex((f) => f.id === item.id);
    if (idx >= 0) favs.splice(idx, 1); // remove (desfavorita)
    else favs.push({ id: item.id, name: item.name, logo: item.logo, group: item.group });
    users[pin].favorites = favs;
    save();
    const payload = { favorites: favs };
    if (tvSocketId) io.to(tvSocketId).emit('favorites_list', payload);
    if (mobileSocketId) io.to(mobileSocketId).emit('favorites_list', payload);
  });

  // Um lado pede a lista atual (ex.: celular reconecta).
  socket.on('favorites_get', () => {
    const pin = pinOf(socket.id);
    if (!pin) return;
    const favs = Array.isArray(users[pin].favorites) ? users[pin].favorites : [];
    socket.emit('favorites_list', { favorites: favs });
  });

  // ---- Controle remoto do vídeo (celular -> TV) ----
  socket.on('tv_control', (data) => {
    // Só o celular manda controle; encaminha para a TV alvo (ou a global).
    if (socket.id === tvSocketId) return; // ignora se veio da própria TV
    const tvId = targetTvId(data);
    if (tvId) io.to(tvId).emit('tv_control', data);
  });

  // ---- D-Pad virtual do celular (espelha navegação na TV) ----
  socket.on('tv_keypress', (data) => {
    // Só o celular manda; encaminha para a TV alvo (ou a global).
    if (socket.id === tvSocketId) return;
    const key = String(data?.key || '');
    if (!key) return;
    const tvId = targetTvId(data);
    if (tvId) io.to(tvId).emit('tv_keypress', { key, keyCode: Number(data?.keyCode) || 0 });
  });

  // ---- Continue assistindo cruzado ----
  socket.on('now_watching', (data) => {
    const pin = pinOf(socket.id);
    if (!pin) return;
    const item = {
      channelId: data?.channelId,
      name: String(data?.name || ''),
      url: String(data?.url || ''),
      logo: data?.logo,
      ts: Date.now(),
    };
    if (!users[pin].stats) users[pin].stats = { reactionCount: 0, channels: [], watchStart: Date.now() };
    if (item.channelId && !users[pin].stats.channels.includes(item.channelId)) {
      users[pin].stats.channels.push(item.channelId);
    }
    users[pin].nowWatching = item;
    save();
    // Roteia para a TV alvo (se veio do celular) ou para o celular (se veio da TV).
    if (socket.id === tvSocketId) {
      if (mobileSocketId) io.to(mobileSocketId).emit('now_watching', item);
    } else {
      const tvId = targetTvId(data);
      if (tvId) io.to(tvId).emit('now_watching', item);
    }
  });

  // ---- Estatísticas do companion ----
  socket.on('get_stats', () => {
    const pin = pinOf(socket.id);
    if (!pin) return;
    if (!users[pin].stats) users[pin].stats = { reactionCount: 0, channels: [], watchStart: Date.now() };
    const s = users[pin].stats;
    const stats = {
      reactionCount: s.reactionCount || 0,
      channelsWatched: Array.isArray(s.channels) ? s.channels.length : 0,
      watchSeconds: Math.floor((Date.now() - (s.watchStart || Date.now())) / 1000),
      beepix: Number(users[pin].beepix) || 0,
    };
    socket.emit('stats', stats);
  });

  // ---- Votações em tempo real ----
  // Guarda a enquete ativa por usuário pareado.
  const voteKey = (sid) => Object.keys(users).find((k) => users[k].tvId === sid || users[k].mobileId === sid);

  socket.on('vote_start', (data) => {
    // Só a TV abre a votação.
    if (socket.id !== tvSocketId) return;
    const pin = voteKey(socket.id);
    if (!pin) return;
    const options = Array.isArray(data?.options) ? data.options.map((o) => String(o).slice(0, 60)) : [];
    if (options.length < 2) return;
    const poll = { id: Date.now().toString(36), question: String(data?.question || 'Votação').slice(0, 120), options, tally: options.map(() => 0), open: true };
    users[pin].poll = poll;
    save();
    // Avisa o celular que uma votação começou.
    if (mobileSocketId) io.to(mobileSocketId).emit('vote_start', poll);
  });

  socket.on('vote_cast', (data) => {
    const pin = voteKey(socket.id);
    if (!pin || !users[pin].poll || !users[pin].poll.open) return;
    const idx = Number(data?.optionIndex);
    if (Number.isInteger(idx) && idx >= 0 && idx < users[pin].poll.tally.length) {
      users[pin].poll.tally[idx] += 1;
      save();
      // Responde com os resultados atualizados para ambos.
      const results = { ...users[pin].poll };
      if (tvSocketId) io.to(tvSocketId).emit('vote_results', results);
      if (mobileSocketId) io.to(mobileSocketId).emit('vote_results', results);
    }
  });

  socket.on('vote_close', () => {
    if (socket.id !== tvSocketId) return;
    const pin = voteKey(socket.id);
    if (!pin || !users[pin].poll) return;
    users[pin].poll.open = false;
    save();
    if (mobileSocketId) io.to(mobileSocketId).emit('vote_results', { ...users[pin].poll });
  });

  // ---- Pontuação (gamificação) ----
  socket.on('tv_score', (data) => {
    const amount = Number(data?.amount) || 10;
    const pin = Object.keys(users).find((k) => users[k].tvId === socket.id || users[k].mobileId === socket.id);
    if (pin) {
      users[pin].beepix += amount;
      save();
    }
    if (mobileSocketId) io.to(mobileSocketId).emit('tv_score', { amount });
    if (tvSocketId) io.to(tvSocketId).emit('tv_score', { amount });
    // Perfil único: broadcast do saldo absoluto para sincronizar celular + TV.
    const saldo = pin ? Number(users[pin].beepix) || 0 : 0;
    if (mobileSocketId) io.to(mobileSocketId).emit('beepix_sync', { beepix: saldo });
    if (tvSocketId) io.to(tvSocketId).emit('beepix_sync', { beepix: saldo });
  });

  // ---- Perfil único: celular/TV pedem o saldo persistido no servidor ----
  socket.on('beepix_get', () => {
    const pin = Object.keys(users).find((k) => users[k].tvId === socket.id || users[k].mobileId === socket.id);
    const saldo = pin ? Number(users[pin].beepix) || 0 : 0;
    socket.emit('beepix_sync', { beepix: saldo });
  });

  // ---- Alerta (TV ou servidor) ----
  socket.on('tv_alert', (data) => {
    if (tvSocketId) io.to(tvSocketId).emit('tv_alert', data);
    if (mobileSocketId) io.to(mobileSocketId).emit('tv_alert', data);
  });

  // ---- Desconexão: avisa o par (pair_lost) ----
  socket.on('disconnect', () => {
    const wasTv = socket.id === tvSocketId;
    const wasMobile = socket.id === mobileSocketId;
    if (wasTv) tvSocketId = null;
    if (wasMobile) mobileSocketId = null;
    if (wasTv) {
      tvOnline = false;
      // Notifica o celular que a TV ficou offline.
      if (mobileSocketId) io.to(mobileSocketId).emit('tv_status', { online: false, ts: Date.now() });
    }

    // Marca usuários desse socket como despareados e emite pair_lost.
    for (const pin of Object.keys(users)) {
      const u = users[pin];
      const affected = u.tvId === socket.id || u.mobileId === socket.id;
      if (affected) {
        u.paired = false;
        if (wasTv) { u.tvId = undefined; delete tvByPin[pin]; } // limpa mapa de TV por PIN
        if (wasMobile) u.mobileId = undefined;
        save();
        if (wasTv && u.mobileId) io.to(u.mobileId).emit('pair_lost', { pin, reason: 'tv_offline' });
        if (wasMobile && u.tvId) io.to(u.tvId).emit('pair_lost', { pin, reason: 'mobile_offline' });
      }
    }
    console.log('[beepapp] cliente desconectado:', socket.id, wasTv ? '(TV)' : wasMobile ? '(celular)' : '');
  });
});

server.listen(PORT, () => {
  console.log(`[beepapp] servidor ouvindo em http://localhost:${PORT}`);
  console.log(`[beepapp] eventos: /saldo, ping_tv->pong_tv, pairTV, sendReaction, tv_reaction, tv_score, pair_lost`);
});
