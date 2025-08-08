# 🧪 TucanTest Docker Testing Guide

## Prerequisites Check

Before testing, ensure you have:
- ✅ Docker Desktop installed and running
- ✅ Command prompt or PowerShell access
- ✅ Internet connection for downloading images

## Step-by-Step Testing Process

### 1. Verify Docker Installation

```powershell
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Verify Docker is running
docker info
```

### 2. Quick Development Test

```powershell
# Navigate to project directory
cd "c:\Users\galle\OneDrive\Desktop\TucanTest\TucanTest"

# Start development environment
docker-compose -f docker-compose.dev.yml up -d --build

# Check if containers are running
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### 3. Test API Endpoints

Once the containers are running, test these URLs in your browser:

**Backend Tests:**
- http://localhost:5000/api/auth/config-check
- http://localhost:5000/api/docs/ (Swagger UI)

**Frontend Tests:**
- http://localhost:5173 (React app)

### 4. Production Test

```powershell
# Stop development containers first
docker-compose -f docker-compose.dev.yml down

# Start production environment
docker-compose up -d --build

# Check status
docker-compose ps

# Test with Nginx proxy
# http://localhost (main app via Nginx)
# http://localhost/api/auth/config-check (API via Nginx)
```

## 🔍 Troubleshooting Commands

### Container Status
```powershell
# List all containers
docker ps -a

# Check specific container logs
docker logs tucan_backend_dev
docker logs tucan_frontend_dev

# Access container shell
docker exec -it tucan_backend_dev bash
```

### Network Testing
```powershell
# Test backend health
curl http://localhost:5000/api/auth/config-check

# Test if frontend is accessible
curl http://localhost:5173

# Test Nginx proxy (production)
curl http://localhost/api/auth/config-check
```

### Performance Testing
```powershell
# Check container resource usage
docker stats

# Check Docker system info
docker system df
```

## 🚀 Expected Results

### Development Mode Success:
- Backend running on port 5000
- Frontend running on port 5173 with hot reload
- Swagger UI accessible at /api/docs/
- Database automatically created

### Production Mode Success:
- All services running behind Nginx on port 80
- Frontend optimized build served
- API accessible via /api/ prefix
- Health checks passing

## ❌ Common Issues & Solutions

### Port Already in Use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Container Build Failures
```powershell
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Database Issues
```powershell
# Remove database file and restart
docker-compose down
docker volume rm tucantest_db_data
docker-compose up -d
```

## 📝 Test Checklist

- [ ] Docker Desktop is running
- [ ] Containers build successfully
- [ ] Backend API responds at http://localhost:5000/api/auth/config-check
- [ ] Swagger UI loads at http://localhost:5000/api/docs/
- [ ] Frontend loads at http://localhost:5173 (dev) or http://localhost (prod)
- [ ] Registration/login flow works
- [ ] Database persists data between container restarts
- [ ] Logs show no critical errors

## 🎯 Quick Health Check Script

Save this as `health_check.ps1`:

```powershell
Write-Host "🏥 TucanTest Health Check" -ForegroundColor Green

# Check backend
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/config-check" -UseBasicParsing
    Write-Host "✅ Backend: OK (Status: $($backend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend: Failed" -ForegroundColor Red
}

# Check frontend (dev)
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing
    Write-Host "✅ Frontend (Dev): OK (Status: $($frontend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend (Dev): Failed" -ForegroundColor Red
}

# Check production (Nginx)
try {
    $nginx = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing
    Write-Host "✅ Nginx Proxy: OK (Status: $($nginx.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Nginx Proxy: Failed" -ForegroundColor Red
}

# Check containers
Write-Host "`n📊 Container Status:" -ForegroundColor Blue
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Run with: `powershell -ExecutionPolicy Bypass -File health_check.ps1`
