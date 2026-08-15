import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert, useColorScheme } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTVSocket } from '../contexts/SocketContext';
import { QrCode, Tv, AlertCircle, CheckCircle2, Zap, Lightbulb } from 'lucide-react-native';
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

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Se o status mudar para pareado, chama o callback de sucesso
  useEffect(() => {
    if (pairStatus === 'paired') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (typeof onPairSuccess === 'function') {
        onPairSuccess();
      }
    }
  }, [pairStatus, onPairSuccess]);

  // Se digitar 6 digitos, tenta parear automaticamente
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

  // Trata o escaneamento do QR Code
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || pairStatus === 'pairing') return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Suporta link formato beepapp://sync?pin=XXXXXX, beep://pair?pin=XXXXXX ou apenas o PIN cru
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
        // Permite re-scan apos 3 segundos
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

  const tabBgColor = isDark ? '#1c1c1f' : '#e2e8f0';
  const inputBgColor = isDark ? '#1c1c1f' : '#ffffff';
  const inputBorderColor = isDark ? '#2d2d30' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subTextColor = isDark ? '#888888' : '#666666';
  const dividerColor = isDark ? '#222' : '#e2e8f0';

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: tabBgColor }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pin' && styles.tabActive]}
          onPress={() => setActiveTab('pin')}
        >
          <Tv size={16} color={activeTab === 'pin' ? '#000' : subTextColor} />
          <Text style={[styles.tabText, activeTab === 'pin' && styles.tabTextActive, { color: activeTab === 'pin' ? '#000' : subTextColor }]}>PIN da TV</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qr' && styles.tabActive]}
          onPress={() => setActiveTab('qr')}
        >
          <QrCode size={16} color={activeTab === 'qr' ? '#000' : subTextColor} />
          <Text style={[styles.tabText, activeTab === 'qr' && styles.tabTextActive, { color: activeTab === 'qr' ? '#000' : subTextColor }]}>QR Code</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'pin' ? (
        <View style={styles.content}>
          <Text style={[styles.instructions, { color: subTextColor }]}>
            Digite o PIN de 6 digitos exibido na tela da sua TV BeepApp.
          </Text>

          {/* PIN Input */}
          <View style={[styles.inputWrapper, { backgroundColor: inputBgColor, borderColor: inputBorderColor }]}>
            <TextInput
              style={[styles.textInput, { color: textColor }]}
              placeholder="000000"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
              maxLength={6}
              keyboardType="number-pad"
              value={pin}
              onChangeText={(txt) => setPin(txt.replace(/\D/g, ''))}
              editable={pairStatus !== 'pairing'}
            />
          </View>

          {pairStatus === 'pairing' && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#ffcc00" size="small" />
              <Text style={styles.loadingText}>Conectando com a TV...</Text>
            </View>
          )}

          {pairStatus === 'error' && (
            <View style={styles.errorRow}>
              <AlertCircle color="#ff5555" size={16} />
              <Text style={styles.errorText}>{pairError || 'Erro ao conectar. Verifique o PIN.'}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.pairButton, pin.length !== 6 && styles.pairButtonDisabled]}
            disabled={pin.length !== 6 || pairStatus === 'pairing'}
            onPress={handlePair}
          >
            <Text style={styles.pairButtonText}>Parear com a TV</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <Text style={[styles.dividerText, { color: subTextColor }]}>ou</Text>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          </View>

          <TouchableOpacity
            style={[styles.autoPairButton, { borderColor: isDark ? 'rgba(255,204,0,0.3)' : 'rgba(255,204,0,0.5)', backgroundColor: isDark ? 'rgba(255,204,0,0.05)' : 'rgba(255,204,0,0.1)' }]}
            onPress={handleAutoPair}
            disabled={pairStatus === 'pairing'}
          >
            <Zap size={16} color="#ffcc00" />
            <Text style={styles.autoPairText}>Vincular automaticamente na rede</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.qrContent}>
          {hasPermission?.granted ? (
            <View style={styles.cameraWrapper}>
              <CameraView
                style={StyleSheet.absoluteFill}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                facing="back"
                enableTorch={torchOn}
              />
              {/* Overlay visual do Scanner */}
              <View style={styles.overlayFrame}>
                <View style={styles.scanTarget}>
                  <View style={styles.laserLine} />
                </View>
              </View>

              {/* Botoes da camera */}
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.torchBtn}
                  onPress={() => setTorchOn(!torchOn)}
                >
                  <Lightbulb size={20} color={torchOn ? '#ffcc00' : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.permissionWrapper}>
              <QrCode size={48} color={isDark ? '#666' : '#ccc'} style={{ marginBottom: 16 }} />
              <Text style={[styles.permissionTitle, { color: textColor }]}>Acesso a Camera Necessario</Text>
              <Text style={[styles.permissionDesc, { color: subTextColor }]}>
                Precisamos de acesso a camera para ler o QR Code de pareamento exibido na TV.
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={requestCameraPermission}
              >
                <Text style={styles.permissionBtnText}>Ativar Camera</Text>
              </TouchableOpacity>
            </View>
          )}

          {pairStatus === 'pairing' && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#ffcc00" size="large" />
              <Text style={[styles.loadingText, { marginTop: 12 }]}>Pareando...</Text>
            </View>
          )}

          {pairStatus === 'error' && (
            <View style={[styles.errorRow, { marginTop: 16 }]}>
              <AlertCircle color="#ff5555" size={16} />
              <Text style={styles.errorText}>{pairError || 'QR Code invalido ou erro de pareamento.'}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    width: '100%',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#ffcc00',
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#000',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  qrContent: {
    width: '100%',
    alignItems: 'center',
    height: 280,
  },
  instructions: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputWrapper: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    marginBottom: 16,
  },
  textInput: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  loadingText: {
    color: '#ffcc00',
    fontSize: 14,
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 85, 85, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 16,
  },
  errorText: {
    color: '#ff5555',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  pairButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#ffcc00',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pairButtonDisabled: {
    backgroundColor: '#2a2a2e',
    opacity: 0.5,
  },
  pairButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  autoPairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
  },
  autoPairText: {
    color: '#ffcc00',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cameraWrapper: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  overlayFrame: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanTarget: {
    width: 140,
    height: 140,
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 12,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  laserLine: {
    height: 2,
    backgroundColor: '#ffcc00',
    width: '100%',
    position: 'absolute',
    top: '50%',
    shadowColor: '#ffcc00',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  cameraControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  torchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: '#ffcc00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,16,20,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
