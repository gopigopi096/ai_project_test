#!/bin/bash
# IHMS Deployment Script
# Usage: ./deploy.sh [build|start|stop|status|logs]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

function build_backend() {
    echo "Building backend services..."
    ./gradlew clean build -x test --no-daemon --parallel
}

function build_frontend() {
    echo "Building frontend..."
    cd frontend/ihms-portal
    /usr/bin/node /usr/lib/node_modules/npm/bin/npm-cli.js ci
    /usr/bin/node node_modules/.bin/ng build --configuration=production
    cd "$SCRIPT_DIR"
}

function build_docker() {
    echo "Building Docker images..."
    docker-compose -f docker-compose.local.yml build --parallel
}

function start() {
    echo "Starting IHMS services..."
    docker-compose -f docker-compose.local.yml up -d
    echo "Waiting for services to start..."
    sleep 30
    status
}

function stop() {
    echo "Stopping IHMS services..."
    docker-compose -f docker-compose.local.yml down
}

function status() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════╗"
    echo "║                    IHMS Service Status                                ║"
    echo "╠═══════════════════════════════════════════════════════════════════════╣"

    services=("8761:Discovery" "8080:Gateway" "8081:Auth" "8082:Patient" "8083:Appointment" "8084:Billing" "8085:Pharmacy" "3000:Frontend")

    for svc in "${services[@]}"; do
        port="${svc%%:*}"
        name="${svc#*:}"

        if [ "$port" = "3000" ]; then
            health=$(curl -s http://localhost:3000 2>/dev/null | grep -q "html" && echo "UP" || echo "DOWN")
        else
            health=$(curl -s http://localhost:$port/actuator/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "DOWN")
        fi

        if [ "$health" = "UP" ]; then
            echo "║   ✅ $name (port $port): $health"
        else
            echo "║   ❌ $name (port $port): $health"
        fi
    done

    echo "╠═══════════════════════════════════════════════════════════════════════╣"
    echo "║ URLs:                                                                 ║"
    echo "║   Frontend:  http://localhost:3000                                    ║"
    echo "║   Gateway:   http://localhost:8080                                    ║"
    echo "║   Eureka:    http://localhost:8761                                    ║"
    echo "╚═══════════════════════════════════════════════════════════════════════╝"
    echo ""
}

function logs() {
    docker-compose -f docker-compose.local.yml logs -f --tail=100
}

case "${1:-status}" in
    build)
        build_backend
        build_frontend
        build_docker
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        echo "Usage: $0 {build|start|stop|status|logs}"
        exit 1
        ;;
esac

