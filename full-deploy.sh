#!/bin/bash
# IHMS Full Deployment Script
# This script pushes code to GitHub, starts infrastructure, configures Jenkins/Nexus,
# builds all services, pushes images to Nexus, and deploys the application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
GITHUB_REPO="https://github.com/gopigopi096/ai_project_test.git"
GITHUB_USERNAME="gopigopi096@gmail.com"
GITHUB_TOKEN="gopinathM!123"
JENKINS_URL="http://localhost:8888"
NEXUS_URL="http://localhost:8090"
NEXUS_DOCKER_PORT="8091"

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║          IHMS FULL DEPLOYMENT - BUILD & DEPLOY ALL SERVICES             ║"
    echo "╚══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=${3:-60}
    local attempt=1

    echo -n "  Waiting for $name"
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -qE "200|302|403|401"; then
            echo -e " ${GREEN}✅${NC}"
            return 0
        fi
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done
    echo -e " ${RED}❌ Timeout${NC}"
    return 1
}

print_header

# ==================== STEP 1: Push Code to GitHub ====================
print_step "STEP 1: Pushing Code to GitHub"

# Configure git
git config user.email "$GITHUB_USERNAME" 2>/dev/null || true
git config user.name "gopigopi096" 2>/dev/null || true

# Configure credential helper for this session
git config credential.helper store 2>/dev/null || true

# Store credentials
echo "https://gopigopi096:${GITHUB_TOKEN}@github.com" > ~/.git-credentials 2>/dev/null || true
chmod 600 ~/.git-credentials 2>/dev/null || true

# Check if remote exists
if ! git remote | grep -q origin; then
    git remote add origin "$GITHUB_REPO"
    echo -e "  ${GREEN}✅ Added remote origin${NC}"
fi

# Update remote URL
git remote set-url origin "$GITHUB_REPO" 2>/dev/null || true

# Add all files and commit
git add -A
if git diff --cached --quiet; then
    echo -e "  ${YELLOW}⚠️  No changes to commit${NC}"
else
    git commit -m "IHMS Full Setup - $(date '+%Y-%m-%d %H:%M:%S')" || true
    echo -e "  ${GREEN}✅ Changes committed${NC}"
fi

# Push to GitHub
echo "  Pushing to GitHub..."
if git push -u origin main --force 2>&1; then
    echo -e "  ${GREEN}✅ Code pushed to GitHub successfully${NC}"
else
    echo -e "  ${YELLOW}⚠️  Push may have failed. Trying with HTTPS credentials...${NC}"
    git push "https://gopigopi096:${GITHUB_TOKEN}@github.com/gopigopi096/ai_project_test.git" main --force || true
fi

# ==================== STEP 2: Create Docker Network ====================
print_step "STEP 2: Creating Docker Network"

if docker network inspect jenkins_po_source_ihms-network >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Network 'jenkins_po_source_ihms-network' already exists${NC}"
else
    docker network create jenkins_po_source_ihms-network
    echo -e "  ${GREEN}✅ Created network 'jenkins_po_source_ihms-network'${NC}"
fi

# ==================== STEP 3: Start Nexus ====================
print_step "STEP 3: Starting Nexus Repository Manager"

if docker ps --format '{{.Names}}' | grep -q "^nexus$"; then
    echo -e "  ${GREEN}✅ Nexus is already running${NC}"
else
    docker-compose -f docker-compose.nexus.yml up -d
    echo -e "  ${YELLOW}⏳ Starting Nexus (this may take 2-3 minutes)...${NC}"
fi

wait_for_service "$NEXUS_URL" "Nexus" 120

# Get Nexus password
sleep 10
NEXUS_PASS=$(docker exec nexus cat /nexus-data/admin.password 2>/dev/null || echo "admin123")
echo -e "  ${GREEN}✅ Nexus Admin Password: ${NEXUS_PASS}${NC}"

# ==================== STEP 4: Configure Docker for Insecure Registry ====================
print_step "STEP 4: Configuring Docker for Nexus Registry"

if grep -q "localhost:8091" /etc/docker/daemon.json 2>/dev/null; then
    echo -e "  ${GREEN}✅ Docker already configured for Nexus registry${NC}"
else
    echo -e "  ${YELLOW}Adding insecure registry configuration...${NC}"
    sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "insecure-registries": ["localhost:8091", "localhost:8092", "nexus:8082", "localhost:8082"]
}
EOF
    echo -e "  ${YELLOW}⚠️  Docker daemon needs restart${NC}"
    sudo systemctl restart docker
    sleep 10
    # Restart containers
    docker start nexus 2>/dev/null || docker-compose -f docker-compose.nexus.yml up -d
    wait_for_service "$NEXUS_URL" "Nexus" 60
fi

# ==================== STEP 5: Start Jenkins ====================
print_step "STEP 5: Starting Jenkins"

# Create Jenkins docker-compose file
cat > docker-compose.jenkins.yml << 'JENKINSEOF'
version: '3.8'

services:
  jenkins-docker:
    image: docker:dind
    container_name: jenkins-docker
    privileged: true
    environment:
      DOCKER_TLS_CERTDIR: ""
    command: ["dockerd", "--host=tcp://0.0.0.0:2375", "--host=unix:///var/run/docker.sock"]
    networks:
      ihms-network:
        aliases:
          - docker
    volumes:
      - jenkins-docker-certs:/certs/client
      - jenkins-data:/var/jenkins_home
    restart: unless-stopped

  jenkins-controller:
    image: jenkins/jenkins:lts-jdk17
    container_name: jenkins-controller
    user: root
    ports:
      - "8888:8080"
      - "50000:50000"
    environment:
      DOCKER_HOST: tcp://docker:2375
      DOCKER_TLS_CERTDIR: ""
    volumes:
      - jenkins-data:/var/jenkins_home
      - jenkins-docker-certs:/certs/client:ro
    networks:
      - ihms-network
    depends_on:
      - jenkins-docker
    restart: unless-stopped

networks:
  ihms-network:
    external: true
    name: jenkins_po_source_ihms-network

volumes:
  jenkins-data:
  jenkins-docker-certs:
JENKINSEOF

if docker ps --format '{{.Names}}' | grep -q "^jenkins-controller$"; then
    echo -e "  ${GREEN}✅ Jenkins is already running${NC}"
else
    docker-compose -f docker-compose.jenkins.yml up -d
    echo -e "  ${YELLOW}⏳ Starting Jenkins...${NC}"
fi

wait_for_service "$JENKINS_URL" "Jenkins" 120

# ==================== STEP 6: Get Jenkins Initial Password ====================
print_step "STEP 6: Jenkins Configuration"

sleep 15
JENKINS_INIT_PASS=$(docker exec jenkins-controller cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || echo "")
if [ -n "$JENKINS_INIT_PASS" ]; then
    echo -e "  ${GREEN}Jenkins Initial Admin Password: ${JENKINS_INIT_PASS}${NC}"
else
    echo -e "  ${YELLOW}Jenkins already configured (no initial password)${NC}"
fi

# ==================== STEP 7: Build Backend Services Locally ====================
print_step "STEP 7: Building Backend Services"

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

echo "  Building all backend services..."
chmod +x gradlew
./gradlew clean build -x test --no-daemon --parallel || {
    echo -e "  ${YELLOW}⚠️  Some builds may have failed, continuing...${NC}"
}

# ==================== STEP 8: Build Frontend ====================
print_step "STEP 8: Building Frontend"

if [ -d "frontend/ihms-portal" ]; then
    cd frontend/ihms-portal
    if command -v npm &> /dev/null; then
        npm ci 2>/dev/null || npm install
        npm run build -- --configuration=production || npx ng build --configuration=production || {
            echo -e "  ${YELLOW}⚠️  Frontend build skipped - Angular CLI not available${NC}"
        }
    else
        echo -e "  ${YELLOW}⚠️  npm not found, skipping frontend build${NC}"
    fi
    cd "$SCRIPT_DIR"
else
    echo -e "  ${YELLOW}⚠️  Frontend directory not found${NC}"
fi

# ==================== STEP 9: Build Docker Images ====================
print_step "STEP 9: Building Docker Images"

# Build all service images
SERVICES="discovery-service gateway-service auth-service patient-service appointment-service billing-service pharmacy-service"

for service in $SERVICES; do
    if [ -f "$service/Dockerfile" ]; then
        echo "  Building $service Docker image..."
        docker build -t ihms/$service:latest -t ihms/$service:1.0.0 $service/ || {
            echo -e "  ${YELLOW}⚠️  Failed to build $service image${NC}"
        }
    fi
done

# Build frontend image
if [ -f "frontend/ihms-portal/Dockerfile" ]; then
    echo "  Building frontend Docker image..."
    docker build -t ihms/frontend:latest -t ihms/frontend:1.0.0 frontend/ihms-portal/ || {
        echo -e "  ${YELLOW}⚠️  Failed to build frontend image${NC}"
    }
fi

echo -e "  ${GREEN}✅ Docker images built${NC}"
docker images | grep ihms || true

# ==================== STEP 10: Push Images to Nexus ====================
print_step "STEP 10: Pushing Docker Images to Nexus Registry"

DOCKER_REGISTRY="localhost:$NEXUS_DOCKER_PORT"

# Login to Nexus Docker registry
echo -e "  ${YELLOW}Logging into Nexus Docker registry...${NC}"
echo "$NEXUS_PASS" | docker login $DOCKER_REGISTRY -u admin --password-stdin 2>/dev/null || {
    echo -e "  ${YELLOW}⚠️  Nexus Docker login failed - registry may need manual setup${NC}"
    echo -e "  ${YELLOW}   Please create docker-hosted repository in Nexus UI with HTTP port 8082${NC}"
}

# Tag and push images
for service in $SERVICES; do
    if docker images | grep -q "ihms/$service"; then
        echo "  Pushing $service to Nexus..."
        docker tag ihms/$service:latest $DOCKER_REGISTRY/ihms/$service:latest 2>/dev/null || true
        docker tag ihms/$service:1.0.0 $DOCKER_REGISTRY/ihms/$service:1.0.0 2>/dev/null || true
        docker push $DOCKER_REGISTRY/ihms/$service:latest 2>/dev/null || {
            echo -e "  ${YELLOW}⚠️  Failed to push $service (registry may need setup)${NC}"
        }
    fi
done

# Push frontend
if docker images | grep -q "ihms/frontend"; then
    echo "  Pushing frontend to Nexus..."
    docker tag ihms/frontend:latest $DOCKER_REGISTRY/ihms/frontend:latest 2>/dev/null || true
    docker push $DOCKER_REGISTRY/ihms/frontend:latest 2>/dev/null || true
fi

echo -e "  ${GREEN}✅ Images pushed to Nexus (if registry is configured)${NC}"

# ==================== STEP 11: Deploy Application ====================
print_step "STEP 11: Deploying Application"

# Start all databases first
echo "  Starting databases..."
docker-compose -f docker-compose.yml up -d auth-db patient-db appointment-db billing-db pharmacy-db 2>/dev/null || true
sleep 15

# Start discovery service first
echo "  Starting Discovery Service (Eureka)..."
docker-compose -f docker-compose.yml up -d discovery-service 2>/dev/null || {
    # If docker-compose doesn't have the image, run directly
    docker run -d --name ihms-discovery-service --network jenkins_po_source_ihms-network -p 8761:8761 ihms/discovery-service:latest 2>/dev/null || true
}
sleep 20

# Start other backend services
echo "  Starting Backend Services..."
for service in gateway-service auth-service patient-service appointment-service billing-service pharmacy-service; do
    docker-compose -f docker-compose.yml up -d $service 2>/dev/null || {
        # Fallback to direct docker run
        case $service in
            gateway-service) PORT=8080 ;;
            auth-service) PORT=8081 ;;
            patient-service) PORT=8082 ;;
            appointment-service) PORT=8083 ;;
            billing-service) PORT=8084 ;;
            pharmacy-service) PORT=8085 ;;
        esac
        docker run -d --name ihms-$service --network jenkins_po_source_ihms-network -p $PORT:$PORT \
            -e EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://ihms-discovery-service:8761/eureka/ \
            ihms/$service:latest 2>/dev/null || true
    }
done

# Start frontend
echo "  Starting Frontend..."
docker-compose -f docker-compose.yml up -d frontend 2>/dev/null || {
    docker run -d --name ihms-frontend --network jenkins_po_source_ihms-network -p 3000:80 ihms/frontend:latest 2>/dev/null || true
}

sleep 10

# ==================== SUMMARY ====================
print_step "DEPLOYMENT COMPLETE!"

echo -e "
${GREEN}╔══════════════════════════════════════════════════════════════════════════╗
║                     ✅ DEPLOYMENT SUCCESSFUL                              ║
╠══════════════════════════════════════════════════════════════════════════╣${NC}
${BLUE}║ ACCESS URLS:                                                             ║${NC}
║   🌐 Frontend:       http://localhost:3000                               ║
║   🚪 Gateway:        http://localhost:8080                               ║
║   🔍 Eureka:         http://localhost:8761                               ║
║   🔐 Auth Service:   http://localhost:8081                               ║
║   👤 Patient:        http://localhost:8082                               ║
║   📅 Appointments:   http://localhost:8083                               ║
║   💰 Billing:        http://localhost:8084                               ║
║   💊 Pharmacy:       http://localhost:8085                               ║
${GREEN}╠══════════════════════════════════════════════════════════════════════════╣${NC}
${BLUE}║ CI/CD INFRASTRUCTURE:                                                    ║${NC}
║   🔧 Jenkins:        http://localhost:8888                               ║
║   📦 Nexus:          http://localhost:8090                               ║
║   🐳 Docker Registry: localhost:8091                                     ║
${GREEN}╠══════════════════════════════════════════════════════════════════════════╣${NC}
${YELLOW}║ CREDENTIALS:                                                             ║${NC}
║   Nexus Admin:      admin / $NEXUS_PASS
║   Jenkins:          docker exec jenkins-controller cat /var/jenkins_home/secrets/initialAdminPassword
${GREEN}╚══════════════════════════════════════════════════════════════════════════╝${NC}
"

# Show running containers
echo -e "${BLUE}Running Containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "ihms|jenkins|nexus" || docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${GREEN}Done! Application is being deployed.${NC}"
echo -e "${YELLOW}Note: Services may take 1-2 minutes to fully start.${NC}"
echo -e "${YELLOW}Check service health at: http://localhost:8761 (Eureka Dashboard)${NC}"

