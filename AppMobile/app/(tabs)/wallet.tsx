import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, Dimensions, StyleSheet, Alert } from 'react-native';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, TrendingUp, Gift, Music, Zap, Send, Key, Copy, Check, X, QrCode, Trophy, Store, Ticket } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, FadeOut } from 'react-native-reanimated';
import { usePoints } from '../../contexts/PointsContext';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { PageHeader } from '../../components/PageHeader';
import { initialVouchers, Voucher } from '../../constants/vouchers';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { useAuth } from '../../contexts/AuthContext';

const hostIp = Constants.expoConfig?.hostUri?.split(':')[0] || '10.0.2.2';
const socket = io(`http://${hostIp}:3001`);

export default function WalletScreen() {
  const { width } = Dimensions.get('window');
  const { user } = useAuth();
  const { totalPoints, removePoints, transactions, myBeepixKey, generateBeepixKey, sendBeepix } = usePoints();
  const insets = useSafeAreaInsets();
  const [activeModal, setActiveModal] = useState<"transfer" | "beepix" | "redeem_success" | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [copied, setCopied] = useState(false);
  const [redeemedProduct, setRedeemedProduct] = useState("");

  const handleRedeem = (voucher: Voucher) => {
    if (totalPoints < voucher.cost) {
      Alert.alert("Saldo Insuficiente", "Você não tem Bips suficientes para este resgate.");
      return;
    }
    Alert.alert(
      "Confirmar Resgate",
      `Deseja trocar ${voucher.cost} Bips por: ${voucher.brand} - ${voucher.product}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: () => {
            removePoints(voucher.cost, `Resgate: ${voucher.brand} - ${voucher.product}`);
            setRedeemedProduct(`${voucher.brand} - ${voucher.product}`);
            setActiveModal("redeem_success");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Emit redeem event
            socket.emit('redeem_voucher', {
              voucherId: voucher.id,
              userName: user?.name || "Usuário Beep"
            });
          }
        }
      ]
    );
  };

  const totalEarned = transactions.filter(t => t.type === "earned").reduce((s, t) => s + t.amount, 0);
  const totalSpent = Math.abs(transactions.filter(t => t.type === "spent").reduce((s, t) => s + t.amount, 0));

  const handleTransfer = () => {
    const amount = parseInt(transferAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Erro", "Por favor, insira um valor válido de pontos.");
      return;
    }
    if (amount > totalPoints) {
      Alert.alert("Erro", "Saldo insuficiente para esta transferência.");
      return;
    }
    
    // Executa a transferência via P2P Socket
    const success = sendBeepix(transferTo, amount, user?.name || "Usuário BEEP");
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveModal(null);
      setTransferAmount("");
      setTransferTo("");
      Alert.alert("Sucesso", "Transferência enviada! O destinatário receberá em instantes.");
    }
  };

  const glareX = useSharedValue(-width);

  useEffect(() => {
    glareX.value = withRepeat(
      withSequence(
        withTiming(width * 1.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-width, { duration: 0 }),
        withTiming(-width, { duration: 4000 })
      ),
      -1,
      false
    );
  }, []);

  const glareStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glareX.value }, { skewX: '-12deg' }],
  }));

  const dotAnim = useSharedValue(0);

  useEffect(() => {
    dotAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + dotAnim.value * 0.4 }],
    opacity: 1 - dotAnim.value * 0.4,
  }));

  const handleGenerateBeepix = () => {
    generateBeepixKey();
    setCopied(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCopyKey = () => {
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Carteira" totalPoints={totalPoints} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="rounded-2xl overflow-hidden mb-5" style={{ elevation: 8, shadowColor: '#ffcc00', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 32 }}>
          <LinearGradient colors={['#ffcc00', '#ffcc00', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, position: 'relative' }}>
            <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: '50%', backgroundColor: 'rgba(255,255,255,0.15)' }, glareStyle]} />
            
            <View className="flex-row items-center gap-2 mb-1">
              <WalletIcon size={16} color="rgba(0,0,0,0.7)" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-black/70">Saldo disponível</Text>
              {myBeepixKey ? (
                <View className="items-center">
                  <View className="bg-muted p-4 rounded-xl mb-4 border border-border">
                    <Text className="text-foreground font-mono text-xl tracking-widest">{myBeepixKey}</Text>
                  </View>
                  <TouchableOpacity onPress={handleCopyKey} className="flex-row items-center gap-2 bg-primary/20 px-6 py-3 rounded-xl">
                    {copied ? <Check size={20} color="#ffcc00" /> : <Copy size={20} color="#ffcc00" />}
                    <Text className="text-primary font-bold">{copied ? 'Chave Copiada!' : 'Copiar Chave'}</Text>
                  </TouchableOpacity>
                  <Text className="text-muted-foreground text-xs text-center mt-4 px-4">
                    Passe esta chave para um amigo e você receberá Bips instantaneamente mesmo com o app minimizado!
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-1.5 bg-black/10 rounded-xl px-3 py-1.5">
                  <ArrowUpRight size={12} color="#800000" />
                  <Text className="text-xs font-bold text-black/90">-{totalSpent}</Text>
                </View>
              )}
            </View>
            
            <View className="flex-row items-baseline gap-1.5 mb-4">
              <Text className="text-4xl font-black text-black">{totalPoints}</Text>
              <Text className="text-sm font-bold text-black/60">pts</Text>
            </View>
            
            <View className="flex-row gap-3">
              <View className="flex-row items-center gap-1.5 bg-black/10 rounded-xl px-3 py-1.5">
                <ArrowDownLeft size={12} color="#004d00" />
                <Text className="text-xs font-bold text-black/90">+{totalEarned}</Text>
              </View>
              <View className="flex-row items-center gap-1.5 bg-black/10 rounded-xl px-3 py-1.5">
                <ArrowUpRight size={12} color="#800000" />
                <Text className="text-xs font-bold text-black/90">-{totalSpent}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="flex-row gap-3 mb-6">
          <TouchableOpacity 
            onPress={() => { setActiveModal("transfer"); Haptics.impactAsync(); }}
            className="flex-1 flex-row items-center gap-3 bg-card rounded-xl p-4 border border-border/50"
          >
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Send size={18} color="#ffcc00" />
            </View>
            <View>
              <Text className="text-sm font-bold text-foreground">Transferir</Text>
              <Text className="text-[10px] text-muted-foreground">Enviar pontos</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => { setActiveModal("beepix"); handleGenerateBeepix(); }}
            className="flex-1 flex-row items-center gap-3 bg-card rounded-xl p-4 border border-border/50"
          >
            <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center">
              <Key size={18} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-sm font-bold text-foreground">Beepix</Text>
              <Text className="text-[10px] text-muted-foreground">Gerar chave</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Marketplace Beep */}
        <Animated.View entering={FadeInDown.delay(250).springify()} className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Store size={18} color="#eab308" />
            <Text className="font-bold text-sm text-foreground">Loja de Recompensas</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {initialVouchers.map((v) => (
              <TouchableOpacity 
                key={v.id}
                onPress={() => handleRedeem(v)}
                className="bg-card border border-border/50 rounded-2xl p-4 w-48 relative overflow-hidden"
              >
                {v.status === 'Ativo' && v.id === 1 && (
                  <View className="absolute top-0 right-0 bg-yellow-500 px-2 py-1 rounded-bl-lg">
                    <Text className="text-[10px] font-bold text-black uppercase">Destaque</Text>
                  </View>
                )}
                <Text className="font-black text-foreground text-base mt-2">{v.brand}</Text>
                <Text className="text-muted-foreground text-xs mb-3">{v.product}</Text>
                <View className="flex-row justify-between items-center mt-auto">
                  <Text className="text-yellow-500 font-black">{v.cost} Bips</Text>
                  <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                    <ArrowUpRight size={12} color="#ffcc00" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Section title */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="flex-row items-center gap-2 mb-4">
          <Animated.View 
            className="w-1.5 h-1.5 rounded-full bg-primary"
            style={[dotStyle, { shadowColor: '#ffcc00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 }]}
          />
          <Text className="font-bold text-sm text-foreground">Extrato</Text>
        </Animated.View>

        {/* Transactions */}
        <View className="gap-2.5">
          {transactions.map((tx, index) => {
            const Icon = tx.icon;
            const isEarned = tx.type === "earned";
            return (
              <Animated.View 
                key={tx.id} 
                entering={FadeInDown.delay(350 + (index * 50)).springify()}
                className="flex-row items-center gap-3 bg-card rounded-xl p-3.5 border border-border/50"
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center ${isEarned ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  <Icon size={18} color={isEarned ? "#22c55e" : "#f87171"} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{tx.label}</Text>
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>{tx.description}</Text>
                </View>
                <View className="items-end shrink-0">
                  <Text className={`text-sm font-bold tabular-nums ${isEarned ? "text-green-500" : "text-red-400"}`}>
                    {isEarned ? "+" : ""}{tx.amount} pts
                  </Text>
                  <Text className="text-[10px] text-muted-foreground">{tx.date}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Modals */}
      <Modal visible={activeModal !== null} transparent animationType="fade">
        <Pressable style={StyleSheet.absoluteFill} className="bg-black/60" onPress={() => setActiveModal(null)} />
        
        <Animated.View entering={SlideInDown.springify()} exiting={SlideOutDown} className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[32px] p-6 border-t border-border/50" style={{ paddingBottom: Math.max(insets.bottom + 40, 80) }}>
          <View className="w-12 h-1.5 rounded-full bg-border mx-auto mb-6" />

          {activeModal === "transfer" && (
            <View>
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-black text-foreground">Transferir Pontos</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-muted items-center justify-center">
                  <X size={16} color="#888" />
                </TouchableOpacity>
              </View>

              <View className="gap-4 mb-6">
                <View>
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Beepix do destinatário</Text>
                  <TextInput
                    value={transferTo}
                    onChangeText={setTransferTo}
                    placeholder="BPX-XXXXX-XXXXX-XXXXX-XXXXX"
                    placeholderTextColor="#666"
                    className="w-full h-14 bg-muted rounded-2xl px-4 text-base text-foreground"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Quantidade</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={transferAmount}
                    onChangeText={setTransferAmount}
                    placeholder="0"
                    placeholderTextColor="#666"
                    className="w-full h-14 bg-muted rounded-2xl px-4 text-base text-foreground"
                  />
                  <Text className="text-[11px] text-muted-foreground mt-2 font-medium">Saldo disponível: {totalPoints} pts</Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleTransfer} className="w-full h-14 bg-primary rounded-2xl items-center justify-center flex-row gap-2 active:opacity-80">
                <Text className="text-black font-bold text-base">Enviar Pontos</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeModal === "beepix" && (
            <View>
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-black text-foreground">Sua Chave Beepix</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-muted items-center justify-center">
                  <X size={16} color="#888" />
                </TouchableOpacity>
              </View>

              <View className="items-center justify-center py-6">
                <View className="w-48 h-48 bg-white p-2 rounded-2xl mb-6 shadow-sm border border-border/50">
                  <QrCode size={174} color="#000" />
                </View>
                <Text className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Chave Gerada</Text>
                
                <TouchableOpacity 
                  onPress={handleCopyKey}
                  className="flex-row items-center justify-center gap-2 bg-muted px-4 py-3 rounded-xl w-full"
                >
                  <Text className="text-base font-mono text-foreground font-bold">{myBeepixKey}</Text>
                  {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} color="#888" />}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeModal === "redeem_success" && (
            <View className="items-center py-6">
              <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-4">
                <Check size={32} color="#22c55e" />
              </View>
              <Text className="text-2xl font-black text-foreground text-center mb-2">Resgate Concluído!</Text>
              <Text className="text-base text-muted-foreground text-center mb-6">
                Você resgatou com sucesso:{"\n"}<Text className="font-bold text-foreground">{redeemedProduct}</Text>
              </Text>

              <View className="w-40 h-40 bg-white p-2 rounded-2xl mb-6 items-center justify-center">
                 <QrCode size={140} color="#000" />
              </View>
              <Text className="text-xs text-muted-foreground mb-6">Apresente este QR Code no estabelecimento.</Text>

              <TouchableOpacity onPress={() => setActiveModal(null)} className="w-full h-14 bg-primary rounded-2xl items-center justify-center flex-row gap-2 active:opacity-80">
                <Text className="text-black font-bold text-base">Fechar</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Modal>
    </View>
  );
}
