# register-tv.ps1 - Registra a TV LG no ares-cli (sintaxe 'ares setup-device' com espaco)
$ErrorActionPreference = "Stop"
$configPath = Join-Path $PSScriptRoot "tv-config.json"
if (-not (Test-Path $configPath)) { Write-Error "tv-config.json nao encontrado"; exit 1 }
$cfg = Get-Content $configPath -Raw | ConvertFrom-Json

$tvIp   = $cfg.tv_ip
$tvPort = if ($cfg.tv_port) { $cfg.tv_port } else { "9922" }
$tvUser = if ($cfg.tv_user) { $cfg.tv_user } else { "developer" }
$tvPass = $cfg.tv_password
$dev    = if ($cfg.device_name) { $cfg.device_name } else { "beepTV" }

if ($tvPass -eq "COLOQUE_A_SENHA_DO_DEV_MODE_AQUI" -or [string]::IsNullOrWhiteSpace($tvPass)) {
    Write-Error "Edite tv-config.json e preencha tv_password antes de rodar."
    exit 1
}

Write-Host "Registrando TV $dev ($tvUser@$tvIp`:$tvPort)..." -ForegroundColor Cyan
$env:PATH += ";$env:APPDATA\npm"

# remove device antigo se existir
ares setup-device -r $dev 2>$null

# registra (ares-cli v0.4.9 usa espaco)
ares setup-device -a $dev -i "$tvUser@$tvIp`:$tvPort" -p $tvPass

Write-Host "`nTestando conexao..." -ForegroundColor Yellow
ares device-info -d $dev
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== TV REGISTRADA E CONECTADA OK ===" -ForegroundColor Green
} else {
    Write-Host "`n=== FALHOU - user/senha incorretos. Nao tente varias vezes. ===" -ForegroundColor Red
}
