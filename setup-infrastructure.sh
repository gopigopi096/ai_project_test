#!/bin/bash
# IHMS Full CI/CD Infrastructure Setup
# Run this script to set up everything in one go

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

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║               IHMS CI/CD INFRASTRUCTURE SETUP                            ║"
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
        if curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -qE "200|302|403"; then
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

# ==================== Create Docker Network ====================
print_step "STEP 1: Creating Docker Network"

if docker network inspect jenkins_po_source_ihms-network >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Network 'jenkins_po_source_ihms-network' already exists${NC}"
else
    docker network create jenkins_po_source_ihms-network
    echo -e "  ${GREEN}✅ Created network 'jenkins_po_source_ihms-network'${NC}"
fi

# ==================== Start Jenkins ====================
print_step "STEP 2: Starting Jenkins"

# Check if Jenkins containers exist
if docker ps -a --format '{{.Names}}' | grep -q "^jenkins-controller$"; then
    docker start jenkins-controller jenkins-docker 2>/dev/null || true
    echo -e "  ${GREEN}✅ Started existing Jenkins containers${NC}"
else
    # Create Jenkins docker-compose if not exists
    cat > docker-compose.jenkins.yml << 'JENKINSEOF'
version: '3.8'

services:
  jenkins-docker:
    image: docker:dind
    container_name: jenkins-docker
    privileged: true
    environment:
      DOCKER_TLS_CERTDIR: ""
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
      JAVA_OPTS: "-Djenkins.install.runSetupWizard=false"
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

    docker-compose -f docker-compose.jenkins.yml up -d
    echo -e "  ${GREEN}✅ Created and started Jenkins${NC}"
fi

wait_for_service "http://localhost:8888" "Jenkins"

# ==================== Start Nexus ====================
print_step "STEP 3: Starting Nexus Repository Manager"

if docker ps --format '{{.Names}}' | grep -q "^nexus$"; then
    echo -e "  ${GREEN}✅ Nexus is already running${NC}"
else
    docker-compose -f docker-compose.nexus.yml up -d
    echo -e "  ${YELLOW}⏳ Starting Nexus (this may take 2-3 minutes)...${NC}"
fi

wait_for_service "http://localhost:8090" "Nexus" 90

# Get Nexus password
NEXUS_PASS=$(docker exec nexus cat /nexus-data/admin.password 2>/dev/null || echo "")
if [ -n "$NEXUS_PASS" ]; then
    echo -e "  ${GREEN}✅ Nexus Admin Password: ${NEXUS_PASS}${NC}"
    echo -e "  ${YELLOW}⚠️  Save this password! First login will require changing it.${NC}"
fi

# ==================== Configure Docker for Insecure Registry ====================
print_step "STEP 4: Configuring Docker for Nexus Registry"

if grep -q "localhost:8091" /etc/docker/daemon.json 2>/dev/null; then
    echo -e "  ${GREEN}✅ Docker already configured for Nexus registry${NC}"
else
    echo -e "  ${YELLOW}Adding insecure registry configuration...${NC}"
    sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "insecure-registries": ["localhost:8091", "localhost:8092", "nexus:8082"]
}
EOF
    echo -e "  ${YELLOW}⚠️  Docker daemon needs restart${NC}"
    sudo systemctl restart docker
    sleep 10

    # Restart containers
    docker start jenkins-controller jenkins-docker nexus 2>/dev/null || true
    echo -e "  ${GREEN}✅ Docker configured and restarted${NC}"
fi

# ==================== Display SSH Key ====================
print_step "STEP 5: SSH Key for GitHub"

if [ -f ~/.ssh/id_ed25519.pub ]; then
    echo -e "  ${YELLOW}Add this SSH key to GitHub (https://github.com/settings/keys):${NC}"
    echo ""
    cat ~/.ssh/id_ed25519.pub
    echo ""
else
    echo -e "  ${YELLOW}No SSH key found. Create one with:${NC}"
    echo "  ssh-keygen -t ed25519 -C 'your-email@example.com'"
fi

# ==================== Summary ====================
print_step "SETUP COMPLETE!"

echo -e "
${GREEN}╔══════════════════════════════════════════════════════════════════════════╗
║                         ✅ INFRASTRUCTURE READY                           ║
╠══════════════════════════════════════════════════════════════════════════╣${NC}
${BLUE}║ ACCESS URLS:                                                             ║${NC}
║   🔧 Jenkins:        http://localhost:8888                               ║
║   📦 Nexus:          http://localhost:8090                               ║
║   🐳 Docker Registry: localhost:8091                                     ║
${GREEN}╠══════════════════════════════════════════════════════════════════════════╣${NC}
${YELLOW}║ NEXT STEPS:                                                              ║${NC}
║                                                                          ║
║ 1. Get Jenkins initial admin password:                                   ║
║    docker exec jenkins-controller cat /var/jenkins_home/secrets/initialAdminPassword
║                                                                          ║
║ 2. Complete Jenkins setup wizard at http://localhost:8888                ║
║    - Install suggested plugins                                           ║
║    - Create admin user                                                   ║
║                                                                          ║
║ 3. Login to Nexus at http://localhost:8090                               ║
║    - Username: admin                                                     ║
║    - Password: ${NEXUS_PASS:-<check with: docker exec nexus cat /nexus-data/admin.password>}
║    - Complete setup wizard and change password                           ║
║                                                                          ║
║ 4. Create Nexus Docker repository:                                       ║
║    - Settings → Repositories → Create Repository                        ║
║    - Select 'docker (hosted)'                                            ║
║    - Name: docker-hosted, HTTP Port: 8082                                ║
║                                                                          ║
║ 5. Add Jenkins credentials (Manage Jenkins → Credentials):               ║
║    - github-credentials (GitHub PAT)                                     ║
║    - nexus-credentials (Nexus user/pass)                                 ║
║    - nexus-docker-credentials (Nexus user/pass)                          ║
║                                                                          ║
║ 6. Create Jenkins Pipeline job:                                          ║
║    - New Item → 'IHMS-Build' → Pipeline                                  ║
║    - Pipeline from SCM → Git                                             ║
║    - URL: https://github.com/gopigopi096/ai_project_test.git             ║
║    - Credentials: github-credentials                                     ║
║    - Script Path: Jenkinsfile.selectable                                 ║
║                                                                          ║
║ 7. Push code to GitHub:                                                  ║
║    git add -A && git commit -m 'Setup' && git push origin main           ║
║                                                                          ║
${GREEN}╚══════════════════════════════════════════════════════════════════════════╝${NC}

${BLUE}For detailed instructions, see: SETUP_GUIDE.md${NC}
"

