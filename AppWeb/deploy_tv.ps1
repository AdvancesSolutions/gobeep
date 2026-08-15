<#
.SYNOPSIS
    Build + empacota + instala + lança o BeepApp TV na LG webOS.
.DESCRIPTION
    Fluxo equivalente ao deploy_tv.sh, para rodar no PowerShell (Windows),
    que e o ambiente nativo do projeto (D:\CLIENTES\BeepApp\Projeto\AppWeb).
.PREREQUISITES
    1. Node + ares-cli:  npm install -g @webos-tools/cli
    2. Device 'tv' registrado:
         ares-setup-device --add tv --info '{"host":"192.168.15.10","port":"9922","username":"prisoner"}'
    3. Chave SSH da TV obtida (app "Developer Mode" com key server ativo):
         ares-novacom --device tv --getkey
.EXEMPLO
    .\deploy_tv.ps1
#>

$ErrorActionPreference = "Stop"

$APP_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $APP_DIR

$DEVICE   = "tv"
$PKG_ID   = "com.beepapp.tv"
$APP_ID   = "com.beepapp.tv"
$IPK_DIR  = ".\webos_build"

function Run($cmd) {
    Write-Host "==> $cmd" -ForegroundColor Cyan
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0) { throw "Comando falhou (exit $LASTEXITCODE): $cmd" }
}

Write-Host "==> [1/5] Build (npm run build:webos)..." -ForegroundColor Green
try {
    npm run build:webos
} catch {
    Write-Host "!! build:webos falhou. Tentando vite build direto..." -ForegroundColor Yellow
    npx vite build
}

Write-Host "==> [2/5] Empacotar .ipk (--no-minify: vite ja minifica)..." -ForegroundColor Green
if (Test-Path $IPK_DIR) { Remove-Item -Recurse -Force $IPK_DIR }
New-Item -ItemType Directory -Force -Path $IPK_DIR | Out-Null
ares-package --no-minify dist services/com.beepapp.tv.service -o $IPK_DIR

$ipk = (Get-ChildItem -Path $IPK_DIR -Filter "${PKG_ID}_*.ipk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1)
if (-not $ipk) { throw "ERRO: .ipk nao gerado." }
Write-Host "    Pacote: $($ipk.FullName)"

Write-Host "==> [3/5] Verificar device '$DEVICE'..." -ForegroundColor Green
$list = (ares-setup-device --list 2>$null)
if (-not ($list -match "\b$DEVICE\b")) {
    Write-Host "    Device '$DEVICE' ausente. Registrando..."
    ares-setup-device --add tv --info '{"host":"192.168.15.10","port":"9922","username":"prisoner"}'
}

Write-Host "==> [4/5] Instalar na TV..." -ForegroundColor Green
try {
    ares-install --device $DEVICE $ipk.FullName
} catch {
    Write-Host "-------------------------------------------------------------" -ForegroundColor Red
    Write-Host "FALHA na instalacao (autenticacao SSH). Causa comum:" -ForegroundColor Red
    Write-Host "  - Chave da TV ausente. Obtenha com:" -ForegroundColor Red
    Write-Host "      ares-novacom --device $DEVICE --getkey" -ForegroundColor Red
    Write-Host "  - App 'Developer Mode' na TV deve estar com key server ATIVO." -ForegroundColor Red
    Write-Host "  - Informe a passphrase exibida no app quando solicitado." -ForegroundColor Red
    Write-Host "-------------------------------------------------------------" -ForegroundColor Red
    exit 2
}

Write-Host "==> [5/5] Lancar app..." -ForegroundColor Green
try { ares-launch --device $DEVICE $APP_ID } catch { ares-launch --device $DEVICE $PKG_ID }

Write-Host "==> Deploy concluido em $DEVICE." -ForegroundColor Green
