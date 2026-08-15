<# 
.SYNOPSIS
    Deploy OTA do AppMobile BeepApp via EAS Update (Expo).
.DESCRIPTION
    Publica actualizacao over-the-air no canal 'preview' (Android).
    Requer: eas-cli instalado e sessao ja autenticada (eas login).
.EXEMPLO
    .\deploy_mobile.ps1
#>

$ErrorActionPreference = "Continue"
$APP_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $APP_DIR

# Usa o eas instalado globalmente. Redireciona stderr para nao abortar com avisos de versao.
$EAS = "eas"

function Run-Eas($cmd) {
    Write-Host "==> $cmd" -ForegroundColor Cyan
    Invoke-Expression "$cmd 2>`$null"
    Write-Host ("EXIT=" + $LASTEXITCODE) -ForegroundColor $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Red" })
    return $LASTEXITCODE
}

Write-Host "==> [1/3] Verificar EAS CLI..." -ForegroundColor Green
try { & $EAS --version 2>$null | Out-Null } catch {
    Write-Host "    eas ausente. Instalando globalmente..." -ForegroundColor Yellow
    npm install -g eas-cli
}

Write-Host "==> [2/3] Verificar login EAS..." -ForegroundColor Green
$whoami = (& $EAS whoami 2>$null)
if (-not $whoami) {
    Write-Host "    NAO LOGADO. Execute 'eas login' e rode de novo." -ForegroundColor Red
    exit 3
}
Write-Host "    Logado como: $whoami" -ForegroundColor Green

Write-Host "==> [3/3] Publicar actualizacao OTA (channel preview, android)..." -ForegroundColor Green
$exit = Run-Eas "$EAS update --channel preview --platform android --auto"

if ($exit -eq 0) {
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host " UPDATE PUBLICADO COM SUCESSO." -ForegroundColor Green
    Write-Host " Agora FECHE e REABRA o app no celular" -ForegroundColor Yellow
    Write-Host " (o expo-updates baixa no launch e aplica na reabertura)." -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Green
} else {
    Write-Host "FALHOU ao publicar o update (veja o erro acima)." -ForegroundColor Red
}
