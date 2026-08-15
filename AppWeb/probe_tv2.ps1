# probe_tv2.ps1 - varre portas do Dev Mode e testa conectividade
$ErrorActionPreference = "Continue"
$ip = "192.168.15.10"

Write-Host "=== PING ==="
try { $p = Test-Connection $ip -Count 2 -ErrorAction Stop; Write-Host "TV responde ping" } catch { Write-Host "ping falhou" }

Write-Host "=== PORTAS 9900-9999 ==="
$abertas = @()
for ($p = 9900; $p -le 9999; $p++) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect($ip, $p, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(300)
        if ($ok -and $tcp.Connected) { Write-Host "PORTA $p ABERTA"; $abertas += $p }
        $tcp.Close()
    } catch {}
}
Write-Host "ABERTAS: $($abertas -join ',')"

foreach ($p in @(9922,9991,3000,8080)) {
    try {
        $r = Invoke-WebRequest -Uri "http://$ip`:$p/" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "HTTP ${p}: $($r.StatusCode)"
    } catch { Write-Host "HTTP ${p}: sem resposta" }
}
Write-Host "PROBE2_FIM"
