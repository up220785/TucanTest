# 🐳 TucanTest Docker Deployment Guide

This guide will help you deploy the TucanTest application using Docker and Docker Compose.

## 📋 Prerequisites

Before you begin, make sure you have the following installed:
- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or later)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/up220785/TucanTest.git
cd TucanTest
```

### 2. Production Deployment
For production deployment with Nginx reverse proxy:

```bash
# Build and start all services
docker-compose up -d

# Check the status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access Points:**
- **Application**: http://localhost (via Nginx)
- **Frontend Direct**: http://localhost:4173
- **Backend API**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/api/docs/

### 3. Development Deployment
For development with hot reloading:

```bash
# Use the development compose file
docker-compose -f docker-compose.dev.yml up -d

# Check the status
docker-compose -f docker-compose.dev.yml ps
```

**Access Points:**
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:5000 (Flask dev server)

## 🏗️ Architecture

The Docker setup includes:

### Services
1. **Backend** (`tucan_backend`): Flask API server
2. **Frontend** (`tucan_frontend`): React with Vite
3. **Nginx** (`tucan_nginx`): Reverse proxy (production only)

### Networks
- `tucan_network`: Bridge network for inter-service communication

### Volumes
- `./flask-server/data:/app/data`: Persistent database storage

## 📁 Docker Files Overview

```
TucanTest/
├── docker-compose.yml          # Production setup with Nginx
├── docker-compose.dev.yml      # Development setup
├── nginx.conf                  # Nginx configuration
├── flask-server/
│   ├── Dockerfile             # Backend production image
│   └── .dockerignore          # Backend ignore patterns
└── tucan-front/
    ├── Dockerfile             # Frontend production image
    ├── Dockerfile.dev         # Frontend development image
    └── .dockerignore          # Frontend ignore patterns
```

## 🛠️ Common Commands

### Building Services
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache
```

### Managing Services
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Database Management
```bash
# Access backend container
docker-compose exec backend bash

# View database files
docker-compose exec backend ls -la /app/data

# Backup database
docker cp tucan_backend:/app/tucantestschema.db ./backup_$(date +%Y%m%d_%H%M%S).db
```

## 🔧 Configuration

### Environment Variables

You can customize the deployment by setting environment variables:

```bash
# Create a .env file in the root directory
echo "FLASK_ENV=production" > .env
echo "VITE_API_URL=http://localhost:5000" >> .env
```

### Port Configuration

To change default ports, modify the docker-compose.yml file:

```yaml
services:
  backend:
    ports:
      - "8000:5000"  # Change host port to 8000
  
  frontend:
    ports:
      - "3000:4173"  # Change host port to 3000
```

### SSL/HTTPS Setup

For production with SSL, you can extend the Nginx configuration:

1. Add SSL certificates to a `./ssl/` directory
2. Update `nginx.conf` to include SSL configuration
3. Mount the SSL directory in docker-compose.yml

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find and kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or use different ports in docker-compose.yml
```

#### Permission Issues (Linux/Mac)
```bash
# Fix file permissions
sudo chown -R $USER:$USER ./flask-server/data
```

#### Database Issues
```bash
# Reset database
docker-compose down
rm -f ./flask-server/data/tucantestschema.db
docker-compose up -d
```

#### Container Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose down --volumes
docker-compose build --no-cache
docker-compose up -d
```

### Viewing Container Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx

# Follow logs in real-time
docker-compose logs -f backend
```

### Health Checks
```bash
# Check backend health
curl http://localhost:5000/api/auth/config-check

# Check frontend
curl http://localhost:4173

# Check Nginx proxy
curl http://localhost/api/auth/config-check
```

## 🚀 Production Considerations

### Security
- Change default ports in production
- Set up proper SSL certificates
- Use environment variables for sensitive data
- Implement proper firewall rules

### Performance
- Use production builds (default in docker-compose.yml)
- Configure Nginx caching
- Set up monitoring and logging
- Use multi-stage Docker builds for smaller images

### Scaling
```bash
# Scale specific services
docker-compose up -d --scale backend=3 --scale frontend=2
```

### Backup Strategy
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker cp tucan_backend:/app/tucantestschema.db ./backups/db_backup_$DATE.db
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/2.3.x/deploying/)

## 🤝 Contributing

When adding new features that require Docker changes:
1. Update the appropriate Dockerfile
2. Test with both production and development setups
3. Update this README with any new requirements
4. Test the build process thoroughly

---

**Happy Deploying! 🎉**
