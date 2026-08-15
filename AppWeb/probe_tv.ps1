# probe_tv.ps1 - descobre a API do Dev Mode na TV e tenta instalar o ipk via HTTP
$ErrorActionPreference = "Continue"
$cfg = Get-Content (Join-Path $PSScriptRoot "tv-config.json") -Raw | ConvertFrom-Json
$ip = $cfg.tv_ip
$user = if ($cfg.tv_user) { $cfg.tv_user } else { "developer" }
$pass = $cfg.tv_password
$ipk = Get-ChildItem (Join-Path $PSScriptRoot "webos_build") -Filter "*.ipk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "IP=$ip USER=$user IPK=$($ipk.Name)"

# portas comuns do Dev Mode / ares local API
$ports = @(9991, 3000, 9922, 8080, 9998)
foreach ($p in $ports) {
    try {
        $r = Invoke-WebRequest -Uri "http://$ip`:$p/" -TimeoutSec 4 -UseBasicParsing -ErrorAction Stop
        Write-Host "PORTA $p ABERTA: $($r.StatusCode) $($r.Content.Substring(0,[Math]::Min(200,$r.Content.Length)))"
    } catch [System.Net.WebException] {
        $re = $_.Exception.Response
        if ($re) { Write-Host "PORTA $p respondeu (http $($re.StatusCode.value__))" } else { Write-Host "PORTA $p sem resposta" }
    } catch { Write-Host "PORTA $p erro: $($_.Exception.Message)" }
}
Write-Host "PROBE_FIM"
