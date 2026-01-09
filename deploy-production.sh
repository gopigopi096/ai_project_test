#!/bin/bash
# IHMS Production Deployment Script
# Deploys IHMS microservices by pulling Docker images from Nexus via SSH tunnel
#
# Prerequisites:
# - SSH key access to Nexus host (copy key before running this script)
# - Docker installed on production server
# - sudo access for Docker daemon configuration
#
# Usage: ./deploy-production.sh --nexus-host=<ip> --ssh-user=<user>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Default values
NEXUS_HOST=""
SSH_USER=""
NEXUS_DOCKER_PORT=8091
LOCAL_TUNNEL_PORT=8091
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --nexus-host=*)
            NEXUS_HOST="${arg#*=}"
            shift
            ;;
        --ssh-user=*)
            SSH_USER="${arg#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 --nexus-host=<ip> --ssh-user=<user>"
            echo ""
            echo "Options:"
            echo "  --nexus-host=<ip>    IP address or hostname of Nexus server"
            echo "  --ssh-user=<user>    SSH username for connecting to Nexus host"
            echo ""
            echo "Prerequisites:"
            echo "  - SSH key access to Nexus host"
            echo "  - Docker installed on this server"
            echo "  - sudo access for Docker daemon configuration"
            exit 0
            ;;
        *)
            ;;
    esac
done

# Validate required arguments
if [ -z "$NEXUS_HOST" ] || [ -z "$SSH_USER" ]; then
    echo -e "${RED}❌ Error: Missing required arguments${NC}"
    echo "Usage: $0 --nexus-host=<ip> --ssh-user=<user>"
    exit 1
fi

print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║          IHMS PRODUCTION DEPLOYMENT SCRIPT                               ║"
    echo "║          Deploy via Nexus Docker Registry (SSH Tunnel)                   ║"
    echo "╚══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
}

# ==================== STEP 1: Install autossh ====================
install_autossh() {
    print_step "STEP 1: Installing autossh for persistent SSH tunnel"

    if command -v autossh &> /dev/null; then
        echo -e "${GREEN}✅ autossh is already installed${NC}"
    else
        echo -e "${YELLOW}Installing autossh...${NC}"
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y autossh
        elif command -v yum &> /dev/null; then
            sudo yum install -y autossh
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y autossh
        else
            echo -e "${RED}❌ Could not install autossh. Please install manually.${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ autossh installed successfully${NC}"
    fi
}

# ==================== STEP 2: Setup SSH Tunnel Systemd Service ====================
setup_tunnel_service() {
    print_step "STEP 2: Setting up persistent SSH tunnel service"

    # Create systemd service file
    sudo tee /etc/systemd/system/nexus-tunnel.service > /dev/null << EOF
[Unit]
Description=SSH Tunnel to Nexus Docker Registry
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
Environment="AUTOSSH_GATETIME=0"
ExecStart=/usr/bin/autossh -M 0 -o "ServerAliveInterval=30" -o "ServerAliveCountMax=3" -o "StrictHostKeyChecking=accept-new" -N -L ${LOCAL_TUNNEL_PORT}:localhost:${NEXUS_DOCKER_PORT} ${SSH_USER}@${NEXUS_HOST}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    echo -e "${GREEN}✅ Created /etc/systemd/system/nexus-tunnel.service${NC}"

    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable nexus-tunnel.service
    sudo systemctl start nexus-tunnel.service

    # Wait for tunnel to establish
    echo -e "${YELLOW}⏳ Waiting for SSH tunnel to establish...${NC}"
    sleep 5

    # Check if tunnel is running
    if sudo systemctl is-active --quiet nexus-tunnel.service; then
        echo -e "${GREEN}✅ SSH tunnel service is running${NC}"
    else
        echo -e "${RED}❌ SSH tunnel service failed to start${NC}"
        echo -e "${YELLOW}Check status with: sudo systemctl status nexus-tunnel.service${NC}"
        echo -e "${YELLOW}Check logs with: sudo journalctl -u nexus-tunnel.service${NC}"
        exit 1
    fi
}

# ==================== STEP 3: Configure Docker for Insecure Registry ====================
configure_docker() {
    print_step "STEP 3: Configuring Docker for insecure registry"

    DAEMON_JSON="/etc/docker/daemon.json"

    if [ -f "$DAEMON_JSON" ]; then
        if grep -q "localhost:${LOCAL_TUNNEL_PORT}" "$DAEMON_JSON"; then
            echo -e "${GREEN}✅ Docker already configured for localhost:${LOCAL_TUNNEL_PORT}${NC}"
            return
        fi
        # Backup existing config
        sudo cp "$DAEMON_JSON" "${DAEMON_JSON}.backup.$(date +%Y%m%d%H%M%S)"
    fi

    # Create or update daemon.json
    sudo tee "$DAEMON_JSON" > /dev/null << EOF
{
  "insecure-registries": ["localhost:${LOCAL_TUNNEL_PORT}"]
}
EOF

    echo -e "${YELLOW}Restarting Docker daemon...${NC}"
    sudo systemctl restart docker
    sleep 5

    echo -e "${GREEN}✅ Docker configured for insecure registry localhost:${LOCAL_TUNNEL_PORT}${NC}"
}

# ==================== STEP 4: Test Nexus Connection ====================
test_nexus_connection() {
    print_step "STEP 4: Testing Nexus Docker Registry connection"

    # Test if tunnel is working
    if curl -s --connect-timeout 5 "http://localhost:${LOCAL_TUNNEL_PORT}/v2/" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Nexus Docker Registry is accessible via tunnel${NC}"
    else
        echo -e "${YELLOW}⚠️  Registry API not responding (this may be normal if not yet logged in)${NC}"
        echo -e "${YELLOW}   Continuing with deployment...${NC}"
    fi
}

# ==================== STEP 5: Pull Docker Images ====================
pull_images() {
    print_step "STEP 5: Pulling IHMS Docker images from Nexus"

    REGISTRY="localhost:${LOCAL_TUNNEL_PORT}"

    # List of all IHMS services
    SERVICES=(
        "discovery-service"
        "gateway-service"
        "auth-service"
        "patient-service"
        "appointment-service"
        "billing-service"
        "pharmacy-service"
        "ihms-portal"
    )

    echo -e "${YELLOW}Logging into Nexus Docker Registry...${NC}"
    echo -e "${YELLOW}Enter Nexus credentials when prompted:${NC}"
    docker login $REGISTRY

    echo -e "\n${YELLOW}Pulling images...${NC}"

    PULLED_IMAGES=()
    FAILED_IMAGES=()

    for service in "${SERVICES[@]}"; do
        echo -e "\n${CYAN}Pulling ${service}...${NC}"
        if docker pull "${REGISTRY}/ihms/${service}:latest" 2>/dev/null; then
            echo -e "${GREEN}✅ Pulled ${service}${NC}"
            PULLED_IMAGES+=("$service")
        else
            echo -e "${YELLOW}⚠️  Failed to pull ${service} (may not exist yet)${NC}"
            FAILED_IMAGES+=("$service")
        fi
    done

    echo -e "\n${GREEN}Successfully pulled ${#PULLED_IMAGES[@]} images:${NC}"
    for img in "${PULLED_IMAGES[@]}"; do
        echo -e "  ✅ $img"
    done

    if [ ${#FAILED_IMAGES[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}Failed to pull ${#FAILED_IMAGES[@]} images:${NC}"
        for img in "${FAILED_IMAGES[@]}"; do
            echo -e "  ⚠️  $img"
        done
    fi
}

# ==================== STEP 6: Deploy Services ====================
deploy_services() {
    print_step "STEP 6: Deploying IHMS services"

    # Check if docker-compose.production.yml exists
    if [ ! -f "$SCRIPT_DIR/docker-compose.production.yml" ]; then
        echo -e "${RED}❌ docker-compose.production.yml not found!${NC}"
        echo -e "${YELLOW}Please ensure docker-compose.production.yml is in the same directory.${NC}"
        exit 1
    fi

    cd "$SCRIPT_DIR"

    # Create Docker network if not exists
    echo -e "${YELLOW}Creating Docker network...${NC}"
    docker network create ihms-production-network 2>/dev/null || echo -e "${GREEN}Network already exists${NC}"

    # Step 1: Start databases first
    echo -e "\n${CYAN}Starting databases...${NC}"
    docker-compose -f docker-compose.production.yml up -d \
        auth-db patient-db appointment-db billing-db pharmacy-db

    echo -e "${YELLOW}⏳ Waiting for databases to be ready (30 seconds)...${NC}"
    sleep 30

    # Step 2: Start discovery service
    echo -e "\n${CYAN}Starting Discovery Service (Eureka)...${NC}"
    docker-compose -f docker-compose.production.yml up -d discovery-service

    echo -e "${YELLOW}⏳ Waiting for Discovery Service to be ready (30 seconds)...${NC}"
    sleep 30

    # Step 3: Start Gateway service
    echo -e "\n${CYAN}Starting Gateway Service...${NC}"
    docker-compose -f docker-compose.production.yml up -d gateway-service

    echo -e "${YELLOW}⏳ Waiting for Gateway Service to be ready (15 seconds)...${NC}"
    sleep 15

    # Step 4: Start remaining backend services
    echo -e "\n${CYAN}Starting remaining backend services...${NC}"
    docker-compose -f docker-compose.production.yml up -d \
        auth-service patient-service appointment-service billing-service pharmacy-service

    echo -e "${YELLOW}⏳ Waiting for backend services to be ready (20 seconds)...${NC}"
    sleep 20

    # Step 5: Start frontend
    echo -e "\n${CYAN}Starting Frontend (Angular Portal)...${NC}"
    docker-compose -f docker-compose.production.yml up -d ihms-portal

    sleep 10

    echo -e "${GREEN}✅ All services deployed!${NC}"
}

# ==================== STEP 7: Verify Deployment ====================
verify_deployment() {
    print_step "STEP 7: Verifying deployment"

    echo -e "\n${CYAN}Running containers:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "ihms|prod" || echo "No IHMS containers found"

    echo -e "\n${CYAN}Service health checks:${NC}"

    # Health check endpoints
    declare -A SERVICES
    SERVICES["Discovery Service"]=8761
    SERVICES["Gateway Service"]=8080
    SERVICES["Auth Service"]=8081
    SERVICES["Patient Service"]=8082
    SERVICES["Appointment Service"]=8083
    SERVICES["Billing Service"]=8084
    SERVICES["Pharmacy Service"]=8085
    SERVICES["Frontend"]=3000

    for service in "${!SERVICES[@]}"; do
        port=${SERVICES[$service]}
        if [ "$service" = "Frontend" ]; then
            status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${port}" 2>/dev/null || echo "000")
        else
            status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${port}/actuator/health" 2>/dev/null || echo "000")
        fi

        if [ "$status" = "200" ]; then
            echo -e "  ${GREEN}✅ $service (port $port): UP${NC}"
        else
            echo -e "  ${YELLOW}⚠️  $service (port $port): DOWN or starting...${NC}"
        fi
    done
}

# ==================== STEP 8: Print Summary ====================
print_summary() {
    echo -e "\n${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║            ✅ IHMS PRODUCTION DEPLOYMENT COMPLETE!                       ║"
    echo "╠══════════════════════════════════════════════════════════════════════════╣"
    echo "║                                                                          ║"
    echo "║  🔗 SSH TUNNEL:                                                          ║"
    echo "║     Service: nexus-tunnel.service                                        ║"
    echo "║     Status:  sudo systemctl status nexus-tunnel.service                  ║"
    echo "║     Logs:    sudo journalctl -u nexus-tunnel.service -f                  ║"
    echo "║                                                                          ║"
    echo "║  🐳 DOCKER REGISTRY:                                                     ║"
    echo "║     Registry: localhost:${LOCAL_TUNNEL_PORT}                                          ║"
    echo "║     Pull:     docker pull localhost:${LOCAL_TUNNEL_PORT}/ihms/<service>:latest        ║"
    echo "║                                                                          ║"
    echo "║  🌐 ACCESS URLS:                                                         ║"
    echo "║     Frontend:      http://localhost:3000                                 ║"
    echo "║     API Gateway:   http://localhost:8080                                 ║"
    echo "║     Eureka:        http://localhost:8761                                 ║"
    echo "║                                                                          ║"
    echo "║  📋 USEFUL COMMANDS:                                                     ║"
    echo "║     View logs:      docker-compose -f docker-compose.production.yml logs -f ║"
    echo "║     Stop all:       docker-compose -f docker-compose.production.yml down ║"
    echo "║     Restart all:    docker-compose -f docker-compose.production.yml restart ║"
    echo "║                                                                          ║"
    echo "║  ⚠️  NOTES:                                                               ║"
    echo "║     - SSH key must be set up for tunnel to work                          ║"
    echo "║     - Firewall must allow SSH (port 22) to Nexus host                    ║"
    echo "║                                                                          ║"
    echo "╚══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ==================== MAIN ====================
main() {
    print_banner

    echo -e "${CYAN}Configuration:${NC}"
    echo -e "  Nexus Host:     ${NEXUS_HOST}"
    echo -e "  SSH User:       ${SSH_USER}"
    echo -e "  Docker Port:    ${NEXUS_DOCKER_PORT}"
    echo -e "  Local Port:     ${LOCAL_TUNNEL_PORT}"
    echo ""

    read -p "Continue with deployment? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 0
    fi

    install_autossh
    setup_tunnel_service
    configure_docker
    test_nexus_connection
    pull_images
    deploy_services
    verify_deployment
    print_summary
}

main "$@"

