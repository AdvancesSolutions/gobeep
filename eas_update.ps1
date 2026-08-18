<#
.SYNOPSIS
    Publica atualizacao over-the-air do AppMobile via EAS Update.
.DESCRIPTION
    Canal: preview | runtimeVersion: 1.0.0 (ver app.json).
    Valida type-check dos arquivos de pareamento, checa o canal em eas.json
    e roda 'eas update'.
.PREREQUISITES
    1. EAS CLI logado:  eas login   (ou var de ambiente EAS_TOKEN)
    2. app.json com runtimeVersion e eas.json com channel 'preview' (ja existe)
    3. node_modules instalado (expo/eas) nesta pasta
.EXEMPLO
    .\eas_update.ps1
    $env:CHANNEL="production"; .\eas_update.ps1
#>

$ErrorActionPreference = "Stop"

$APP_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $APP_DIR

$CHANNEL = if ($env:CHANNEL) { $env:CHANNEL } else { "preview" }
$PLATFORM = if ($env:PLATFORM) { $env:PLATFORM } else { "android" }

Write-Host "==> [1/3] Type-check rapido (apenas nos arquivos de pareamento)..." -ForegroundColor Green
$tscOut = (npx tsc --noEmit 2>&1)
$pairErrors = ($tscOut | Select-String -Pattern "SocketContext|PairingContainer|TVRemote")
if ($pairErrors) {
    Write-Host "!! Erros de tipo nos arquivos de pareamento. Abortando." -ForegroundColor Red
    $pairErrors | ForEach-Object { Write-Host $_ }
    exit 1
} else {
    Write-Host "    OK: sem erros nos arquivos de pareamento."
}

Write-Host "==> [2/3] Validar config EAS..." -ForegroundColor Green
if (-not (Test-Path eas.json)) { throw "ERRO: eas.json ausente." }
if (-not ((Get-Content eas.json) -match [regex]::Escape("`"$CHANNEL`""))) {
    throw "ERRO: canal '$CHANNEL' nao existe em eas.json."
}

Write-Host "==> [3/3] Publicar EAS Update (canal=$CHANNEL plataforma=$PLATFORM)..." -ForegroundColor Green
eas update --channel $CHANNEL --platform $PLATFORM --auto --message "BeepApp mobile: heartbeat TV + pareamento robusto"

Write-Host "==> EAS Update enviado para o canal '$CHANNEL'. Dispositivos no canal recebem OTA." -ForegroundColor Green
