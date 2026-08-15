import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Updates from 'expo-updates';

export default function Diagnostics() {
  const [info, setInfo] = useState<any>(null);
  const [check, setCheck] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const d = {
        isEnabled: Updates.isEnabled,
        channel: Updates.channel,
        runtimeVersion: Updates.runtimeVersion,
        updateId: Updates.updateId,
        isEmbeddedLaunch: Updates.isEmbeddedLaunch,
        createdAt: Updates.createdAt,
        checkAutomatically: Updates.checkAutomatically,
      };
      setInfo(d);
      try {
        const r = await Updates.checkForUpdateAsync();
        setCheck(r);
      } catch (e: any) {
        setCheck({ error: e.message });
      }
    })();
  }, []);

  const handleUpdate = async () => {
    if (!Updates.isEnabled) {
      Alert.alert('EAS Update desabilitado', 'Não é possível verificar atualizações neste build.');
      return;
    }
    setUpdating(true);
    setUpdateMsg(null);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setUpdateMsg('✅ Você já tem a versão mais recente.');
        return;
      }
      const fetched = await Updates.fetchUpdateAsync();
      if (fetched.isNew) {
        setUpdateMsg('⬇️ Atualização baixada. Reiniciando...');
        await Updates.reloadAsync();
      } else {
        setUpdateMsg('Nenhuma mudança aplicada.');
      }
    } catch (e: any) {
      setUpdateMsg(`❌ Erro ao atualizar: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView style={styles.wrap}>
      <Text style={styles.title}>🔧 EAS Update Diagnostics</Text>

      <TouchableOpacity
        style={[styles.updateBtn, updating && styles.updateBtnDisabled]}
        onPress={handleUpdate}
        disabled={updating}
      >
        <Text style={styles.updateBtnText}>{updating ? 'Verificando...' : '⬇️ Verificar e instalar atualização'}</Text>
      </TouchableOpacity>
      {updateMsg && <Text style={styles.updateMsg}>{updateMsg}</Text>}

      <Text style={styles.sub}>Config embutida no APK:</Text>
      {info && Object.entries(info).map(([k, v]) => (
        <Text key={k} style={styles.line}>{k}: {String(v)}</Text>
      ))}
      <Text style={styles.sub}>checkForUpdateAsync():</Text>
      <Text style={styles.line}>{JSON.stringify(check, null, 2)}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0f1014', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFD700', marginBottom: 16 },
  sub: { fontSize: 14, color: '#aaa', marginTop: 12, marginBottom: 6 },
  line: { fontSize: 13, color: '#fff', fontFamily: 'monospace', marginBottom: 4 },
  updateBtn: { backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  updateBtnDisabled: { opacity: 0.6 },
  updateBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  updateMsg: { color: '#FFD700', fontSize: 14, marginTop: 10 },
});
