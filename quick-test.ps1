# Quick Docker Test for TucanTest
# This script will quickly check if your Docker deployment is working

Write-Host "🚀 Quick TucanTest Docker Test" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
$expectedPath = "c:\Users\galle\OneDrive\Desktop\TucanTest\TucanTest"
if ((Get-Location).Path -ne $expectedPath) {
    Write-Host "📂 Navigating to project directory..." -ForegroundColor Yellow
    Set-Location $expectedPath
}

# Quick Docker check
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    docker info | Out-Null
    Write-Host "✅ Docker is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not ready. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏗️ Starting containers (this may take a few minutes)..." -ForegroundColor Yellow

# Start development environment
docker-compose -f docker-compose.dev.yml up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Containers started!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "🏥 Quick Health Check:" -ForegroundColor Cyan
    
    # Test backend
    try {
        Invoke-WebRequest -Uri "http://localhost:5000/api/auth/config-check" -UseBasicParsing -TimeoutSec 5 | Out-Null
        Write-Host "✅ Backend API: http://localhost:5000" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend API not responding" -ForegroundColor Red
    }
    
    # Test frontend
    try {
        Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5 | Out-Null
        Write-Host "✅ Frontend App: http://localhost:5173" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend not responding" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🌐 Open these URLs in your browser:" -ForegroundColor Cyan
    Write-Host "• Main App: http://localhost:5173" -ForegroundColor White
    Write-Host "• API Docs: http://localhost:5000/api/docs/" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📊 Container Status:" -ForegroundColor Cyan
    docker-compose -f docker-compose.dev.yml ps
    
} else {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    Write-Host "Check the error messages above and try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 To stop containers: docker-compose -f docker-compose.dev.yml down" -ForegroundColor Gray
