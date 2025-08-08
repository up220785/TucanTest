#!/bin/bash

# TucanTest Docker Deployment Script
echo "🐳 TucanTest Docker Deployment Script"
echo "====================================="

# Function to check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        echo "   Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        echo "   Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    echo "✅ Docker and Docker Compose are available"
}

# Function to display menu
show_menu() {
    echo ""
    echo "Please choose a deployment option:"
    echo "1) 🚀 Production deployment (with Nginx reverse proxy)"
    echo "2) 🛠️  Development deployment (with hot reloading)"
    echo "3) 📊 Show running services status"
    echo "4) 📋 Show service logs"
    echo "5) 🛑 Stop all services"
    echo "6) 🔄 Rebuild and restart services"
    echo "7) 🧹 Clean up (stop and remove containers, networks, volumes)"
    echo "8) ❌ Exit"
    echo ""
}

# Function to deploy production
deploy_production() {
    echo "🚀 Starting production deployment..."
    docker-compose down 2>/dev/null
    docker-compose up -d --build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Production deployment successful!"
        echo ""
        echo "🌐 Access your application at:"
        echo "   • Main Application: http://localhost"
        echo "   • Frontend Direct:  http://localhost:4173"
        echo "   • Backend API:      http://localhost:5000"
        echo "   • Swagger UI:       http://localhost:5000/api/docs/"
        echo ""
        echo "🔍 Check status with: docker-compose ps"
        echo "📋 View logs with:    docker-compose logs -f"
    else
        echo "❌ Production deployment failed!"
    fi
}

# Function to deploy development
deploy_development() {
    echo "🛠️  Starting development deployment..."
    docker-compose -f docker-compose.dev.yml down 2>/dev/null
    docker-compose -f docker-compose.dev.yml up -d --build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Development deployment successful!"
        echo ""
        echo "🌐 Access your application at:"
        echo "   • Frontend (Vite):  http://localhost:5173"
        echo "   • Backend API:      http://localhost:5000"
        echo "   • Swagger UI:       http://localhost:5000/api/docs/"
        echo ""
        echo "🔄 Hot reloading is enabled for development"
        echo "🔍 Check status with: docker-compose -f docker-compose.dev.yml ps"
        echo "📋 View logs with:    docker-compose -f docker-compose.dev.yml logs -f"
    else
        echo "❌ Development deployment failed!"
    fi
}

# Function to show status
show_status() {
    echo "📊 Checking service status..."
    echo ""
    echo "Production services:"
    docker-compose ps 2>/dev/null || echo "No production services running"
    echo ""
    echo "Development services:"
    docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "No development services running"
}

# Function to show logs
show_logs() {
    echo "Which logs would you like to see?"
    echo "1) Production logs"
    echo "2) Development logs"
    echo "3) Backend logs only"
    echo "4) Frontend logs only"
    read -p "Enter your choice (1-4): " log_choice
    
    case $log_choice in
        1)
            echo "📋 Showing production logs (press Ctrl+C to exit)..."
            docker-compose logs -f
            ;;
        2)
            echo "📋 Showing development logs (press Ctrl+C to exit)..."
            docker-compose -f docker-compose.dev.yml logs -f
            ;;
        3)
            echo "📋 Showing backend logs (press Ctrl+C to exit)..."
            docker-compose logs -f backend 2>/dev/null || docker-compose -f docker-compose.dev.yml logs -f backend
            ;;
        4)
            echo "📋 Showing frontend logs (press Ctrl+C to exit)..."
            docker-compose logs -f frontend 2>/dev/null || docker-compose -f docker-compose.dev.yml logs -f frontend
            ;;
        *)
            echo "❌ Invalid choice"
            ;;
    esac
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping all services..."
    docker-compose down 2>/dev/null
    docker-compose -f docker-compose.dev.yml down 2>/dev/null
    echo "✅ All services stopped"
}

# Function to rebuild and restart
rebuild_restart() {
    echo "🔄 Rebuilding and restarting services..."
    echo "Which deployment?"
    echo "1) Production"
    echo "2) Development"
    read -p "Enter your choice (1-2): " rebuild_choice
    
    case $rebuild_choice in
        1)
            docker-compose down 2>/dev/null
            docker-compose build --no-cache
            docker-compose up -d
            echo "✅ Production services rebuilt and restarted"
            ;;
        2)
            docker-compose -f docker-compose.dev.yml down 2>/dev/null
            docker-compose -f docker-compose.dev.yml build --no-cache
            docker-compose -f docker-compose.dev.yml up -d
            echo "✅ Development services rebuilt and restarted"
            ;;
        *)
            echo "❌ Invalid choice"
            ;;
    esac
}

# Function to clean up
cleanup() {
    echo "🧹 This will stop and remove all containers, networks, and volumes."
    read -p "Are you sure? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo "🧹 Cleaning up..."
        docker-compose down --volumes --remove-orphans 2>/dev/null
        docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans 2>/dev/null
        docker system prune -f
        echo "✅ Cleanup completed"
    else
        echo "❌ Cleanup cancelled"
    fi
}

# Main script
main() {
    check_docker
    
    while true; do
        show_menu
        read -p "Enter your choice (1-8): " choice
        
        case $choice in
            1)
                deploy_production
                ;;
            2)
                deploy_development
                ;;
            3)
                show_status
                ;;
            4)
                show_logs
                ;;
            5)
                stop_services
                ;;
            6)
                rebuild_restart
                ;;
            7)
                cleanup
                ;;
            8)
                echo "👋 Goodbye!"
                exit 0
                ;;
            *)
                echo "❌ Invalid choice. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run the main function
main
