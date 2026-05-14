#!/bin/bash

# PBL5 Smart Cane Server - Management Script
# Usage: ./run.sh [command] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Functions
print_header() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check Docker installation
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker and Docker Compose are installed"
}

# Show help
show_help() {
    cat << EOF
${BLUE}PBL5 Smart Cane Server - Management Script${NC}

${GREEN}Usage:${NC}
  ./run.sh [command] [options]

${GREEN}Commands:${NC}
  ${YELLOW}start${NC}          Start all services
  ${YELLOW}stop${NC}           Stop all services
  ${YELLOW}restart${NC}        Restart all services
  ${YELLOW}logs${NC}           Show all logs (follow mode)
  ${YELLOW}logs:worker${NC}    Show worker logs only
  ${YELLOW}logs:api${NC}       Show API logs only
  ${YELLOW}logs:nginx${NC}     Show Nginx logs only
  ${YELLOW}build${NC}          Build all images
  ${YELLOW}build:clean${NC}    Clean rebuild (no cache)
  ${YELLOW}ps${NC}             Show running services
  ${YELLOW}status${NC}         Check service health
  ${YELLOW}health${NC}         Run health checks
  ${YELLOW}shell:worker${NC}   Open shell in worker container
  ${YELLOW}shell:api${NC}      Open shell in API container
  ${YELLOW}shell:mongo${NC}    Open shell in MongoDB container
  ${YELLOW}shell:redis${NC}    Open shell in Redis container
  ${YELLOW}clean${NC}          Remove stopped containers
  ${YELLOW}clean:all${NC}      Full cleanup (keep volumes)
  ${YELLOW}clean:volumes${NC}  Remove everything including volumes
  ${YELLOW}stats${NC}          Show resource usage
  ${YELLOW}reset${NC}          Nuclear reset (remove all)
  ${YELLOW}update${NC}         Update and restart services
  ${YELLOW}info${NC}           Show system information
  ${YELLOW}help${NC}           Show this help message

${GREEN}Examples:${NC}
  ./run.sh start
  ./run.sh logs:worker
  ./run.sh build:clean
  ./run.sh shell:api
  ./run.sh health

${GREEN}URLs:${NC}
  API Health: http://localhost/api/health
  API Docs:   http://localhost/docs
  MongoDB:    http://localhost:8081
  MinIO:      http://localhost:9001

EOF
}

# Start services
cmd_start() {
    print_header "Starting PBL5 Services"
    check_docker

    if [ "$1" = "--build" ]; then
        print_info "Building images..."
        docker-compose build
    fi

    print_info "Starting containers..."
    docker-compose up -d

    sleep 3
    print_info "Waiting for services to be ready..."
    sleep 5

    cmd_status
}

# Stop services
cmd_stop() {
    print_header "Stopping PBL5 Services"
    docker-compose down
    print_success "All services stopped"
}

# Restart services
cmd_restart() {
    print_header "Restarting PBL5 Services"
    cmd_stop
    sleep 2
    cmd_start
}

# Show logs
cmd_logs() {
    local service="$1"

    if [ -z "$service" ]; then
        print_header "All Service Logs"
        docker-compose logs -f
    else
        print_header "Logs: $service"
        docker-compose logs -f "$service"
    fi
}

# Build images
cmd_build() {
    local no_cache=""

    if [ "$1" = "clean" ] || [ "$1" = "--no-cache" ]; then
        no_cache="--no-cache"
        print_header "Building Images (No Cache)"
    else
        print_header "Building Images"
    fi

    docker-compose build $no_cache
    print_success "Build completed"
}

# Show running containers
cmd_ps() {
    print_header "Running Services"
    docker-compose ps
}

# Check service status
cmd_status() {
    print_header "Service Status"
    docker-compose ps
    echo ""
    print_info "Checking health..."

    if docker-compose exec -T api curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "API: Healthy"
    else
        print_error "API: Not responding"
    fi

    if docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        print_success "MongoDB: Healthy"
    else
        print_error "MongoDB: Not responding"
    fi

    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis: Healthy"
    else
        print_error "Redis: Not responding"
    fi
}

# Health checks
cmd_health() {
    print_header "Health Checks"

    echo ""
    print_info "Testing API endpoint..."
    if curl -s http://localhost/api/health | grep -q "ok"; then
        print_success "API endpoint responding"
    else
        print_error "API endpoint not responding"
    fi

    echo ""
    print_info "Testing Swagger documentation..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/docs | grep -q "200\|301"; then
        print_success "Swagger documentation accessible"
    else
        print_error "Swagger documentation not accessible"
    fi

    echo ""
    print_info "Testing MongoDB Express..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 | grep -q "200"; then
        print_success "MongoDB Express accessible"
    else
        print_error "MongoDB Express not accessible"
    fi

    echo ""
    print_info "Testing MinIO console..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:9001 | grep -q "200"; then
        print_success "MinIO console accessible"
    else
        print_error "MinIO console not accessible"
    fi

    echo ""
    print_info "Container health status:"
    docker-compose ps --format "table {{.Service}}\t{{.Status}}"
}

# Shell access
cmd_shell() {
    local service="$1"

    if [ -z "$service" ]; then
        print_error "Please specify service: worker, api, mongo, redis"
        exit 1
    fi

    print_info "Opening shell in $service container..."

    case "$service" in
        worker)
            docker-compose exec worker bash
            ;;
        api)
            docker-compose exec api sh
            ;;
        mongo)
            docker-compose exec mongo mongosh
            ;;
        redis)
            docker-compose exec redis redis-cli
            ;;
        *)
            print_error "Unknown service: $service"
            exit 1
            ;;
    esac
}

# Clean up
cmd_clean() {
    local mode="$1"

    if [ "$mode" = "all" ]; then
        print_header "Full Cleanup (Keeping Volumes)"
        docker-compose down
        docker system prune -f
        print_success "Cleanup completed"
    elif [ "$mode" = "volumes" ]; then
        print_header "Nuclear Cleanup (Removing Everything)"
        print_warning "This will delete all data! Press Ctrl+C to cancel..."
        sleep 3
        docker-compose down -v
        docker system prune -a --volumes -f
        print_success "Complete cleanup finished"
    else
        print_header "Removing Stopped Containers"
        docker container prune -f
        print_success "Cleanup completed"
    fi
}

# Show resource usage
cmd_stats() {
    print_header "Container Resource Usage"
    docker stats --no-stream
}

# Reset everything
cmd_reset() {
    print_header "FULL SYSTEM RESET"
    print_warning "This will remove EVERYTHING. Type 'yes' to continue:"
    read -r confirm

    if [ "$confirm" != "yes" ]; then
        print_info "Reset cancelled"
        return
    fi

    print_warning "Removing all containers, images, and volumes..."
    docker-compose down -v
    docker system prune -a --volumes -f
    print_success "System reset complete"
}

# Update and restart
cmd_update() {
    print_header "Updating Services"
    print_info "Rebuilding images..."
    docker-compose build --no-cache

    print_info "Restarting services..."
    docker-compose down
    docker-compose up -d

    sleep 3
    cmd_status
}

# Show system info
cmd_info() {
    print_header "System Information"

    echo ""
    print_info "Docker versions:"
    docker --version
    docker-compose --version

    echo ""
    print_info "Running containers:"
    docker-compose ps --format "{{.Service}}: {{.Status}}"

    echo ""
    print_info "Disk usage:"
    docker system df

    echo ""
    print_info "Environment:"
    if [ -f ".env" ]; then
        print_success ".env file exists"
        grep -E "^[^#].*=" .env | head -5
        echo "..."
    else
        print_warning ".env file not found"
    fi

    echo ""
    print_info "Project files:"
    echo "  Server: $(du -sh Server 2>/dev/null || echo 'N/A')"
    echo "  Worker: $(du -sh worker 2>/dev/null || echo 'N/A')"
    echo "  Nginx:  $(du -sh nginx 2>/dev/null || echo 'N/A')"
}

# Main command handler
main() {
    local command="${1:-help}"
    local arg1="${2:-}"

    case "$command" in
        start)
            cmd_start "$arg1"
            ;;
        stop)
            cmd_stop
            ;;
        restart)
            cmd_restart
            ;;
        logs)
            cmd_logs "$arg1"
            ;;
        logs:worker)
            cmd_logs "worker"
            ;;
        logs:api)
            cmd_logs "api"
            ;;
        logs:nginx)
            cmd_logs "nginx"
            ;;
        build)
            cmd_build "$arg1"
            ;;
        build:clean)
            cmd_build "clean"
            ;;
        ps)
            cmd_ps
            ;;
        status)
            cmd_status
            ;;
        health)
            cmd_health
            ;;
        shell:worker)
            cmd_shell "worker"
            ;;
        shell:api)
            cmd_shell "api"
            ;;
        shell:mongo)
            cmd_shell "mongo"
            ;;
        shell:redis)
            cmd_shell "redis"
            ;;
        clean)
            cmd_clean "$arg1"
            ;;
        clean:all)
            cmd_clean "all"
            ;;
        clean:volumes)
            cmd_clean "volumes"
            ;;
        stats)
            cmd_stats
            ;;
        reset)
            cmd_reset
            ;;
        update)
            cmd_update
            ;;
        info)
            cmd_info
            ;;
        help|-h|--help)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
