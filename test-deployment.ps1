# TucanTest Docker Testing Script
# Run this script to test your Docker deployment

Write-Host "🧪 TucanTest Docker Testing Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if Docker is available
function Test-Docker {
    Write-Host "🔍 Checking Docker installation..." -ForegroundColor Yellow
    
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
        } else {
            Write-Host "❌ Docker not found in PATH" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Docker not installed" -ForegroundColor Red
        return $false
    }
    
    try {
        $dockerInfo = docker info 2>$null
        if ($dockerInfo) {
            Write-Host "✅ Docker daemon is running" -ForegroundColor Green
        } else {
            Write-Host "❌ Docker daemon is not running. Please start Docker Desktop." -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Cannot connect to Docker daemon" -ForegroundColor Red
        return $false
    }
    
    try {
        $composeVersion = docker-compose --version 2>$null
        if ($composeVersion) {
            Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
        } else {
            Write-Host "❌ Docker Compose not found" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Docker Compose not available" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to test HTTP endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name,
        [int]$TimeoutSeconds = 10
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds
        Write-Host "✅ $Name OK (Status: $($response.StatusCode))" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $Name Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to wait for service to be ready
function Wait-ForService {
    param(
        [string]$Url,
        [string]$ServiceName,
        [int]$MaxAttempts = 30,
        [int]$WaitSeconds = 5
    )
    
    Write-Host "⏳ Waiting for $ServiceName to be ready..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            Write-Host "✅ $ServiceName is ready! (Attempt $i)" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "   Attempt $i/$MaxAttempts failed, waiting $WaitSeconds seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds $WaitSeconds
        }
    }
    
    Write-Host "❌ $ServiceName failed to start within timeout" -ForegroundColor Red
    return $false
}

# Main testing function
function Start-Testing {
    Write-Host ""
    Write-Host "🚀 Starting Docker Deployment Test" -ForegroundColor Cyan
    Write-Host ""
    
    # Check Docker
    if (-not (Test-Docker)) {
        Write-Host ""
        Write-Host "Please install Docker Desktop and ensure it's running, then try again." -ForegroundColor Red
        return
    }
    
    Write-Host ""
    Write-Host "📂 Navigating to project directory..." -ForegroundColor Yellow
    
    $projectPath = "c:\Users\galle\OneDrive\Desktop\TucanTest\TucanTest"
    if (Test-Path $projectPath) {
        Set-Location $projectPath
        Write-Host "✅ Project directory found: $projectPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Project directory not found: $projectPath" -ForegroundColor Red
        return
    }
    
    Write-Host ""
    Write-Host "🛑 Stopping any existing containers..." -ForegroundColor Yellow
    docker-compose down 2>$null
    docker-compose -f docker-compose.dev.yml down 2>$null
    
    Write-Host ""
    Write-Host "🏗️ Building and starting development environment..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
    
    # Start development environment
    $buildResult = docker-compose -f docker-compose.dev.yml up -d --build 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Containers started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start containers:" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
        return
    }
    
    Write-Host ""
    Write-Host "📊 Container Status:" -ForegroundColor Cyan
    docker-compose -f docker-compose.dev.yml ps
    
    Write-Host ""
    Write-Host "🏥 Testing Services..." -ForegroundColor Cyan
    
    # Wait for and test backend
    if (Wait-ForService -Url "http://localhost:5000/api/auth/config-check" -ServiceName "Backend API") {
        Test-Endpoint -Url "http://localhost:5000/api/auth/config-check" -Name "Backend Health Check"
        Test-Endpoint -Url "http://localhost:5000/api/docs/" -Name "Swagger UI"
    }
    
    # Wait for and test frontend
    if (Wait-ForService -Url "http://localhost:5173" -ServiceName "Frontend") {
        Test-Endpoint -Url "http://localhost:5173" -Name "Frontend Application"
    }
    
    Write-Host ""
    Write-Host "🌐 Access Points:" -ForegroundColor Cyan
    Write-Host "• Frontend (React): http://localhost:5173" -ForegroundColor White
    Write-Host "• Backend API: http://localhost:5000" -ForegroundColor White
    Write-Host "• Swagger UI: http://localhost:5000/api/docs/" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📋 Useful Commands:" -ForegroundColor Cyan
    Write-Host "• View logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
    Write-Host "• Stop services: docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
    Write-Host "• Restart services: docker-compose -f docker-compose.dev.yml restart" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🎉 Testing Complete!" -ForegroundColor Green
    Write-Host "Your TucanTest application should now be running in Docker containers." -ForegroundColor Green
}

# Run the test
Start-Testing

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
