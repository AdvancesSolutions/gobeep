import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput, FlatList, Share } from 'react-native';
import { useTVSocket } from '../contexts/SocketContext';
import PairingContainer from './PairingContainer';

const EMOJIS = ['🔥', '❤️', '😂', '😮', '👏', '🎉', '💛', '⚡'];

export const TVRemote = () => {
  const { connected, pairedRoom, pairStatus, pairError, tvOnline, sendReaction, changeChannelById, requestChannels, channels, sendChat, chatMessages, favorites, toggleFavorite, sendControl, votePoll, castVote, sendKey, nowWatching, setNowWatching, reactionFeed, stats, getStats, beepix, getBeepix, autoPair, pairedTVs, activePin, selectTV } = useTVSocket();
  const [paired, setPaired] = useState(false);
  const [chatText, setChatText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Notificação quando a TV muda de status (opção 13).
  const prevOnline = React.useRef(tvOnline);
  useEffect(() => {
    if (prevOnline.current !== tvOnline) {
      prevOnline.current = tvOnline;
      setToast(tvOnline ? '📺 TV Online!' : '📴 TV Offline');
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [tvOnline]);

  // Gera o deep link e compartilha (opção 12).
  const shareChannel = async (ch: { id: string; name: string }) => {
    if (!ch?.id) return;
    const link = `beepapp://watch?channel=${encodeURIComponent(ch.id)}`;
    try {
      await Share.share({ message: `Assista ${ch.name} na BeepApp TV: ${link}` });
    } catch { /* usuário cancelou */ }
  };

  // Só considera pareado quando o servidor confirma (pairStatus='paired'),
  // não no momento do envio do PIN.
  if (pairStatus === 'paired' && !paired) setPaired(true);

  if (!paired) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.status}>{connected ? '🟢 Conectado à TV' : '🟡 Conectando...'}</Text>
        <PairingContainer
          onPairSuccess={() => {}}
          onClose={() => {}}
        />
      </View>
    );
  }

  // Atualiza a lista de canais quando a TV fica online.
  useEffect(() => {
    if (tvOnline) requestChannels();
  }, [tvOnline, requestChannels]);

  const send = () => {
    if (chatText.trim()) { sendChat(chatText); setChatText(''); }
  };

  return (
    <View style={styles.wrap}>
      {toast && (
        <View style={[styles.toast, tvOnline ? styles.toastOn : styles.toastOff]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>🎮 Controle BeepApp TV</Text>

        {/* Seletor de TV (1 celular controla várias TVs) */}
        {pairedTVs.length > 1 && (
          <View style={styles.tvSelector}>
            <Text style={styles.section}>📺 TVs pareadas ({pairedTVs.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tvRow}>
              {pairedTVs.map((t) => (
                <TouchableOpacity
                  key={t.pin}
                  style={[styles.tvChip, activePin === t.pin && styles.tvChipActive]}
                  onPress={() => selectTV(t.pin)}
                >
                  <Text style={[styles.tvChipText, activePin === t.pin && styles.tvChipTextActive]}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Perfil único Beepix (servidor) */}
        <View style={styles.profileBox}>
          <Text style={styles.profileLabel}>⭐ Perfil Beepix</Text>
          <Text style={styles.profileBeepix}>{beepix != null ? beepix.toLocaleString('pt-BR') : '—'}</Text>
          <TouchableOpacity style={styles.profileBtn} onPress={getBeepix}><Text style={styles.profileBtnText}>🔄 Sincronizar</Text></TouchableOpacity>
        </View>

      <Text style={styles.status}>
        Sala: {pairedRoom}  {tvOnline ? '🟢 TV Online' : '🔴 TV Offline'}
      </Text>

      {nowWatching && (
        <View style={styles.nowBox}>
          <Text style={styles.nowLabel}>📺 Assistindo agora</Text>
          <Text style={styles.nowName}>{nowWatching.name}</Text>
          <View style={styles.nowBtns}>
            <TouchableOpacity style={styles.nowBtn} onPress={() => changeChannelById(nowWatching.channelId || '')}>
              <Text style={styles.nowBtnText}>▶ Continuar na TV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nowBtn, styles.nowBtn2]} onPress={() => setNowWatching(nowWatching)}>
              <Text style={styles.nowBtnText}>🔄 Sincronizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.section}>📊 Estatísticas</Text>
      {stats ? (
        <View style={styles.statsBox}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statNum}>{stats.reactionCount}</Text><Text style={styles.statLbl}>Reações</Text></View>
            <View style={styles.statCard}><Text style={styles.statNum}>{stats.channelsWatched}</Text><Text style={styles.statLbl}>Canais</Text></View>
            <View style={styles.statCard}><Text style={styles.statNum}>{Math.floor(stats.watchSeconds / 60)}</Text><Text style={styles.statLbl}>Min assist.</Text></View>
          </View>
          <View style={styles.statsBeepix}><Text style={styles.statBeepixText}>⭐ Beepix: {stats.beepix}</Text></View>
          <TouchableOpacity style={styles.statsBtn} onPress={getStats}><Text style={styles.statsBtnText}>🔄 Atualizar</Text></TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.hint}>Carregando estatísticas...</Text>
      )}

      <Text style={styles.section}>Canais da TV</Text>
      {!tvOnline ? (
        <Text style={styles.hint}>Aguardando a TV ficar online...</Text>
      ) : channels.length === 0 ? (
        <ActivityIndicator color="#FFD700" />
      ) : (
        <ScrollView style={styles.chList} nestedScrollEnabled>
          {channels.map((c) => (
            <View key={c.id} style={styles.chRow}>
              <TouchableOpacity
                style={[styles.chItem, { flex: 1 }]}
                onPress={() => changeChannelById(c.id)}
              >
                <Text style={styles.chName} numberOfLines={1}>{c.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareBtn} onPress={() => shareChannel(c)}>
                <Text style={styles.shareText}>📤</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* D-Pad virtual */}
      <Text style={styles.section}>🎯 D-Pad (espelha na TV)</Text>
      <View style={styles.dpad}>
        <View style={styles.dpadRow}>
          <View style={styles.dpadSpacer} />
          <TouchableOpacity style={styles.dpadBtn} onPress={() => sendKey('ArrowUp')}><Text style={styles.dpadText}>▲</Text></TouchableOpacity>
          <View style={styles.dpadSpacer} />
        </View>
        <View style={styles.dpadRow}>
          <TouchableOpacity style={styles.dpadBtn} onPress={() => sendKey('ArrowLeft')}><Text style={styles.dpadText}>◀</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.dpadBtn, styles.dpadOk]} onPress={() => sendKey('Enter')}><Text style={styles.dpadText}>OK</Text></TouchableOpacity>
          <TouchableOpacity style={styles.dpadBtn} onPress={() => sendKey('ArrowRight')}><Text style={styles.dpadText}>▶</Text></TouchableOpacity>
        </View>
        <View style={styles.dpadRow}>
          <View style={styles.dpadSpacer} />
          <TouchableOpacity style={styles.dpadBtn} onPress={() => sendKey('ArrowDown')}><Text style={styles.dpadText}>▼</Text></TouchableOpacity>
          <TouchableOpacity style={styles.dpadBtn} onPress={() => sendKey('Backspace')}><Text style={styles.dpadText}>⏏</Text></TouchableOpacity>
        </View>
      </View>

      {votePoll && (
        <View style={styles.voteBox}>
          <Text style={styles.section}>🗳️ Votação</Text>
          <Text style={styles.voteQ}>{votePoll.question}</Text>
          {votePoll.options.map((opt: string, i: number) => {
            const total = votePoll.tally.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((votePoll.tally[i] / total) * 100) : 0;
            return (
              <TouchableOpacity key={i} style={styles.voteOpt} onPress={() => castVote(i)} disabled={!votePoll.open}>
                <View style={styles.voteBarBg}><View style={[styles.voteBar, { width: `${pct}%` }]} /></View>
                <View style={styles.voteRow}>
                  <Text style={styles.voteOptText}>{opt}</Text>
                  <Text style={styles.votePct}>{pct}% ({votePoll.tally[i]})</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {!votePoll.open && <Text style={styles.hint}>Votação encerrada</Text>}
        </View>
      )}

      <Text style={styles.section}>🔥 Feed de Reações</Text>
      {reactionFeed.length === 0 ? (
        <Text style={styles.hint}>Nenhuma reação ainda. Toque num emoji abaixo para começar.</Text>
      ) : (
        (() => {
          const counts: Record<string, number> = {};
          reactionFeed.forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
          const recent = reactionFeed.slice(-12).reverse();
          return (
            <View>
              <View style={styles.reactCounts}>
                {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([e, n]) => (
                  <View key={e} style={styles.reactCountChip}><Text style={styles.reactCountText}>{e} {n}</Text></View>
                ))}
              </View>
              <View style={styles.reactFeed}>
                {recent.map((r, i) => (
                  <Text key={i} style={styles.reactFeedItem}>{r.emoji}</Text>
                ))}
              </View>
            </View>
          );
        })()
      )}

      <Text style={styles.section}>Controle do Vídeo</Text>
      <View style={styles.ctrlRow}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => sendControl('play')}><Text style={styles.ctrlText}>▶ Play</Text></TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => sendControl('pause')}><Text style={styles.ctrlText}>⏸ Pause</Text></TouchableOpacity>
      </View>
      <View style={styles.ctrlRow}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => sendControl('volup')}><Text style={styles.ctrlText}>🔊 +</Text></TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => sendControl('voldown')}><Text style={styles.ctrlText}>🔉 -</Text></TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => sendControl('mute')}><Text style={styles.ctrlText}>🔇 Mute</Text></TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => sendControl('unmute')}><Text style={styles.ctrlText}>🔈 Unmute</Text></TouchableOpacity>
      </View>

      <Text style={styles.section}>Favoritos</Text>
      {favorites.length === 0 ? (
        <Text style={styles.hint}>Nenhum favorito ainda. Toque na estrela de um canal para salvar.</Text>
      ) : (
        <ScrollView style={styles.favList} nestedScrollEnabled>
          {favorites.map((f) => (
            <View key={f.id} style={styles.favItem}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => changeChannelById(f.id)}>
                <Text style={styles.favName} numberOfLines={1}>★ {f.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleFavorite(f)}>
                <Text style={styles.favRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <Text style={styles.section}>Chat ao Vivo</Text>
      <FlatList
        style={styles.chatList}
        data={chatMessages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={[styles.chatBubble, item.from === 'mobile' ? styles.chatMe : styles.chatTv]}>
            <Text style={styles.chatFrom}>{item.from === 'mobile' ? 'Eu' : 'TV'}</Text>
            <Text style={styles.chatText}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.chatInputRow}>
        <TextInput
          style={styles.chatInput}
          placeholder="Mensagem..."
          placeholderTextColor="#888"
          value={chatText}
          onChangeText={setChatText}
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.chatSend} onPress={send}>
          <Text style={styles.chatSendText}>Enviar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Reações</Text>
      <View style={styles.grid}>
        {EMOJIS.map((e) => (
          <TouchableOpacity key={e} style={styles.emojiBtn} onPress={() => sendReaction(e)}>
            <Text style={styles.emoji}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0f1014' },
  scroll: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', textAlign: 'center', marginBottom: 10 },
  status: { color: '#aaa', textAlign: 'center', marginBottom: 16 },
  tvSelector: { marginBottom: 8 },
  tvRow: { flexDirection: 'row', paddingVertical: 4 },
  tvChip: { backgroundColor: '#1c1c1f', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, borderWidth: 1, borderColor: '#444' },
  tvChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  tvChipText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  tvChipTextActive: { color: '#000' },
  section: { color: '#FFD700', fontWeight: 'bold', fontSize: 16, marginTop: 16, marginBottom: 8 },
  hint: { color: '#888', fontStyle: 'italic' },
  chList: { maxHeight: 160, backgroundColor: '#1c1c1f', borderRadius: 12, padding: 8 },
  chRow: { flexDirection: 'row', alignItems: 'center' },
  chItem: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#2a2a2e' },
  chName: { color: '#fff', fontSize: 15 },
  shareBtn: { backgroundColor: '#FFD700', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginLeft: 8 },
  shareText: { fontSize: 18 },
  ctrlRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  ctrlBtn: { backgroundColor: '#2a2a2e', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  ctrlText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  voteBox: { backgroundColor: '#1c1c1f', borderRadius: 12, padding: 12, marginTop: 8 },
  voteQ: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  voteOpt: { paddingVertical: 8, marginBottom: 6 },
  voteBarBg: { height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  voteBar: { height: 6, backgroundColor: '#FFD700', borderRadius: 3 },
  voteRow: { flexDirection: 'row', justifyContent: 'space-between' },
  voteOptText: { color: '#fff', fontSize: 14 },
  votePct: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  dpad: { alignItems: 'center', marginTop: 4 },
  dpadRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 8 },
  dpadSpacer: { width: 64 },
  dpadBtn: { width: 64, height: 64, backgroundColor: '#2a2a2e', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dpadOk: { backgroundColor: '#FFD700' },
  dpadText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  nowBox: { backgroundColor: '#2a1f00', borderColor: '#FFD700', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  nowLabel: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
  nowName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  nowBtns: { flexDirection: 'row', gap: 8, marginTop: 6 },
  nowBtn: { backgroundColor: '#FFD700', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, flex: 1 },
  nowBtn2: { backgroundColor: '#444' },
  nowBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  reactCounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  reactCountChip: { backgroundColor: '#2a2a2e', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12 },
  reactCountText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  reactFeed: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  reactFeedItem: { fontSize: 24 },
  statsBox: { backgroundColor: '#1c1c1f', borderRadius: 12, padding: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#2a2a2e', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  statNum: { color: '#FFD700', fontSize: 22, fontWeight: 'bold' },
  statLbl: { color: '#aaa', fontSize: 11, marginTop: 2 },
  statsBeepix: { marginTop: 10, backgroundColor: '#2a1f00', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  statBeepixText: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
  statsBtn: { marginTop: 10, backgroundColor: '#FFD700', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  statsBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  toast: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  toastOn: { backgroundColor: '#1f6b2e' },
  toastOff: { backgroundColor: '#6b1f1f' },
  toastText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  profileBox: { backgroundColor: '#2a1f00', borderColor: '#FFD700', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileLabel: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  profileBeepix: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  profileBtn: { backgroundColor: '#FFD700', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  profileBtnText: { color: '#000', fontSize: 13, fontWeight: 'bold' },
  favList: { maxHeight: 140, backgroundColor: '#1c1c1f', borderRadius: 12, padding: 8 },
  favItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2e' },
  favName: { color: '#fff', fontSize: 14 },
  favRemove: { color: '#ff5555', fontSize: 16, fontWeight: 'bold', paddingHorizontal: 8 },
  chatList: { maxHeight: 180, backgroundColor: '#1c1c1f', borderRadius: 12, padding: 8 },
  chatBubble: { padding: 10, borderRadius: 12, marginBottom: 6, maxWidth: '85%' },
  chatMe: { backgroundColor: '#FFD700', alignSelf: 'flex-end' },
  chatTv: { backgroundColor: '#2a2a2e', alignSelf: 'flex-start' },
  chatFrom: { fontSize: 10, opacity: 0.6, marginBottom: 2 },
  chatText: { color: '#fff', fontSize: 14 },
  chatInputRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  chatInput: { flex: 1, backgroundColor: '#1c1c1f', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff' },
  chatSend: { backgroundColor: '#FFD700', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  chatSendText: { color: '#000', fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 8 },
  emojiBtn: { width: 64, height: 64, backgroundColor: '#1c1c1f', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFD700' },
  emoji: { fontSize: 30 },
});
export default TVRemote;
