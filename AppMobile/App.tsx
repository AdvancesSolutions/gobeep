import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';

export default function App() {
  const [loading, setLoading] = useState(false);

  const checkOtaUpdate = async () => {
    setLoading(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert('🔄 Atualização Encontrada!', 'Baixando nova versão...');
        await Updates.fetchUpdateAsync();
        Alert.alert('✅ Sucesso!', 'O aplicativo será recarregado agora.', [
          { text: 'OK', onPress: async () => await Updates.reloadAsync() }
        ]);
      } else {
        Alert.alert('Nenhuma atualização', `App rodando versão mais recente.\nChannel: ${Updates.channel}\nRuntime: ${Updates.runtimeVersion}`);
      }
    } catch (error: any) {
      Alert.alert('Erro no OTA', `Detalhes: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkOtaUpdate();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐝 BeepApp Mobile</Text>
      <Text style={styles.subtitle}>Gerenciador de Atualizações OTA</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={checkOtaUpdate}>
          <Text style={styles.btnText}>🔍 Buscar Atualizações OTA Agora</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1014', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 30 },
  button: { backgroundColor: '#FFD700', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 12 },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
});
