#!/usr/bin/env bash
#
# deploy_tv.sh — Build + empacota + instala + lança o BeepApp TV na LG webOS
# Uso:  bash deploy_tv.sh
#
# PRÉ-REQUISITOS (no ambiente onde roda):
#   1. ares-cli instalado (npm i -g @webos-tools/cli  OU via NPM_CONFIG_PREFIX)
#   2. Device 'tv' registrado: ares-setup-device --add tv --info '{"host":"192.168.15.10","port":"9922","username":"prisoner"}'
#   3. Chave SSH da TV obtida:  ares-novacom --device tv --getkey
#      (precisa do app "Developer Mode" na TV com o key server ativo + passphrase)
#   4. node_modules com binding Linux (se rodar em Linux): npm i @rolldown/binding-linux-x64-gnu
#
# Em Windows/PowerShell o fluxo equivalente é:
#   npm run build:webos
#   ares-package dist services/com.beepapp.tv.service -o ./webos_build
#   ares-install --device tv ./webos_build/<pacote>.ipk
#   ares-launch --device tv com.beepapp.tv
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

DEVICE="tv"
PKG_ID="com.beepapp.tv"
APP_ID="com.beepapp.tv"
IPK_DIR="./webos_build"
IPK_PATH="$(ls -1t "$IPK_DIR"/${PKG_ID}_*.ipk 2>/dev/null | head -1 || true)"

# garante ares no PATH (instalação local em ~/.npm-global)
if ! command -v ares-package >/dev/null 2>&1; then
  export PATH="/home/hermes/.npm-global/bin:$PATH"
fi

echo "==> [1/5] Build (vite)..."
npm run build 2>&1 | tail -5 || {
  echo "!! tsc -b falhou (sem tsconfig.json raiz). Tentando vite build direto..."
  npx vite build
}

echo "==> [2/5] Empacotar .ipk (--no-minify: vite ja minifica)..."
rm -rf "$IPK_DIR" && mkdir -p "$IPK_DIR"
ares-package --no-minify dist services/com.beepapp.tv.service -o "$IPK_DIR"
IPK_PATH="$(ls -1t "$IPK_DIR"/${PKG_ID}_*.ipk 2>/dev/null | head -1)"
[ -n "$IPK_PATH" ] || { echo "ERRO: .ipk nao gerado"; exit 1; }
echo "    Pacote: $IPK_PATH"

echo "==> [3/5] Verificar device '$DEVICE'..."
if ! ares-setup-device --list 2>/dev/null | grep -q "\b$DEVICE\b"; then
  echo "    Device '$DEVICE' ausente. Registrando..."
  ares-setup-device --add tv --info '{"host":"192.168.15.10","port":"9922","username":"prisoner"}'
fi

echo "==> [4/5] Instalar na TV..."
if ! ares-install --device "$DEVICE" "$IPK_PATH"; then
  echo "-------------------------------------------------------------"
  echo "FALHA na instalacao (autenticacao SSH). Causa comum:"
  echo "  - Chave da TV ausente. Obtenha com:"
  echo "      ares-novacom --device $DEVICE --getkey"
  echo "  - App 'Developer Mode' na TV deve estar com key server ATIVO."
  echo "  - Informe a passphrase exibida no app quando solicitado."
  echo "-------------------------------------------------------------"
  exit 2
fi

echo "==> [5/5] Lancar app..."
ares-launch --device "$DEVICE" "$APP_ID" || ares-launch --device "$DEVICE" "$PKG_ID"

echo "==> Deploy concluido em $DEVICE."
