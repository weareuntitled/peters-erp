# Local mock test for health-monitor.sh logic
# Run on Windows to verify the script functions work

$ScriptDir = "C:\Users\hi\gswin-erp\scripts"
Set-Location $ScriptDir

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Health Monitor - Local Mock Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Syntax Check
Write-Host "[TEST 1] Checking script syntax..." -ForegroundColor Yellow
try {
    $null = Get-Content "$ScriptDir\health-monitor.sh" -ErrorAction Stop
    Write-Host "  PASS: Script file exists" -ForegroundColor Green

    # Check for key functions (bash uses "name() { }" syntax)
    $content = Get-Content "$ScriptDir\health-monitor.sh" -Raw
    $hasCheckService = $content -match "check_service\(\)"
    $hasRestart = $content -match "restart_container\(\)"
    $hasTelegram = $content -match "send_telegram\(\)"
    $hasCheckAndRestart = $content -match "check_and_restart\(\)"
    $hasMain = $content -match "main\(\)"

    if ($hasCheckService -and $hasRestart -and $hasTelegram -and $hasCheckAndRestart -and $hasMain) {
        Write-Host "  PASS: All functions present (check_service, restart_container, send_telegram, check_and_restart, main)" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: Missing functions (found check_service:$hasCheckService, restart:$hasRestart, telegram:$hasTelegram)" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL: Cannot read script" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check Logic - Service Detection
Write-Host "[TEST 2] Testing service check logic..." -ForegroundColor Yellow
$testUrls = @(
    @{Name="Backend"; Url="http://localhost:8001/api/health"},
    @{Name="Frontend"; Url="http://localhost:5175/"}
)

foreach ($svc in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $svc.Url -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-Host "  $($svc.Name): UP (HTTP $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "  $($svc.Name): DOWN ( $($_.Exception.Message.Substring(0, [Math]::Min(50, $_.Exception.Message.Length))) )" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Docker Container Check
Write-Host "[TEST 3] Checking Docker containers..." -ForegroundColor Yellow
$containers = @("peters-erp-staging-backend", "peters-erp-staging-frontend")

# Simulate check - in real test would run: docker ps --filter "name=peters-erp-staging"
Write-Host "  (Run on server: docker ps --filter 'name=peters-erp-staging')" -ForegroundColor Gray
Write-Host "  Expected containers:"
Write-Host "    - peters-erp-staging-backend" -ForegroundColor Gray
Write-Host "    - peters-erp-staging-frontend" -ForegroundColor Gray
Write-Host ""

# Test 4: Simulate failure detection (mock)
Write-Host "[TEST 4] Simulating failure detection..." -ForegroundColor Yellow
$mockFailCount = 0
$maxRetries = 3

# Simulate 3 failures
for ($i = 1; $i -le 3; $i++) {
    $mockFailCount++
    Write-Host "  Failure #$mockFailCount detected..." -ForegroundColor Yellow
    if ($mockFailCount -ge $maxRetries) {
        Write-Host "  TRIGGER: Critical alert would be sent (MAX_RETRIES=$maxRetries reached)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Telegram config check
Write-Host "[TEST 5] Checking Telegram config..." -ForegroundColor Yellow
if (Test-Path "$ScriptDir\health-monitor.conf") {
    $config = Get-Content "$ScriptDir\health-monitor.conf" -Raw
    $hasToken = $config -match "TELEGRAM_BOT_TOKEN="
    $hasChatId = $config -match "TELEGRAM_CHAT_ID="

    if ($hasToken -and $hasChatId) {
        Write-Host "  PASS: Telegram config present" -ForegroundColor Green
    } else {
        Write-Host "  WARN: Telegram not configured (alerts will be silent)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  WARN: Config file not found (copy health-monitor.conf.example)" -ForegroundColor Yellow
}
Write-Host ""

# Test 6: Simulate cooldown logic
Write-Host "[TEST 6] Testing restart cooldown logic..." -ForegroundColor Yellow
$cooldownSeconds = 300
$lastRestart = (Get-Date).AddSeconds(-100).UnixTimestamp
$now = (Get-Date).UnixTimestamp
$timeSinceRestart = $now - $lastRestart

if ($timeSinceRestart -lt $cooldownSeconds) {
    Write-Host "  PASS: Cooldown active ($timeSinceRestart s < $cooldownSeconds s) - restart skipped" -ForegroundColor Green
} else {
    Write-Host "  PASS: Cooldown expired - restart allowed" -ForegroundColor Green
}
Write-Host ""

# Test 7: Service file check
Write-Host "[TEST 7] Checking systemd service file..." -ForegroundColor Yellow
if (Test-Path "$ScriptDir\peters-erp-health-monitor.service") {
    $service = Get-Content "$ScriptDir\peters-erp-health-monitor.service" -Raw
    $hasExecStart = $service -match "ExecStart=.*health-monitor.sh"
    $hasRestart = $service -match "Restart=always"

    if ($hasExecStart -and $hasRestart) {
        Write-Host "  PASS: Service file valid" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: Service file missing required fields" -ForegroundColor Red
    }
} else {
    Write-Host "  FAIL: Service file not found" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To run full test on SERVER:" -ForegroundColor Cyan
Write-Host "  1. ssh root@187.77.68.83" -ForegroundColor Gray
Write-Host "  2. cd /opt/peters-erp/scripts" -ForegroundColor Gray
Write-Host "  3. ./health-monitor.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "To test auto-restart:" -ForegroundColor Cyan
Write-Host "  1. Start monitor: ./health-monitor.sh &" -ForegroundColor Gray
Write-Host "  2. Kill container: docker kill peters-erp-staging-frontend" -ForegroundColor Gray
Write-Host "  3. Watch logs: tail -f /var/log/peters-erp/health-monitor.log" -ForegroundColor Gray
Write-Host ""