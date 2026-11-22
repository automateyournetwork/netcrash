# Make the NETCRASH server running inside WSL2 reachable from other machines on the LAN.
# Run from an ADMINISTRATOR PowerShell:   powershell -ExecutionPolicy Bypass -File expose-wsl.ps1
# Undo:                                   powershell -ExecutionPolicy Bypass -File expose-wsl.ps1 -Remove
# Re-run it after every reboot: the WSL address can change.
param([int]$Port = 8000, [switch]$Remove)
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrator')
if (-not $admin) { Write-Error 'Run this in an elevated (administrator) PowerShell.'; exit 1 }
$rule = "NETCRASH $Port"
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=$Port 2>$null | Out-Null
Remove-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue
if ($Remove) { Write-Host "Removed the port forward and firewall rule for port $Port."; exit 0 }
$wsl = ((wsl.exe hostname -I) -split '\s+' | Where-Object { $_ })[0]
if (-not $wsl) { Write-Error 'Could not find the WSL address. Is WSL running?'; exit 1 }
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$Port connectaddress=$wsl connectport=$Port | Out-Null
# Private networks only: not exposed on public Wi-Fi.
New-NetFirewallRule -DisplayName $rule -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Private | Out-Null
$lan = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL' -and $_.IPAddress -notlike '169.254.*' }).IPAddress
Write-Host "Forwarding 0.0.0.0:$Port -> ${wsl}:$Port. Open from another machine:"
$lan | ForEach-Object { Write-Host "  http://${_}:$Port/" }
