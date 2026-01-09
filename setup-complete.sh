#!/bin/bash
# IHMS Complete Setup Script
# Automates the entire CI/CD pipeline setup

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

# Configuration - EDIT THESE VALUES
JENKINS_URL="http://localhost:8888"
JENKINS_USER="admin"
JENKINS_PASS="admin"  # Change this to your actual Jenkins password

NEXUS_URL="http://localhost:8090"
NEXUS_USER="admin"
NEXUS_PASS="admin"  # Change this to your actual Nexus password

GITHUB_USER="gopigopi096"
GITHUB_REPO="https://github.com/gopigopi096/ai_project_test.git"
# GITHUB_PAT should be set - get from https://github.com/settings/tokens
GITHUB_PAT=""  # Set your GitHub Personal Access Token here

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                 IHMS COMPLETE CI/CD SETUP                                ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to get Jenkins crumb
get_jenkins_crumb() {
    CRUMB_JSON=$(curl -s -u "$JENKINS_USER:$JENKINS_PASS" "$JENKINS_URL/crumbIssuer/api/json" 2>/dev/null)
    CRUMB=$(echo "$CRUMB_JSON" | grep -o '"crumb":"[^"]*"' | cut -d'"' -f4)
    CRUMB_FIELD=$(echo "$CRUMB_JSON" | grep -o '"crumbRequestField":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$CRUMB" ]; then
        echo -e "${RED}❌ Failed to get Jenkins crumb. Check credentials.${NC}"
        return 1
    fi
    return 0
}

# Function to add Jenkins credential
add_jenkins_credential() {
    local CRED_ID=$1
    local CRED_DESC=$2
    local CRED_USER=$3
    local CRED_PASS=$4

    local CRED_XML=$(cat <<EOF
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>${CRED_ID}</id>
  <description>${CRED_DESC}</description>
  <username>${CRED_USER}</username>
  <password>${CRED_PASS}</password>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
EOF
)

    local RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
        -u "$JENKINS_USER:$JENKINS_PASS" \
        -H "$CRUMB_FIELD:$CRUMB" \
        -H "Content-Type: application/xml" \
        -d "$CRED_XML" \
        "$JENKINS_URL/credentials/store/system/domain/_/createCredentials" 2>/dev/null)

    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ]; then
        echo -e "${GREEN}  ✅ Credential '$CRED_ID' added${NC}"
        return 0
    else
        echo -e "${YELLOW}  ⚠️ Credential '$CRED_ID' may already exist (HTTP $RESPONSE)${NC}"
        return 1
    fi
}

# Function to create/update Jenkins job
create_jenkins_job() {
    local JOB_NAME=$1
    local JOB_CONFIG=$2

    # Try to create job
    local RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/job_response.txt \
        -u "$JENKINS_USER:$JENKINS_PASS" \
        -H "$CRUMB_FIELD:$CRUMB" \
        -H "Content-Type: application/xml" \
        -d "$JOB_CONFIG" \
        "$JENKINS_URL/createItem?name=$JOB_NAME" 2>/dev/null)

    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}  ✅ Job '$JOB_NAME' created${NC}"
        return 0
    elif [ "$RESPONSE" = "400" ]; then
        # Job exists, try to update
        RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/job_response.txt \
            -u "$JENKINS_USER:$JENKINS_PASS" \
            -H "$CRUMB_FIELD:$CRUMB" \
            -H "Content-Type: application/xml" \
            -X POST \
            -d "$JOB_CONFIG" \
            "$JENKINS_URL/job/$JOB_NAME/config.xml" 2>/dev/null)

        if [ "$RESPONSE" = "200" ]; then
            echo -e "${GREEN}  ✅ Job '$JOB_NAME' updated${NC}"
            return 0
        fi
    fi

    echo -e "${RED}  ❌ Failed to create/update job '$JOB_NAME' (HTTP $RESPONSE)${NC}"
    return 1
}

# ==================== STEP 1: Check Services ====================
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Checking Services${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check Jenkins
echo -n "  Jenkins: "
if curl -s -o /dev/null -w "%{http_code}" "$JENKINS_URL" 2>/dev/null | grep -q "200\|302\|403"; then
    echo -e "${GREEN}✅ Running at $JENKINS_URL${NC}"
else
    echo -e "${RED}❌ Not accessible at $JENKINS_URL${NC}"
    exit 1
fi

# Check Nexus
echo -n "  Nexus:   "
if curl -s -o /dev/null -w "%{http_code}" "$NEXUS_URL" 2>/dev/null | grep -q "200\|302"; then
    echo -e "${GREEN}✅ Running at $NEXUS_URL${NC}"
else
    echo -e "${RED}❌ Not accessible at $NEXUS_URL${NC}"
    echo -e "${YELLOW}  Starting Nexus...${NC}"
    docker-compose -f docker-compose.nexus.yml up -d
    sleep 60
fi

# ==================== STEP 2: Configure Jenkins Credentials ====================
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Configuring Jenkins Credentials${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! get_jenkins_crumb; then
    echo -e "${RED}Cannot proceed without Jenkins authentication${NC}"
    exit 1
fi

# Add Nexus Maven credentials
add_jenkins_credential "nexus-credentials" "Nexus Maven Repository" "$NEXUS_USER" "$NEXUS_PASS"

# Add Nexus Docker credentials
add_jenkins_credential "nexus-docker-credentials" "Nexus Docker Registry" "$NEXUS_USER" "$NEXUS_PASS"

# Add GitHub credentials if PAT is provided
if [ -n "$GITHUB_PAT" ]; then
    add_jenkins_credential "github-credentials" "GitHub for IHMS" "$GITHUB_USER" "$GITHUB_PAT"
else
    echo -e "${YELLOW}  ⚠️ GitHub PAT not set - add 'github-credentials' manually in Jenkins${NC}"
fi

# ==================== STEP 3: Create Jenkins Pipeline Job ====================
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Creating Jenkins Pipeline Job${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

JOB_CONFIG=$(cat <<'JOBEOF'
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>IHMS - Integrated Hospital Management System Build Pipeline</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <hudson.model.ParametersDefinitionProperty>
      <parameterDefinitions>
        <hudson.model.ChoiceParameterDefinition>
          <name>BUILD_SCOPE</name>
          <description>Build scope: SELECT_INDIVIDUAL to pick specific services</description>
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
          <description>Build Discovery Service (Eureka)</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_GATEWAY_SERVICE</name>
          <description>Build Gateway Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_AUTH_SERVICE</name>
          <description>Build Auth Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_PATIENT_SERVICE</name>
          <description>Build Patient Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_APPOINTMENT_SERVICE</name>
          <description>Build Appointment Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_BILLING_SERVICE</name>
          <description>Build Billing Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_PHARMACY_SERVICE</name>
          <description>Build Pharmacy Service</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>BUILD_FRONTEND</name>
          <description>Build Frontend (Angular Portal)</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>DEPLOY_TO_NEXUS</name>
          <description>Deploy artifacts to Nexus Maven Repository</description>
          <defaultValue>true</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>DEPLOY_DOCKER_TO_NEXUS</name>
          <description>Deploy Docker images to Nexus Docker Registry</description>
          <defaultValue>true</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>DEPLOY_TO_LOCAL_DOCKER</name>
          <description>Deploy to Local Docker (for testing)</description>
          <defaultValue>false</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>RUN_TESTS</name>
          <description>Run tests during build</description>
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
JOBEOF
)

create_jenkins_job "IHMS-Build" "$JOB_CONFIG"

# ==================== STEP 4: Summary ====================
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                         SETUP COMPLETE!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "
${BLUE}📋 ACCESS URLS:${NC}
   🔧 Jenkins:        $JENKINS_URL
   📋 IHMS Pipeline:  $JENKINS_URL/job/IHMS-Build/
   📦 Nexus:          $NEXUS_URL
   🐳 Docker Registry: localhost:8091

${BLUE}📋 NEXT STEPS:${NC}"

if [ -z "$GITHUB_PAT" ]; then
echo -e "
${YELLOW}⚠️  You need to add GitHub credentials manually:${NC}
   1. Create a Personal Access Token at https://github.com/settings/tokens
   2. Open $JENKINS_URL/manage/credentials/store/system/domain/_/
   3. Click 'Add Credentials'
   4. Fill in:
      - Kind: Username with password
      - ID: github-credentials
      - Username: $GITHUB_USER
      - Password: <your-github-pat>

${YELLOW}⚠️  Add your SSH key to GitHub:${NC}
   Go to https://github.com/settings/keys and add:
   $(cat ~/.ssh/id_ed25519.pub 2>/dev/null || echo 'No SSH key found')
"
fi

echo -e "
${BLUE}📋 TO RUN A BUILD:${NC}
   1. Open $JENKINS_URL/job/IHMS-Build/
   2. Click 'Build with Parameters'
   3. Select the services you want to build
   4. Click 'Build'

${BLUE}📋 BUILD OPTIONS:${NC}
   • BUILD_SCOPE: ALL, ALL_BACKEND, ALL_FRONTEND, or SELECT_INDIVIDUAL
   • Backend: discovery, gateway, auth, patient, appointment, billing, pharmacy
   • Frontend: ihms-portal (Angular)
   • Deployment: Nexus Maven, Nexus Docker, or Local Docker
"

