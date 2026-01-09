#!/bin/bash
# ==================================================================================
# IHMS Push Docker Images to Nexus
# ==================================================================================
# This script tags existing Docker images and pushes them to Nexus Docker Registry
#
# Usage: ./push-images-to-nexus.sh
# ==================================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

DOCKER_REGISTRY="localhost:8091"
NEXUS_PASS=""

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --password=*)
            NEXUS_PASS="${arg#*=}"
            shift
            ;;
        *)
            ;;
    esac
done

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║          IHMS Push Docker Images to Nexus                                ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Get Nexus password if not provided
if [ -z "$NEXUS_PASS" ]; then
    echo -e "${YELLOW}Enter Nexus admin password:${NC}"
    read -s NEXUS_PASS
    echo ""
fi

# Login to Nexus Docker Registry
echo -e "${BLUE}Logging into Nexus Docker Registry...${NC}"
echo "${NEXUS_PASS}" | docker login ${DOCKER_REGISTRY} -u admin --password-stdin

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to login to Nexus Docker Registry${NC}"
    echo -e "${YELLOW}Please ensure:${NC}"
    echo -e "${YELLOW}  1. Nexus is running (http://localhost:8090)${NC}"
    echo -e "${YELLOW}  2. docker-hosted repository exists with HTTP port 8082${NC}"
    echo -e "${YELLOW}  3. Password is correct${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged into Nexus Docker Registry${NC}"

# Services mapping (local image name -> nexus image name)
declare -A SERVICES
SERVICES["jenkins_po_source_discovery-service"]="ihms/discovery-service"
SERVICES["jenkins_po_source_gateway-service"]="ihms/gateway-service"
SERVICES["jenkins_po_source_auth-service"]="ihms/auth-service"
SERVICES["jenkins_po_source_patient-service"]="ihms/patient-service"
SERVICES["jenkins_po_source_appointment-service"]="ihms/appointment-service"
SERVICES["jenkins_po_source_billing-service"]="ihms/billing-service"
SERVICES["jenkins_po_source_pharmacy-service"]="ihms/pharmacy-service"
SERVICES["jenkins_po_source_ihms-portal"]="ihms/ihms-portal"

PUSHED=0
FAILED=0

for local_image in "${!SERVICES[@]}"; do
    nexus_image="${SERVICES[$local_image]}"

    echo -e "\n${CYAN}Processing ${local_image}...${NC}"

    # Check if image exists
    if docker images --format "{{.Repository}}" | grep -q "^${local_image}$"; then
        # Tag for Nexus
        echo "  Tagging as ${DOCKER_REGISTRY}/${nexus_image}:latest"
        docker tag "${local_image}:latest" "${DOCKER_REGISTRY}/${nexus_image}:latest"
        docker tag "${local_image}:latest" "${DOCKER_REGISTRY}/${nexus_image}:1.0.0"

        # Push to Nexus
        echo "  Pushing to Nexus..."
        if docker push "${DOCKER_REGISTRY}/${nexus_image}:latest" && \
           docker push "${DOCKER_REGISTRY}/${nexus_image}:1.0.0"; then
            echo -e "  ${GREEN}✅ Pushed ${nexus_image}${NC}"
            ((PUSHED++))
        else
            echo -e "  ${RED}❌ Failed to push ${nexus_image}${NC}"
            ((FAILED++))
        fi
    else
        echo -e "  ${YELLOW}⚠️  Image not found: ${local_image}${NC}"
        ((FAILED++))
    fi
done

# Logout
docker logout ${DOCKER_REGISTRY} 2>/dev/null || true

# Summary
echo -e "\n${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}PUSH COMPLETE${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "  ✅ Successfully pushed: ${PUSHED} images"
if [ $FAILED -gt 0 ]; then
    echo -e "  ❌ Failed: ${FAILED} images"
fi

# Verify
echo -e "\n${CYAN}Verifying images in Nexus...${NC}"
curl -s -u "admin:${NEXUS_PASS}" "http://localhost:8091/v2/_catalog" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Could not verify"

echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║  Images are now available in Nexus at:                                   ║"
echo "║    localhost:8091/ihms/discovery-service:latest                          ║"
echo "║    localhost:8091/ihms/gateway-service:latest                            ║"
echo "║    localhost:8091/ihms/auth-service:latest                               ║"
echo "║    localhost:8091/ihms/patient-service:latest                            ║"
echo "║    localhost:8091/ihms/appointment-service:latest                        ║"
echo "║    localhost:8091/ihms/billing-service:latest                            ║"
echo "║    localhost:8091/ihms/pharmacy-service:latest                           ║"
echo "║    localhost:8091/ihms/ihms-portal:latest                                ║"
echo "║                                                                          ║"
echo "║  For production deployment, copy these files to production server:       ║"
echo "║    - deploy-production.sh                                                ║"
echo "║    - docker-compose.production.yml                                       ║"
echo "║    - nexus-tunnel.service                                                ║"
echo "║                                                                          ║"
echo "║  Then run: ./deploy-production.sh --nexus-host=<ip> --ssh-user=<user>    ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

