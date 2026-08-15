#!/usr/bin/env bash
#
# eas_update.sh — Publica atualizacao over-the-air do AppMobile via EAS Update.
# Canal: preview | runtimeVersion: 1.0.0 (ver app.json)
#
# PRÉ-REQUISITOS:
#   1. EAS CLI logado:  eas login   (ou EAS_TOKEN no ambiente)
#   2. app.json com runtimeVersion e eas.json com channel 'preview' (ja existe)
#   3. node_modules instalado (expo/eas) nesta pasta
#
# USO:
#   bash eas_update.sh              # usa canal 'preview' (padrao do projeto)
#   CHANNEL=production bash eas_update.sh
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

CHANNEL="${CHANNEL:-preview}"
PLATFORM="${PLATFORM:-android}"

echo "==> [1/3] Type-check rápido (apenas avisa)..."
npx tsc --noEmit 2>&1 | grep -iE "SocketContext|PairingContainer|TVRemote" && {
  echo "!! Erros de tipo nos arquivos de pareamento. Abortando."
  exit 1
} || echo "    OK: sem erros nos arquivos de pareamento."

echo "==> [2/3] Validar config EAS..."
if [ ! -f eas.json ]; then echo "ERRO: eas.json ausente"; exit 1; fi
grep -q "\"$CHANNEL\"" eas.json || { echo "ERRO: canal '$CHANNEL' nao existe em eas.json"; exit 1; }

echo "==> [3/3] Publicar EAS Update (canal=$CHANNEL plataforma=$PLATFORM)..."
# --auto gera o nome do update; --message descreve a versao.
npx eas update --channel "$CHANNEL" --platform "$PLATFORM" --auto --message "BeepApp mobile: heartbeat TV + pareamento robusto"

echo "==> EAS Update enviado para o canal '$CHANNEL'. Dispositivos no canal recebem OTA."
