import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTVSocket } from '../contexts/SocketContext';
import { QrCode, Tv, AlertCircle, Zap, Lightbulb } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface PairingContainerProps {
  onPairSuccess?: () => void;
  onClose?: () => void;
}

export default function PairingContainer({ onPairSuccess, onClose }: PairingContainerProps) {
  const { connected, pairStatus, pairError, pairTV, autoPair } = useTVSocket();
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState<'pin' | 'qr'>('pin');
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (pairStatus === 'paired') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (typeof onPairSuccess === 'function') {
        onPairSuccess();
      }
    }
  }, [pairStatus, onPairSuccess]);

  useEffect(() => {
    if (pin.length === 6) {
      handlePair();
    }
  }, [pin]);

  const handlePair = async () => {
    if (pin.length !== 6) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await pairTV(pin);
  };

  const handleAutoPair = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await autoPair();
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || pairStatus === 'pairing') return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    let extractedPin = '';
    if (data.includes('pin=')) {
      const parts = data.split('pin=');
      if (parts.length > 1) {
        extractedPin = parts[1].substring(0, 6);
      }
    } else if (/^\d{6}$/.test(data.trim())) {
      extractedPin = data.trim();
    }

    if (extractedPin.length === 6) {
      pairTV(extractedPin).finally(() => {
        setTimeout(() => setScanned(false), 3000);
      });
    } else {
      Alert.alert('Codigo invalido', 'O QR Code escaneado nao e um PIN de pareamento valido.');
      setTimeout(() => setScanned(false), 3000);
    }
  };

  const requestCameraPermission = async () => {
    await requestPermission();
  };

  return (
    <View className="w-full items-center">
      {/* Tabs */}
      <View className="flex-row rounded-2xl bg-muted p-1 mb-6 w-full">
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${activeTab === 'pin' ? 'bg-primary' : ''}`}
          onPress={() => setActiveTab('pin')}
        >
          <Tv size={16} color={activeTab === 'pin' ? '#000' : '#999'} />
          <Text className={`font-bold text-sm ${activeTab === 'pin' ? 'text-black' : 'text-muted-foreground'}`}>PIN da TV</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${activeTab === 'qr' ? 'bg-primary' : ''}`}
          onPress={() => setActiveTab('qr')}
        >
          <QrCode size={16} color={activeTab === 'qr' ? '#000' : '#999'} />
          <Text className={`font-bold text-sm ${activeTab === 'qr' ? 'text-black' : 'text-muted-foreground'}`}>QR Code</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'pin' ? (
        <View className="w-full items-center">
          <Text className="text-muted-foreground text-center text-sm mb-6 leading-5">
            Digite o PIN de 6 digitos exibido na tela da sua TV BeepApp.
          </Text>

          <View className="w-full bg-muted rounded-xl border border-border/50 px-4 py-3 mb-4">
            <TextInput
              className="text-foreground text-3xl font-black text-center tracking-[8px] py-1"
              placeholder="000000"
              placeholderTextColor="rgba(0,0,0,0.35)"
              maxLength={6}
              keyboardType="number-pad"
              value={pin}
              onChangeText={(txt) => setPin(txt.replace(/\D/g, ''))}
              editable={pairStatus !== 'pairing'}
            />
          </View>

          {pairStatus === 'pairing' && (
            <View className="flex-row items-center gap-2 mb-4">
              <ActivityIndicator color="#ffcc00" size="small" />
              <Text className="text-primary text-sm font-semibold">Conectando com a TV...</Text>
            </View>
          )}

          {pairStatus === 'error' && (
            <View className="flex-row items-center gap-2 bg-red-500/10 rounded-xl px-3 py-2.5 w-full mb-4">
              <AlertCircle color="#ff5555" size={16} />
              <Text className="text-red-400 text-[13px] font-bold flex-1">{pairError || 'Erro ao conectar. Verifique o PIN.'}</Text>
            </View>
          )}

          <TouchableOpacity
            className={`w-full h-14 bg-primary rounded-2xl items-center justify-center mb-5 ${pin.length !== 6 ? 'opacity-50' : ''}`}
            disabled={pin.length !== 6 || pairStatus === 'pairing'}
            onPress={handlePair}
          >
            <Text className="text-black font-bold text-base">Parear com a TV</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-3 mb-5 w-full">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-muted-foreground text-xs font-bold">ou</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 w-full h-14 border border-primary/40 bg-primary/10 rounded-2xl"
            onPress={handleAutoPair}
            disabled={pairStatus === 'pairing'}
          >
            <Zap size={16} color="#ffcc00" />
            <Text className="text-primary font-bold text-sm">Vincular automaticamente na rede</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="w-full items-center h-72">
          {hasPermission?.granted ? (
            <View className="w-full h-60 rounded-2xl overflow-hidden bg-black relative">
              <CameraView
                style={{ flex: 1 }}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                facing="back"
                enableTorch={torchOn}
              />
              <View className="absolute inset-0 items-center justify-center bg-black/50">
                <View className="w-36 h-36 border-2 border-primary rounded-xl relative overflow-hidden">
                  <View className="absolute top-1/2 h-0.5 bg-primary w-full" style={{ shadowColor: '#ffcc00', shadowOpacity: 0.8, shadowRadius: 4 }} />
                </View>
              </View>
              <View className="absolute bottom-4 right-4">
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-black/60 items-center justify-center"
                  onPress={() => setTorchOn(!torchOn)}
                >
                  <Lightbulb size={20} color={torchOn ? '#ffcc00' : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center p-4">
              <QrCode size={48} color="#666" style={{ marginBottom: 16 }} />
              <Text className="text-foreground text-base font-bold mb-2">Acesso a Camera Necessario</Text>
              <Text className="text-muted-foreground text-xs text-center mb-4 leading-5">
                Precisamos de acesso a camera para ler o QR Code de pareamento exibido na TV.
              </Text>
              <TouchableOpacity
                className="bg-primary px-5 py-2.5 rounded-xl"
                onPress={requestCameraPermission}
              >
                <Text className="text-black font-bold text-[13px]">Ativar Camera</Text>
              </TouchableOpacity>
            </View>
          )}

          {pairStatus === 'pairing' && (
            <View className="absolute inset-0 bg-background/90 items-center justify-center z-10">
              <ActivityIndicator color="#ffcc00" size="large" />
              <Text className="text-primary text-sm font-semibold mt-3">Pareando...</Text>
            </View>
          )}

          {pairStatus === 'error' && (
            <View className="flex-row items-center gap-2 bg-red-500/10 rounded-xl px-3 py-2.5 w-full mt-4">
              <AlertCircle color="#ff5555" size={16} />
              <Text className="text-red-400 text-[13px] font-bold flex-1">{pairError || 'QR Code invalido ou erro de pareamento.'}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
