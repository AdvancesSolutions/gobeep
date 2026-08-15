const { io } = require('socket.io-client');

const URL = 'http://localhost:3001';
const log = (...a) => console.log('[test]', ...a);
let failures = 0;
const assert = (cond, msg) => { if (!cond) { failures++; log('FALHOU:', msg); } else log('OK:', msg); };

const tv = io(URL);
const mobile = io(URL);

tv.on('connect', () => { tv.emit('register_tv'); });
mobile.on('connect', () => { mobile.emit('register_mobile'); });

tv.on('pong_tv', (d) => assert(d && d.ts, 'TV recebeu pong_tv'));
mobile.on('paired', (d) => assert(d && d.status === 'ok' && /^\d{6}$/.test(d.pin), 'celular recebeu paired com PIN de 6 digitos'));
tv.on('pair_success', (d) => assert(d && d.pin, 'TV recebeu pair_success'));
mobile.on('pair_lost', (d) => assert(d && d.reason === 'tv_offline', 'celular recebeu pair_lost (tv_offline)'));
tv.on('tv_reaction', (emoji) => assert(emoji === '🔥', 'TV recebeu tv_reaction do celular'));

let pin = null;

function run() {
  // Heartbeat
  tv.emit('ping_tv');

  // Pareamento
  pin = '123456';
  mobile.emit('pairTV', { pin }, (ack) => {
    assert(ack && ack.status === 'ok', 'ack pairTV ok');
  });

  // Reação celular -> TV
  setTimeout(() => mobile.emit('sendReaction', '🔥'), 400);

  // Saldo HTTP apos pareamento
  setTimeout(() => {
    require('http').get(`http://localhost:3001/saldo/${pin}`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        const j = JSON.parse(body);
        assert(typeof j.saldo === 'number', `GET /saldo/${pin} retornou saldo numerico: ${j.saldo}`);
      });
    });
  }, 600);

  // Desconecta a TV -> dispara pair_lost no celular
  setTimeout(() => { log('desconectando TV...'); tv.disconnect(); }, 900);

  // Fim
  setTimeout(() => {
    mobile.disconnect();
    log(failures === 0 ? '>>> TODOS OS TESTES PASSARAM' : `>>> ${failures} FALHA(S)`);
    process.exit(failures === 0 ? 0 : 1);
  }, 1500);
}

tv.on('connect', () => {});
mobile.on('connect', () => {});
setTimeout(run, 500);
