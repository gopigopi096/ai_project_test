#!/bin/bash
# ==================================================================================
# IHMS Complete Setup & Build Script
# ==================================================================================
# This script will:
# 1. Start Nexus Repository Manager
# 2. Configure Docker for insecure registry
# 3. Start Jenkins
# 4. Build all services
# 5. Build Docker images
# 6. Push Docker images to Nexus
#
# Usage: ./setup-and-push-to-nexus.sh
# ==================================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
NEXUS_PORT=8090
NEXUS_DOCKER_PORT=8091
JENKINS_PORT=8888
DOCKER_REGISTRY="localhost:${NEXUS_DOCKER_PORT}"

print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║          IHMS SETUP & PUSH TO NEXUS SCRIPT                               ║"
    echo "║          Build Docker Images and Push to Nexus Registry                  ║"
    echo "╚══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
}

wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=${3:-60}
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for $name to be ready...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done
    echo -e "${RED}❌ $name failed to start within expected time${NC}"
    return 1
}

# ==================== STEP 1: Create Docker Network ====================
create_network() {
    print_step "STEP 1: Creating Docker Network"

    if docker network ls | grep -q "jenkins_po_source_ihms-network"; then
        echo -e "${GREEN}✅ Network 'jenkins_po_source_ihms-network' already exists${NC}"
    else
        docker network create jenkins_po_source_ihms-network
        echo -e "${GREEN}✅ Created network 'jenkins_po_source_ihms-network'${NC}"
    fi
}

# ==================== STEP 2: Start Nexus ====================
start_nexus() {
    print_step "STEP 2: Starting Nexus Repository Manager"

    if docker ps --format '{{.Names}}' | grep -q "^nexus$"; then
        echo -e "${GREEN}✅ Nexus is already running${NC}"
    else
        docker-compose -f docker-compose.nexus.yml up -d
        echo -e "${YELLOW}⏳ Starting Nexus (this may take 2-3 minutes)...${NC}"
    fi

    wait_for_service "http://localhost:${NEXUS_PORT}/service/rest/v1/status" "Nexus" 120

    # Get Nexus password
    sleep 10
    NEXUS_PASS=$(docker exec nexus cat /nexus-data/admin.password 2>/dev/null || echo "")

    if [ -n "$NEXUS_PASS" ]; then
        echo -e "${GREEN}✅ Nexus Admin Password: ${NEXUS_PASS}${NC}"
        echo "$NEXUS_PASS" > .nexus-password
        echo -e "${YELLOW}⚠️  Password saved to .nexus-password file${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not retrieve password automatically.${NC}"
        echo -e "${YELLOW}   You may have already changed the password.${NC}"
        if [ -f .nexus-password ]; then
            NEXUS_PASS=$(cat .nexus-password)
            echo -e "${GREEN}✅ Using saved password from .nexus-password${NC}"
        elif [ -t 0 ]; then
            echo -e "${YELLOW}   Please enter your Nexus admin password:${NC}"
            read -s NEXUS_PASS
        else
            NEXUS_PASS="admin123"
            echo -e "${YELLOW}   Using default password: admin123${NC}"
        fi
    fi

    export NEXUS_PASS
}

# ==================== STEP 3: Configure Docker Insecure Registry ====================
configure_docker_registry() {
    print_step "STEP 3: Configuring Docker for Insecure Registry"

    if grep -q "localhost:${NEXUS_DOCKER_PORT}" /etc/docker/daemon.json 2>/dev/null; then
        echo -e "${GREEN}✅ Docker already configured for localhost:${NEXUS_DOCKER_PORT}${NC}"
    else
        echo -e "${YELLOW}Adding insecure registry configuration...${NC}"

        # Backup existing config
        if [ -f /etc/docker/daemon.json ]; then
            sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
        fi

        sudo tee /etc/docker/daemon.json > /dev/null << EOF
{
  "insecure-registries": ["localhost:${NEXUS_DOCKER_PORT}", "localhost:8092", "nexus:8082"]
}
EOF

        echo -e "${YELLOW}⚠️  Restarting Docker daemon...${NC}"
        sudo systemctl restart docker
        sleep 10

        # Restart Nexus after Docker restart
        docker start nexus 2>/dev/null || docker-compose -f docker-compose.nexus.yml up -d
        wait_for_service "http://localhost:${NEXUS_PORT}/service/rest/v1/status" "Nexus" 60

        echo -e "${GREEN}✅ Docker configured for insecure registry${NC}"
    fi
}

# ==================== STEP 4: Create Nexus Docker Repository ====================
create_nexus_docker_repo() {
    print_step "STEP 4: Creating Nexus Docker Hosted Repository"

    echo -e "${YELLOW}Checking if docker-hosted repository exists...${NC}"

    # Check if repository exists
    REPO_EXISTS=$(curl -s -u "admin:${NEXUS_PASS}" \
        "http://localhost:${NEXUS_PORT}/service/rest/v1/repositories" \
        2>/dev/null | grep -o '"name":"docker-hosted"' || echo "")

    if [ -n "$REPO_EXISTS" ]; then
        echo -e "${GREEN}✅ docker-hosted repository already exists${NC}"
    else
        echo -e "${YELLOW}Creating docker-hosted repository...${NC}"

        # Create docker-hosted repository
        curl -s -u "admin:${NEXUS_PASS}" \
            -X POST "http://localhost:${NEXUS_PORT}/service/rest/v1/repositories/docker/hosted" \
            -H "Content-Type: application/json" \
            -d '{
                "name": "docker-hosted",
                "online": true,
                "storage": {
                    "blobStoreName": "default",
                    "strictContentTypeValidation": true,
                    "writePolicy": "ALLOW"
                },
                "docker": {
                    "v1Enabled": true,
                    "forceBasicAuth": true,
                    "httpPort": 8082
                }
            }' 2>/dev/null

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Created docker-hosted repository on port 8082${NC}"
        else
            echo -e "${YELLOW}⚠️  Could not create repository automatically.${NC}"
            echo -e "${YELLOW}   Please create it manually in Nexus UI:${NC}"
            echo -e "${YELLOW}   1. Go to http://localhost:${NEXUS_PORT}${NC}"
            echo -e "${YELLOW}   2. Settings → Repositories → Create Repository${NC}"
            echo -e "${YELLOW}   3. Select 'docker (hosted)'${NC}"
            echo -e "${YELLOW}   4. Name: docker-hosted, HTTP Port: 8082${NC}"
            if [ -t 0 ]; then
                echo ""
                read -p "Press Enter after creating the repository..."
            fi
        fi
    fi
}

# ==================== STEP 5: Build All Services ====================
build_services() {
    print_step "STEP 5: Building All Services with Gradle"

    echo -e "${YELLOW}Building all microservices...${NC}"

    chmod +x gradlew

    # Build common-lib first
    echo -e "${CYAN}Building common-lib...${NC}"
    ./gradlew :common-lib:clean :common-lib:build -x test --no-daemon

    # Build all services
    SERVICES=(
        "discovery-service"
        "gateway-service"
        "auth-service"
        "patient-service"
        "appointment-service"
        "billing-service"
        "pharmacy-service"
    )

    for service in "${SERVICES[@]}"; do
        echo -e "${CYAN}Building ${service}...${NC}"
        ./gradlew ":${service}:clean" ":${service}:build" -x test --no-daemon
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ ${service} built successfully${NC}"
        else
            echo -e "${RED}❌ ${service} build failed${NC}"
        fi
    done

    echo -e "${GREEN}✅ All services built${NC}"
}

# ==================== STEP 6: Build Docker Images ====================
build_docker_images() {
    print_step "STEP 6: Building Docker Images"

    SERVICES=(
        "discovery-service"
        "gateway-service"
        "auth-service"
        "patient-service"
        "appointment-service"
        "billing-service"
        "pharmacy-service"
    )

    for service in "${SERVICES[@]}"; do
        echo -e "${CYAN}Building Docker image for ${service}...${NC}"

        if [ -f "${service}/Dockerfile" ]; then
            docker build -t "ihms/${service}:latest" \
                         -t "ihms/${service}:1.0.0" \
                         -t "${DOCKER_REGISTRY}/ihms/${service}:latest" \
                         -t "${DOCKER_REGISTRY}/ihms/${service}:1.0.0" \
                         -f "${service}/Dockerfile" . 2>&1

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Docker image built for ${service}${NC}"
            else
                echo -e "${RED}❌ Docker build failed for ${service}${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Dockerfile not found for ${service}${NC}"
        fi
    done

    # Build frontend
    echo -e "${CYAN}Building Docker image for frontend...${NC}"
    if [ -f "frontend/ihms-portal/Dockerfile" ]; then
        docker build -t "ihms/ihms-portal:latest" \
                     -t "ihms/ihms-portal:1.0.0" \
                     -t "${DOCKER_REGISTRY}/ihms/ihms-portal:latest" \
                     -t "${DOCKER_REGISTRY}/ihms/ihms-portal:1.0.0" \
                     -f "frontend/ihms-portal/Dockerfile" frontend/ihms-portal/ 2>&1

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Docker image built for frontend${NC}"
        else
            echo -e "${RED}❌ Docker build failed for frontend${NC}"
        fi
    fi

    echo -e "\n${GREEN}Docker images built:${NC}"
    docker images | grep -E "ihms|REPOSITORY" | head -20
}

# ==================== STEP 7: Push Docker Images to Nexus ====================
push_docker_images() {
    print_step "STEP 7: Pushing Docker Images to Nexus Registry"

    echo -e "${YELLOW}Logging into Nexus Docker Registry...${NC}"
    echo "${NEXUS_PASS}" | docker login ${DOCKER_REGISTRY} -u admin --password-stdin

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to login to Nexus Docker Registry${NC}"
        echo -e "${YELLOW}Please ensure docker-hosted repository is created with HTTP port 8082${NC}"
        return 1
    fi

    echo -e "${GREEN}✅ Logged into Nexus Docker Registry${NC}"

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

    PUSHED_IMAGES=()
    FAILED_IMAGES=()

    for service in "${SERVICES[@]}"; do
        echo -e "${CYAN}Pushing ${service} to Nexus...${NC}"

        # Push latest tag
        if docker push "${DOCKER_REGISTRY}/ihms/${service}:latest" 2>/dev/null; then
            echo -e "${GREEN}✅ Pushed ${service}:latest${NC}"
            PUSHED_IMAGES+=("$service")
        else
            echo -e "${RED}❌ Failed to push ${service}:latest${NC}"
            FAILED_IMAGES+=("$service")
        fi

        # Push versioned tag
        docker push "${DOCKER_REGISTRY}/ihms/${service}:1.0.0" 2>/dev/null || true
    done

    echo -e "\n${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Successfully pushed ${#PUSHED_IMAGES[@]} images to Nexus:${NC}"
    for img in "${PUSHED_IMAGES[@]}"; do
        echo -e "  ✅ ${DOCKER_REGISTRY}/ihms/${img}:latest"
    done

    if [ ${#FAILED_IMAGES[@]} -gt 0 ]; then
        echo -e "\n${RED}Failed to push ${#FAILED_IMAGES[@]} images:${NC}"
        for img in "${FAILED_IMAGES[@]}"; do
            echo -e "  ❌ ${img}"
        done
    fi

    # Logout
    docker logout ${DOCKER_REGISTRY} 2>/dev/null || true
}

# ==================== STEP 8: Verify Images in Nexus ====================
verify_images() {
    print_step "STEP 8: Verifying Images in Nexus Registry"

    echo -e "${YELLOW}Listing images in Nexus Docker Registry...${NC}"

    CATALOG=$(curl -s -u "admin:${NEXUS_PASS}" "http://localhost:${NEXUS_DOCKER_PORT}/v2/_catalog" 2>/dev/null)

    if [ -n "$CATALOG" ]; then
        echo -e "${GREEN}✅ Images in Nexus Registry:${NC}"
        echo "$CATALOG" | python3 -m json.tool 2>/dev/null || echo "$CATALOG"
    else
        echo -e "${YELLOW}⚠️  Could not retrieve catalog. Registry may need authentication.${NC}"
    fi
}

# ==================== Print Summary ====================
print_summary() {
    echo -e "\n${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║            ✅ IHMS BUILD & PUSH TO NEXUS COMPLETE!                       ║"
    echo "╠══════════════════════════════════════════════════════════════════════════╣"
    echo "║                                                                          ║"
    echo "║  📦 NEXUS REPOSITORY:                                                    ║"
    echo "║     UI:       http://localhost:${NEXUS_PORT}                                      ║"
    echo "║     Registry: localhost:${NEXUS_DOCKER_PORT}                                      ║"
    echo "║     Username: admin                                                      ║"
    echo "║     Password: (saved in .nexus-password)                                 ║"
    echo "║                                                                          ║"
    echo "║  🐳 DOCKER IMAGES PUSHED:                                                ║"
    echo "║     localhost:${NEXUS_DOCKER_PORT}/ihms/discovery-service:latest                  ║"
    echo "║     localhost:${NEXUS_DOCKER_PORT}/ihms/gateway-service:latest                    ║"
    echo "║     localhost:${NEXUS_DOCKER_PORT}/ihms/auth-service:latest                       ║"
    echo "║     localhost:${NEXUS_DOCKER_PORT}/ihms/patient-service:latest                    ║"
    echo "║     localhost:${NEXUS_DOCKER_PORT}/ihms/appointment-service:latest                ║"
    echo "║     localhost:${NEXUS_DOCKER_PORT}/ihms/billing-service:latest                    ║"
    echo "║     localhost:${NEXUS_DOCKER_PORT}/ihms/pharmacy-service:latest                   ║"
    echo "║     localhost:${NEXUS_DOCKER_PORT}/ihms/ihms-portal:latest                        ║"
    echo "║                                                                          ║"
    echo "║  🚀 NEXT STEPS FOR PRODUCTION:                                           ║"
    echo "║     1. Copy to production: deploy-production.sh,                         ║"
    echo "║        docker-compose.production.yml, nexus-tunnel.service               ║"
    echo "║     2. Run: ./deploy-production.sh --nexus-host=<this-ip> --ssh-user=<u> ║"
    echo "║                                                                          ║"
    echo "║  📖 DOCUMENTATION: PRODUCTION_DEPLOYMENT_GUIDE.md                        ║"
    echo "║                                                                          ║"
    echo "╚══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ==================== MAIN ====================
main() {
    print_banner

    echo -e "${YELLOW}This script will:${NC}"
    echo "  1. Create Docker network"
    echo "  2. Start Nexus Repository Manager"
    echo "  3. Configure Docker for insecure registry"
    echo "  4. Create Nexus Docker hosted repository"
    echo "  5. Build all services with Gradle"
    echo "  6. Build Docker images"
    echo "  7. Push Docker images to Nexus"
    echo "  8. Verify images in Nexus"
    echo ""

    # Auto-confirm for non-interactive mode
    if [ -t 0 ]; then
        read -p "Continue? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Setup cancelled.${NC}"
            exit 0
        fi
    else
        echo -e "${GREEN}Running in non-interactive mode...${NC}"
    fi

    create_network
    start_nexus
    configure_docker_registry
    create_nexus_docker_repo
    build_services
    build_docker_images
    push_docker_images
    verify_images
    print_summary
}

main "$@"

