#!/bin/bash
# IHMS Nexus Setup Script
# This script sets up Nexus Repository Manager and configures Jenkins

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                    IHMS NEXUS SETUP SCRIPT                               ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to wait for Nexus to be ready
wait_for_nexus() {
    echo -e "${YELLOW}⏳ Waiting for Nexus to start (this may take 2-3 minutes)...${NC}"
    local max_attempts=60
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8090/service/rest/v1/status > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Nexus is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done

    echo -e "${RED}❌ Nexus failed to start within expected time${NC}"
    return 1
}

# Step 1: Start Nexus
echo -e "${BLUE}Step 1: Starting Nexus Repository Manager...${NC}"
docker-compose -f docker-compose.nexus.yml up -d

# Step 2: Wait for Nexus
wait_for_nexus

# Step 3: Get admin password
echo -e "\n${BLUE}Step 2: Retrieving Nexus admin password...${NC}"
NEXUS_PASSWORD=""
for i in {1..30}; do
    NEXUS_PASSWORD=$(docker exec nexus cat /nexus-data/admin.password 2>/dev/null || echo "")
    if [ -n "$NEXUS_PASSWORD" ]; then
        break
    fi
    sleep 5
done

if [ -n "$NEXUS_PASSWORD" ]; then
    echo -e "${GREEN}✅ Nexus Admin Password: ${NEXUS_PASSWORD}${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Save this password! You'll need it to login.${NC}"
    echo -e "${YELLOW}   After first login, you'll be prompted to change it.${NC}"
else
    echo -e "${YELLOW}⚠️  Could not retrieve password. Check manually:${NC}"
    echo "   docker exec nexus cat /nexus-data/admin.password"
fi

# Step 4: Configure Docker daemon for insecure registry
echo -e "\n${BLUE}Step 3: Configuring Docker for Nexus registry...${NC}"
if [ -f /etc/docker/daemon.json ]; then
    # Backup existing config
    sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
fi

# Check if insecure-registries already configured
if grep -q "localhost:8091" /etc/docker/daemon.json 2>/dev/null; then
    echo -e "${GREEN}✅ Docker already configured for Nexus registry${NC}"
else
    echo -e "${YELLOW}Adding Nexus registry to Docker daemon config...${NC}"
    sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "insecure-registries": ["localhost:8091", "localhost:8092", "nexus:8082"]
}
EOF
    echo -e "${YELLOW}⚠️  Docker daemon needs restart. Restarting...${NC}"
    sudo systemctl restart docker
    sleep 10

    # Restart containers
    echo -e "${YELLOW}Restarting IHMS containers...${NC}"
    docker-compose -f docker-compose.local.yml up -d 2>/dev/null || true
    docker-compose -f docker-compose.nexus.yml up -d
fi

# Step 5: Display final information
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ NEXUS SETUP COMPLETE!                              ║"
echo "╠══════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                          ║"
echo "║  📦 Nexus Web UI:     http://localhost:8090                              ║"
echo "║  🐳 Docker Registry:  localhost:8091                                     ║"
echo "║                                                                          ║"
echo "║  👤 Username: admin                                                      ║"
echo "║  🔑 Password: ${NEXUS_PASSWORD:-<check with: docker exec nexus cat /nexus-data/admin.password>}"
echo "║                                                                          ║"
echo "╠══════════════════════════════════════════════════════════════════════════╣"
echo "║  NEXT STEPS:                                                             ║"
echo "║                                                                          ║"
echo "║  1. Open http://localhost:8090 and login with admin credentials          ║"
echo "║  2. Complete the setup wizard (change password)                          ║"
echo "║  3. Create Docker hosted repository:                                     ║"
echo "║     - Settings → Repositories → Create Repository                        ║"
echo "║     - Select 'docker (hosted)'                                           ║"
echo "║     - Name: docker-hosted                                                ║"
echo "║     - HTTP Port: 8082 (internal, exposed as 8091)                        ║"
echo "║     - Enable Docker V1 API: ✓                                            ║"
echo "║                                                                          ║"
echo "║  4. Add credentials to Jenkins:                                          ║"
echo "║     - Open http://localhost:8888                                         ║"
echo "║     - Manage Jenkins → Credentials → Add Credentials                     ║"
echo "║     - Add 'nexus-credentials' (Username/Password)                        ║"
echo "║     - Add 'nexus-docker-credentials' (Username/Password)                 ║"
echo "║     - Add 'github-ssh-key' (SSH Username with private key)               ║"
echo "║                                                                          ║"
echo "║  5. Create Jenkins job:                                                  ║"
echo "║     - New Item → 'IHMS-Build' → Pipeline                                 ║"
echo "║     - Use 'Pipeline script from SCM'                                     ║"
echo "║     - Git URL: git@github.com:gopigopi096/ai_project_test.git            ║"
echo "║     - Script Path: Jenkinsfile.selectable                                ║"
echo "║                                                                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

