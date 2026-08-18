import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, FlatList, Share } from 'react-native';
import { router } from 'expo-router';
import { useTVSocket } from '../contexts/SocketContext';
import PairingContainer from './PairingContainer';
import { PageHeader } from '../../components/PageHeader';
import { usePoints } from '../../contexts/PointsContext';
import { LinearGradient } from 'expo-linear-gradient';

const EMOJIS = ['🔥', '❤️', '😂', '😮', '👏', '🎉', '💛', '⚡'];

function Section({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <View className="w-1.5 h-1.5 rounded-full bg-primary" />
      <Text className="font-bold text-sm text-foreground">{children}</Text>
    </View>
  );
}

export const TVRemote = () => {
  const { totalPoints } = usePoints();
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
      <View className="flex-1 bg-background">
        <PageHeader title="Conectar TV" totalPoints={totalPoints} onBack={() => router.back()} />

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#ffcc00', '#ffcc00', '#d97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-5 mb-5"
            style={{ elevation: 8, shadowColor: '#ffcc00', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 32 }}
          >
            <Text className="text-xs font-semibold uppercase tracking-wider text-black/70">Bips disponíveis</Text>
            <View className="flex-row items-baseline gap-1.5 mb-2">
              <Text className="text-4xl font-black text-black">{totalPoints}</Text>
              <Text className="text-sm font-bold text-black/60">pts</Text>
            </View>
            <Text className="text-black/80 text-xs">{connected ? '🟢 Conectado à TV' : '🟡 Conectando...'}</Text>
          </LinearGradient>

          <View className="bg-card rounded-xl p-4 border border-border/50">
            <PairingContainer
              onPairSuccess={() => {}}
              onClose={() => router.back()}
            />
          </View>
        </ScrollView>
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
    <View className="flex-1 bg-background">
      <PageHeader title="Conectar TV" totalPoints={totalPoints} onBack={() => router.back()} />

      {toast && (
        <View className={`mx-4 py-2.5 px-4 rounded-xl mb-2.5 items-center ${tvOnline ? 'bg-green-700' : 'bg-red-800'}`}>
          <Text className="text-white text-[15px] font-bold">{toast}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Card de destaque (igual ao card de saldo da Carteira) */}
        <LinearGradient
          colors={['#ffcc00', '#ffcc00', '#d97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-2xl p-5 mb-5"
          style={{ elevation: 8, shadowColor: '#ffcc00', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 32 }}
        >
          <Text className="text-xs font-semibold uppercase tracking-wider text-black/70">Bips disponíveis</Text>
          <View className="flex-row items-baseline gap-1.5 mb-2">
            <Text className="text-4xl font-black text-black">{totalPoints}</Text>
            <Text className="text-sm font-bold text-black/60">pts</Text>
          </View>
          <Text className="text-black/80 text-xs">Sala: {pairedRoom}  {tvOnline ? '🟢 TV Online' : '🔴 TV Offline'}</Text>
        </LinearGradient>

        {/* Seletor de TV (1 celular controla várias TVs) */}
        {pairedTVs.length > 1 && (
          <View className="mb-4">
            <Section>📺 TVs pareadas ({pairedTVs.length})</Section>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {pairedTVs.map((t) => (
                <TouchableOpacity
                  key={t.pin}
                  className={`bg-card rounded-full py-2 px-4 border ${activePin === t.pin ? 'bg-primary border-primary' : 'border-border/50'}`}
                  onPress={() => selectTV(t.pin)}
                >
                  <Text className={`text-xs font-bold ${activePin === t.pin ? 'text-black' : 'text-foreground'}`}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Perfil único Beepix (servidor) */}
        <View className="bg-card rounded-xl p-4 border border-border/50 flex-row items-center justify-between mb-4">
          <Text className="text-primary text-xs font-bold">⭐ Perfil Beepix</Text>
          <Text className="text-foreground text-xl font-bold flex-1 text-center">{beepix != null ? beepix.toLocaleString('pt-BR') : '—'}</Text>
          <TouchableOpacity className="bg-primary rounded-2xl py-2 px-3" onPress={getBeepix}><Text className="text-black text-xs font-bold">🔄 Sincronizar</Text></TouchableOpacity>
        </View>

        {nowWatching && (
          <View className="bg-card rounded-xl p-4 border border-primary/50 mb-4">
            <Text className="text-primary text-xs font-bold">📺 Assistindo agora</Text>
            <Text className="text-foreground text-lg font-bold my-1">{nowWatching.name}</Text>
            <View className="flex-row gap-2 mt-1.5">
              <TouchableOpacity className="bg-primary rounded-2xl py-2.5 px-3 flex-1" onPress={() => changeChannelById(nowWatching.channelId || '')}>
                <Text className="text-black text-sm font-bold text-center">▶ Continuar na TV</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-muted rounded-xl py-2.5 px-3 flex-1" onPress={() => setNowWatching(nowWatching)}>
                <Text className="text-foreground text-sm font-bold text-center">🔄 Sincronizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Section>📊 Estatísticas</Section>
        {stats ? (
          <View className="bg-card rounded-xl p-4 border border-border/50 mb-4">
            <View className="flex-row justify-between gap-2">
              <View className="flex-1 bg-muted rounded-xl py-3 items-center">
                <Text className="text-primary text-2xl font-bold">{stats.reactionCount}</Text>
                <Text className="text-muted-foreground text-[11px] mt-0.5">Reações</Text>
              </View>
              <View className="flex-1 bg-muted rounded-xl py-3 items-center">
                <Text className="text-primary text-2xl font-bold">{stats.channelsWatched}</Text>
                <Text className="text-muted-foreground text-[11px] mt-0.5">Canais</Text>
              </View>
              <View className="flex-1 bg-muted rounded-xl py-3 items-center">
                <Text className="text-primary text-2xl font-bold">{Math.floor(stats.watchSeconds / 60)}</Text>
                <Text className="text-muted-foreground text-[11px] mt-0.5">Min assist.</Text>
              </View>
            </View>
            <View className="mt-2.5 bg-primary/10 rounded-xl py-2.5 items-center">
              <Text className="text-primary text-base font-bold">⭐ Beepix: {stats.beepix}</Text>
            </View>
            <TouchableOpacity className="mt-2.5 bg-primary rounded-2xl py-2.5 items-center" onPress={getStats}>
              <Text className="text-black text-sm font-bold">🔄 Atualizar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text className="text-muted-foreground italic mb-4">Carregando estatísticas...</Text>
        )}

        <Section>Canais da TV</Section>
        {!tvOnline ? (
          <Text className="text-muted-foreground italic mb-4">Aguardando a TV ficar online...</Text>
        ) : channels.length === 0 ? (
          <ActivityIndicator color="#ffcc00" />
        ) : (
          <View className="bg-card rounded-xl p-2 border border-border/50 mb-4">
            <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
              {channels.map((c) => (
                <View key={c.id} className="flex-row items-center">
                  <TouchableOpacity
                    className="flex-1 py-3 px-3.5 border-b border-border/50"
                    onPress={() => changeChannelById(c.id)}
                  >
                    <Text className="text-foreground text-[15px]" numberOfLines={1}>{c.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="bg-primary rounded-2xl py-3 px-3.5 ml-2" onPress={() => shareChannel(c)}>
                    <Text className="text-lg">📤</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* D-Pad virtual */}
        <Section>🎯 D-Pad (espelha na TV)</Section>
        <View className="items-center mb-4">
          <View className="flex-row justify-center items-center gap-3 mb-2">
            <View className="w-16" />
            <TouchableOpacity className="w-16 h-16 bg-muted rounded-2xl items-center justify-center" onPress={() => sendKey('ArrowUp')}><Text className="text-foreground text-2xl font-bold">▲</Text></TouchableOpacity>
            <View className="w-16" />
          </View>
          <View className="flex-row justify-center items-center gap-3 mb-2">
            <TouchableOpacity className="w-16 h-16 bg-muted rounded-2xl items-center justify-center" onPress={() => sendKey('ArrowLeft')}><Text className="text-foreground text-2xl font-bold">◀</Text></TouchableOpacity>
            <TouchableOpacity className="w-16 h-16 bg-primary rounded-2xl items-center justify-center" onPress={() => sendKey('Enter')}><Text className="text-foreground text-2xl font-bold">OK</Text></TouchableOpacity>
            <TouchableOpacity className="w-16 h-16 bg-muted rounded-2xl items-center justify-center" onPress={() => sendKey('ArrowRight')}><Text className="text-foreground text-2xl font-bold">▶</Text></TouchableOpacity>
          </View>
          <View className="flex-row justify-center items-center gap-3">
            <View className="w-16" />
            <TouchableOpacity className="w-16 h-16 bg-muted rounded-2xl items-center justify-center" onPress={() => sendKey('ArrowDown')}><Text className="text-foreground text-2xl font-bold">▼</Text></TouchableOpacity>
            <TouchableOpacity className="w-16 h-16 bg-muted rounded-2xl items-center justify-center" onPress={() => sendKey('Backspace')}><Text className="text-foreground text-2xl font-bold">⏏</Text></TouchableOpacity>
          </View>
        </View>

        {votePoll && (
          <View className="bg-card rounded-xl p-4 border border-border/50 mb-4">
            <Section>🗳️ Votação</Section>
            <Text className="text-foreground text-[15px] font-bold mb-2">{votePoll.question}</Text>
            {votePoll.options.map((opt: string, i: number) => {
              const tally = Array.isArray(votePoll.tally) ? votePoll.tally : [];
              const total = tally.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
              const pct = total > 0 ? Math.round(((tally[i] || 0) / total) * 100) : 0;
              return (
                <TouchableOpacity key={i} className="py-2 mb-1.5" onPress={() => castVote(i)} disabled={!votePoll.open}>
                  <View className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                    <View className="h-1.5 bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-foreground text-sm">{opt}</Text>
                    <Text className="text-primary text-xs font-bold">{pct}% ({votePoll.tally[i]})</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {!votePoll.open && <Text className="text-muted-foreground italic">Votação encerrada</Text>}
          </View>
        )}

        <Section>🔥 Feed de Reações</Section>
        {reactionFeed.length === 0 ? (
          <Text className="text-muted-foreground italic mb-4">Nenhuma reação ainda. Toque num emoji abaixo para começar.</Text>
        ) : (
          (() => {
            const counts: Record<string, number> = {};
            reactionFeed.forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
            const recent = reactionFeed.slice(-12).reverse();
            return (
              <View className="mb-4">
                <View className="flex-row flex-wrap gap-2 mt-1">
                  {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([e, n]) => (
                    <View key={e} className="bg-muted rounded-xl py-1.5 px-3">
                      <Text className="text-foreground text-base font-bold">{e} {n}</Text>
                    </View>
                  ))}
                </View>
                <View className="flex-row flex-wrap gap-1 mt-2">
                  {recent.map((r, i) => (
                    <Text key={i} className="text-2xl">{r.emoji}</Text>
                  ))}
                </View>
              </View>
            );
          })()
        )}

        <Section>Controle do Vídeo</Section>
        <View className="flex-row flex-wrap gap-2 mb-4">
          <TouchableOpacity className="bg-muted rounded-xl py-2.5 px-3.5" onPress={() => sendControl('play')}><Text className="text-foreground text-sm font-bold">▶ Play</Text></TouchableOpacity>
          <TouchableOpacity className="bg-muted rounded-xl py-2.5 px-3.5" onPress={() => sendControl('pause')}><Text className="text-foreground text-sm font-bold">⏸ Pause</Text></TouchableOpacity>
          <TouchableOpacity className="bg-muted rounded-xl py-2.5 px-3.5" onPress={() => sendControl('volup')}><Text className="text-foreground text-sm font-bold">🔊 +</Text></TouchableOpacity>
          <TouchableOpacity className="bg-muted rounded-xl py-2.5 px-3.5" onPress={() => sendControl('voldown')}><Text className="text-foreground text-sm font-bold">🔉 -</Text></TouchableOpacity>
          <TouchableOpacity className="bg-muted rounded-xl py-2.5 px-3.5" onPress={() => sendControl('mute')}><Text className="text-foreground text-sm font-bold">🔇 Mute</Text></TouchableOpacity>
          <TouchableOpacity className="bg-muted rounded-xl py-2.5 px-3.5" onPress={() => sendControl('unmute')}><Text className="text-foreground text-sm font-bold">🔈 Unmute</Text></TouchableOpacity>
        </View>

        <Section>Favoritos</Section>
        {favorites.length === 0 ? (
          <Text className="text-muted-foreground italic mb-4">Nenhum favorito ainda. Toque na estrela de um canal para salvar.</Text>
        ) : (
          <View className="bg-card rounded-xl p-2 border border-border/50 mb-4">
            <ScrollView nestedScrollEnabled style={{ maxHeight: 140 }}>
              {favorites.map((f) => (
                <View key={f.id} className="flex-row items-center py-2 px-3 border-b border-border/50">
                  <TouchableOpacity className="flex-1" onPress={() => changeChannelById(f.id)}>
                    <Text className="text-foreground text-sm" numberOfLines={1}>★ {f.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleFavorite(f)}>
                    <Text className="text-red-400 text-base font-bold px-2">✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Section>Chat ao Vivo</Section>
        <FlatList
          className="bg-card rounded-xl p-2 border border-border/50 mb-4"
          style={{ maxHeight: 180 }}
          data={chatMessages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View className={`p-2.5 rounded-xl mb-1.5 max-w-[85%] ${item.from === 'mobile' ? 'bg-primary self-end' : 'bg-muted self-start'}`}>
              <Text className="text-[10px] opacity-60 mb-0.5">{item.from === 'mobile' ? 'Eu' : 'TV'}</Text>
              <Text className="text-foreground text-sm">{item.text}</Text>
            </View>
          )}
        />
        <View className="flex-row mb-4 gap-2">
          <TextInput
            className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-foreground"
            placeholder="Mensagem..."
            placeholderTextColor="#888"
            value={chatText}
            onChangeText={setChatText}
            onSubmitEditing={send}
          />
          <TouchableOpacity className="bg-primary rounded-2xl px-4 justify-center" onPress={send}>
            <Text className="text-black font-bold">Enviar</Text>
          </TouchableOpacity>
        </View>

        <Section>Reações</Section>
        <View className="flex-row flex-wrap justify-center gap-3 mb-4">
          {EMOJIS.map((e) => (
            <TouchableOpacity key={e} className="w-16 h-16 bg-card rounded-2xl items-center justify-center border border-primary/50" onPress={() => sendReaction(e)}>
              <Text className="text-3xl">{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default TVRemote;
