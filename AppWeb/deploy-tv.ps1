# deploy-tv.ps1 - Deploy automatico do BeepApp TV (com.beepapp.tv) para LG webOS
# Uso: .\deploy-tv.ps1  (precisa editar tv-config.json com IP/senha da TV)
$ErrorActionPreference = "Stop"

$configPath = Join-Path $PSScriptRoot "tv-config.json"
if (-not (Test-Path $configPath)) { Write-Error "tv-config.json nao encontrado. Copie tv-config.example.json e preencha."; exit 1 }
$cfg = Get-Content $configPath -Raw | ConvertFrom-Json

$tvIp = $cfg.tv_ip
$tvPort = if ($cfg.tv_port) { $cfg.tv_port } else { "9922" }
$tvPass = $cfg.tv_password
$dev = if ($cfg.device_name) { $cfg.device_name } else { "beepTV" }
$proj = if ($cfg.project_dir) { $cfg.project_dir } else { "D:\Clientes\BeepApp\Projeto\AppWeb" }

Write-Host "=== BeepApp TV Deploy ===" -ForegroundColor Cyan
Write-Host "TV: $tvIp : $tvPort  device=$dev"
Write-Host "Projeto: $proj"

# 1. webOS CLI
Write-Host "`n[1/5] Verificando webOS CLI (@webos-cli)..." -ForegroundColor Yellow
if (-not (Get-Command ares -ErrorAction SilentlyContinue)) {
    Write-Host "  Instalando @webos-cli globalmente..."
    npm install -g @webos-cli
} else {
    Write-Host "  ares ja instalado."
}

# 2. Registrar device (se nao existir)
Write-Host "`n[2/5] Configurando device na TV..." -ForegroundColor Yellow
$devList = ares -l 2>$null
if ($devList -notmatch [regex]::Escape($dev)) {
    Write-Host "  Registrando device $dev em $tvIp..."
    ares-setup-device -a $dev -i "developer@$($tvIp):$tvPort" -p $tvPass
} else {
    Write-Host "  Device $dev ja registrado."
}

# 3. Build webOS
Write-Host "`n[3/5] Build do app (vite build)..." -ForegroundColor Yellow
Push-Location $proj
try {
    npm run build:webos
} catch {
    Write-Warning "build:webos falhou (verifique npm install no projeto). Continuando com .ipk existente se houver."
}
Pop-Location

# 4. Empacotar .ipk
Write-Host "`n[4/5] Gerando .ipk (ares-package)..." -ForegroundColor Yellow
$webosBuild = Join-Path $proj "webos_build"
if (-not (Test-Path $webosBuild)) { New-Item -ItemType Directory -Force -Path $webosBuild | Out-Null }
Push-Location $proj
try {
    npx ares-package dist services/com.beepapp.tv.service -o ./webos_build
} catch {
    Write-Warning "ares-package falhou. Use o .ipk ja existente em webos_build/."
}
Pop-Location

# 5. Instalar e lançar na TV
Write-Host "`n[5/5] Instalando e abrindo na TV..." -ForegroundColor Yellow
$ipk = Get-ChildItem $webosBuild -Filter "*.ipk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $ipk) { Write-Error "Nenhum .ipk encontrado em $webosBuild"; exit 1 }
Write-Host "  Enviando: $($ipk.Name)"
ares-install -d $dev $ipk.FullName
Write-Host "  Abrindo app na TV..."
ares-launch -d $dev com.beepapp.tv
Write-Host "`n=== PRONTO: BeepApp TV instalado e aberto na LG ===" -ForegroundColor Green
