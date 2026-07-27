# test_serper.ps1
$key = (Select-String -Path ".env" -Pattern "SERPER_API_KEY=(.*)").Matches.Groups[1].Value
$body = @{ q = "serial key leak site:pastebin.com"; num = 5 } | ConvertTo-Json

try {
    $resp = Invoke-RestMethod -Uri "https://google.serper.dev/search" -Method Post `
        -Headers @{ "X-API-KEY" = $key; "Content-Type" = "application/json" } -Body $body
    Write-Host "`n===== SERPER API RESPONSE =====" -ForegroundColor Green
    Write-Host "Estado:          CONECTADO" -ForegroundColor Green
    Write-Host "Resultados:      $($resp.organic.Count)" -ForegroundColor Cyan
    Write-Host "Credits usados:  $($resp.credits)" -ForegroundColor Yellow
    Write-Host "`n--- Resultados obtenidos ---" -ForegroundColor Magenta
    $i = 1
    $resp.organic | ForEach-Object {
        Write-Host "$i. $($_.title)" -ForegroundColor White
        Write-Host "   URL: $($_.link)" -ForegroundColor Gray
        Write-Host "   Snippet: $($_.snippet)" -ForegroundColor DarkGray
        Write-Host ""
        $i++
    }
    Write-Host "==============================" -ForegroundColor Green
} catch {
    Write-Host "`n===== ERROR =====" -ForegroundColor Red
    Write-Host "No se pudo conectar a SERPER API"
    Write-Host "Detalle: $_" -ForegroundColor Red
    Write-Host "=================" -ForegroundColor Red
}