$ErrorActionPreference = "Stop"
$configPath = Join-Path $PSScriptRoot "tv-config.json"
$cfg = Get-Content $configPath -Raw | ConvertFrom-Json

$tvIp   = $cfg.tv_ip
$tvPort = if ($cfg.tv_port) { $cfg.tv_port } else { "9922" }
$tvUser = if ($cfg.tv_user) { $cfg.tv_user } else { "control.advances@gmail.com" }
$tvPass = $cfg.tv_password
$dev    = if ($cfg.device_name) { $cfg.device_name } else { "beepTV" }

$env:PATH += ";$env:APPDATA\npm"

ares-setup-device --remove $dev 2>$null

# CLI @webos-tools/cli: nome eh posicional
ares-setup-device -a $tvIp -p $tvPort -t ssh -P $tvPass -u "$tvUser" $dev 2>&1
if ($LASTEXITCODE -ne 0) {
  ares-setup-device -a $tvIp -p $tvPort -t ssh -P $tvPass $dev 2>&1
}

Write-Host "`n=== device-info ==="
ares device-info --device $dev 2>&1

Write-Host "`n=== INSTALL ==="
$ipk = Get-ChildItem (Join-Path $PSScriptRoot "webos_build") -Filter "*.ipk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
ares-install --device $dev $ipk.FullName 2>&1

Write-Host "`n=== LAUNCH ==="
ares-launch --device $dev com.beepapp.tv 2>&1

Write-Host "`n=== FIM ==="
