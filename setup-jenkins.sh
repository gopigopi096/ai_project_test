#!/bin/bash
# IHMS Jenkins Setup Script
# This script configures Jenkins credentials and creates the pipeline job

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

JENKINS_URL="http://localhost:8888"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                    IHMS JENKINS SETUP SCRIPT                             ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Prompt for Jenkins credentials
echo -e "${YELLOW}Please enter Jenkins admin credentials:${NC}"
read -p "Jenkins Username (default: admin): " JENKINS_USER
JENKINS_USER=${JENKINS_USER:-admin}
read -s -p "Jenkins Password: " JENKINS_PASS
echo ""

# Prompt for Nexus credentials
echo -e "\n${YELLOW}Please enter Nexus credentials:${NC}"
read -p "Nexus Username (default: admin): " NEXUS_USER
NEXUS_USER=${NEXUS_USER:-admin}
read -s -p "Nexus Password: " NEXUS_PASS
echo ""

# Test Jenkins connection
echo -e "\n${BLUE}Testing Jenkins connection...${NC}"
CRUMB=$(curl -s -u "$JENKINS_USER:$JENKINS_PASS" "$JENKINS_URL/crumbIssuer/api/json" 2>/dev/null | grep -o '"crumb":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CRUMB" ]; then
    echo -e "${RED}❌ Failed to connect to Jenkins. Check credentials.${NC}"
    echo "Trying alternative CRUMB method..."
    CRUMB_HEADER=$(curl -s -u "$JENKINS_USER:$JENKINS_PASS" "$JENKINS_URL/crumbIssuer/api/json" 2>/dev/null)
    echo "Response: $CRUMB_HEADER"
    exit 1
fi

echo -e "${GREEN}✅ Connected to Jenkins!${NC}"
CRUMB_FIELD=$(curl -s -u "$JENKINS_USER:$JENKINS_PASS" "$JENKINS_URL/crumbIssuer/api/json" | grep -o '"crumbRequestField":"[^"]*"' | cut -d'"' -f4)

echo -e "\n${BLUE}Step 1: Creating GitHub credentials...${NC}"

# Create GitHub credentials XML
GITHUB_CREDS_XML=$(cat <<'EOF'
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>github-credentials</id>
  <description>GitHub credentials for IHMS project</description>
  <username>gopigopi096</username>
  <password>YOUR_GITHUB_PAT_TOKEN_HERE</password>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
EOF
)

# Note: Replace YOUR_GITHUB_PAT_TOKEN_HERE with actual PAT when running

echo -e "\n${BLUE}Step 2: Creating Nexus Maven credentials...${NC}"

# Create Nexus credentials
NEXUS_CREDS_XML=$(cat <<EOF
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>nexus-credentials</id>
  <description>Nexus Maven Repository credentials</description>
  <username>${NEXUS_USER}</username>
  <password>${NEXUS_PASS}</password>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
EOF
)

# Add Nexus credentials
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/nexus_creds_response.txt \
    -u "$JENKINS_USER:$JENKINS_PASS" \
    -H "$CRUMB_FIELD:$CRUMB" \
    -H "Content-Type: application/xml" \
    -d "$NEXUS_CREDS_XML" \
    "$JENKINS_URL/credentials/store/system/domain/_/createCredentials" 2>/dev/null)

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ]; then
    echo -e "${GREEN}✅ Nexus Maven credentials added!${NC}"
else
    echo -e "${YELLOW}⚠️ Nexus Maven credentials may already exist or failed (HTTP $RESPONSE)${NC}"
fi

echo -e "\n${BLUE}Step 3: Creating Nexus Docker credentials...${NC}"

# Create Nexus Docker credentials
DOCKER_CREDS_XML=$(cat <<EOF
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>nexus-docker-credentials</id>
  <description>Nexus Docker Registry credentials</description>
  <username>${NEXUS_USER}</username>
  <password>${NEXUS_PASS}</password>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
EOF
)

# Add Docker credentials
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/docker_creds_response.txt \
    -u "$JENKINS_USER:$JENKINS_PASS" \
    -H "$CRUMB_FIELD:$CRUMB" \
    -H "Content-Type: application/xml" \
    -d "$DOCKER_CREDS_XML" \
    "$JENKINS_URL/credentials/store/system/domain/_/createCredentials" 2>/dev/null)

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ]; then
    echo -e "${GREEN}✅ Nexus Docker credentials added!${NC}"
else
    echo -e "${YELLOW}⚠️ Nexus Docker credentials may already exist or failed (HTTP $RESPONSE)${NC}"
fi

echo -e "\n${BLUE}Step 4: Creating IHMS-Build Pipeline Job...${NC}"

# Create Pipeline Job config
JOB_CONFIG_XML=$(cat <<'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>IHMS Integrated Hospital Management System - Selectable Build Pipeline</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <hudson.model.ParametersDefinitionProperty>
      <parameterDefinitions>
        <hudson.model.ChoiceParameterDefinition>
          <name>BUILD_SCOPE</name>
          <description>Build scope: SELECT_INDIVIDUAL to pick specific services, or build ALL/ALL_BACKEND/ALL_FRONTEND</description>
          <choices class="java.util.Arrays$ArrayList">
            <a class="string-array">
              <string>SELECT_INDIVIDUAL</string>
              <string>ALL</string>
              <string>ALL_BACKEND</string>
              <string>ALL_FRONTEND</string>
            </a>
          </choices>
        </hudson.model.ChoiceParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_DISCOVERY_SERVICE</name>
          <description>🔍 Build Discovery Service (Eureka)</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_GATEWAY_SERVICE</name>
          <description>🚪 Build Gateway Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_AUTH_SERVICE</name>
          <description>🔐 Build Auth Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_PATIENT_SERVICE</name>
          <description>👤 Build Patient Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_APPOINTMENT_SERVICE</name>
          <description>📅 Build Appointment Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_BILLING_SERVICE</name>
          <description>💰 Build Billing Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_PHARMACY_SERVICE</name>
          <description>💊 Build Pharmacy Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_FRONTEND</name>
          <description>🌐 Build Frontend (Angular Portal)</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>DEPLOY_TO_NEXUS</name>
          <description>📦 Deploy artifacts to Nexus Maven Repository</description>
          <defaultValue>true</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>DEPLOY_DOCKER_TO_NEXUS</name>
          <description>🐳 Deploy Docker images to Nexus Docker Registry</description>
          <defaultValue>true</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>DEPLOY_TO_LOCAL_DOCKER</name>
          <description>🖥️ Deploy to Local Docker (for testing)</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>RUN_TESTS</name>
          <description>🧪 Run tests during build</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
      </parameterDefinitions>
    </hudson.model.ParametersDefinitionProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps">
    <scm class="hudson.plugins.git.GitSCM" plugin="git">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>https://github.com/gopigopi096/ai_project_test.git</url>
          <credentialsId>github-credentials</credentialsId>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/main</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="empty-list"/>
      <extensions/>
    </scm>
    <scriptPath>Jenkinsfile.selectable</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
EOF
)

# Create the job
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/job_create_response.txt \
    -u "$JENKINS_USER:$JENKINS_PASS" \
    -H "$CRUMB_FIELD:$CRUMB" \
    -H "Content-Type: application/xml" \
    -d "$JOB_CONFIG_XML" \
    "$JENKINS_URL/createItem?name=IHMS-Build" 2>/dev/null)

if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ IHMS-Build job created successfully!${NC}"
elif [ "$RESPONSE" = "400" ]; then
    echo -e "${YELLOW}⚠️ Job may already exist. Trying to update...${NC}"
    # Update existing job
    RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/job_update_response.txt \
        -u "$JENKINS_USER:$JENKINS_PASS" \
        -H "$CRUMB_FIELD:$CRUMB" \
        -H "Content-Type: application/xml" \
        -d "$JOB_CONFIG_XML" \
        "$JENKINS_URL/job/IHMS-Build/config.xml" 2>/dev/null)

    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ IHMS-Build job updated!${NC}"
    else
        echo -e "${RED}❌ Failed to update job (HTTP $RESPONSE)${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create job (HTTP $RESPONSE)${NC}"
    cat /tmp/job_create_response.txt
fi

# Print final instructions
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ JENKINS SETUP COMPLETE!                            ║"
echo "╠══════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                          ║"
echo "║  📋 IMPORTANT: You need to add GitHub credentials manually!              ║"
echo "║                                                                          ║"
echo "║  GitHub now requires Personal Access Tokens (PAT) for authentication.   ║"
echo "║                                                                          ║"
echo "║  Steps to create GitHub PAT:                                             ║"
echo "║  1. Go to https://github.com/settings/tokens                             ║"
echo "║  2. Click 'Generate new token (classic)'                                 ║"
echo "║  3. Give it a name and select 'repo' scope                               ║"
echo "║  4. Copy the token                                                       ║"
echo "║                                                                          ║"
echo "║  Then add to Jenkins:                                                    ║"
echo "║  1. Open ${JENKINS_URL}                                                  ║"
echo "║  2. Manage Jenkins → Credentials → System → Global                       ║"
echo "║  3. Add Credentials → Username with password                             ║"
echo "║     - ID: github-credentials                                             ║"
echo "║     - Username: gopigopi096                                              ║"
echo "║     - Password: <your-github-pat-token>                                  ║"
echo "║                                                                          ║"
echo "║  Also add your SSH key to GitHub:                                        ║"
echo "║  1. Go to https://github.com/settings/keys                               ║"
echo "║  2. Add the following SSH public key:                                    ║"
echo "╠══════════════════════════════════════════════════════════════════════════╣"
echo -e "${NC}"

cat ~/.ssh/id_ed25519.pub

echo -e "${GREEN}"
echo "╠══════════════════════════════════════════════════════════════════════════╣"
echo "║  ACCESS URLS:                                                            ║"
echo "║                                                                          ║"
echo "║  🔧 Jenkins:     ${JENKINS_URL}                                          ║"
echo "║  📦 Nexus:       http://localhost:8090                                   ║"
echo "║  🐳 Docker Reg:  localhost:8091                                          ║"
echo "║                                                                          ║"
echo "║  📋 Pipeline Job: ${JENKINS_URL}/job/IHMS-Build/                         ║"
echo "║     → Click 'Build with Parameters' to run                               ║"
echo "║                                                                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

