# IHMS Complete CI/CD Setup Guide

## Overview
This guide helps you set up the complete IHMS CI/CD pipeline with:
- **Jenkins** for CI/CD automation
- **Nexus Repository** for artifact storage
- **Docker** for containerization
- **GitHub** for source control

## Quick Start

### 1. Start Infrastructure
```bash
cd /home/raster/Documents/jenkins_po_source

# Start Nexus Repository Manager
docker-compose -f docker-compose.nexus.yml up -d

# Wait for Nexus to be ready (2-3 minutes)
./setup-nexus.sh
```

### 2. Start Jenkins (if using external Jenkins)
Make sure Jenkins is running at http://localhost:8888

### 3. Configure GitHub (One-time setup)

#### Add SSH Key to GitHub
1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Add your public key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ7rV6ZdMBwWYaQiocd6gQVDrtP43GOJlR9TgTNSLEvO gopigopi096@gmail.com
```

#### Create GitHub Personal Access Token (PAT)
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control)
4. Copy the generated token

### 4. Push Code to GitHub
```bash
cd /home/raster/Documents/jenkins_po_source
git add -A
git commit -m "Update CI/CD configuration"
git push origin main
```

### 5. Configure Jenkins

#### Add Credentials
Open http://localhost:8888/manage/credentials/store/system/domain/_/

Add these credentials:

1. **github-credentials** (Username with password)
   - Username: `gopigopi096`
   - Password: `<your-github-pat>`

2. **nexus-credentials** (Username with password)
   - Username: `admin`
   - Password: `<your-nexus-password>`

3. **nexus-docker-credentials** (Username with password)
   - Username: `admin`
   - Password: `<your-nexus-password>`

#### Create Pipeline Job
1. Open http://localhost:8888
2. Click "New Item"
3. Enter name: `IHMS-Build`
4. Select "Pipeline"
5. Click OK
6. Configure:
   - Pipeline > Definition: "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: `https://github.com/gopigopi096/ai_project_test.git`
   - Credentials: `github-credentials`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile.selectable`
7. Click "Save"

### 6. Configure Nexus Docker Repository

1. Open http://localhost:8090
2. Login with admin credentials
3. Go to Settings → Repositories → Create Repository
4. Select "docker (hosted)"
5. Configure:
   - Name: `docker-hosted`
   - HTTP Port: `8082`
   - Enable Docker V1 API: ✓
6. Click "Create repository"

### 7. Run Your First Build

1. Open http://localhost:8888/job/IHMS-Build/
2. Click "Build with Parameters"
3. Select options:
   - **BUILD_SCOPE**: Choose from:
     - `ALL` - Build everything
     - `ALL_BACKEND` - Build all backend services
     - `ALL_FRONTEND` - Build frontend only
     - `SELECT_INDIVIDUAL` - Pick specific services
   
   - **Individual Services** (when SELECT_INDIVIDUAL):
     - BUILD_DISCOVERY_SERVICE - Eureka server
     - BUILD_GATEWAY_SERVICE - API Gateway
     - BUILD_AUTH_SERVICE - Authentication
     - BUILD_PATIENT_SERVICE - Patient management
     - BUILD_APPOINTMENT_SERVICE - Appointments
     - BUILD_BILLING_SERVICE - Billing
     - BUILD_PHARMACY_SERVICE - Pharmacy/Inventory
     - BUILD_FRONTEND - Angular portal

   - **Deployment Options**:
     - DEPLOY_TO_NEXUS - Push JARs to Nexus Maven
     - DEPLOY_DOCKER_TO_NEXUS - Push Docker images to Nexus
     - DEPLOY_TO_LOCAL_DOCKER - Deploy locally for testing

4. Click "Build"

## Access URLs

| Service | URL |
|---------|-----|
| Jenkins | http://localhost:8888 |
| Nexus Web UI | http://localhost:8090 |
| Docker Registry | localhost:8091 |
| IHMS Frontend | http://localhost:3000 (after deploy) |
| API Gateway | http://localhost:8080 (after deploy) |
| Eureka Dashboard | http://localhost:8761 (after deploy) |

## Deploy Application Locally

After Jenkins builds the Docker images, deploy to local Docker:

```bash
cd /home/raster/Documents/jenkins_po_source

# Start databases
docker-compose -f docker-compose.local.yml up -d auth-db patient-db appointment-db billing-db pharmacy-db

# Wait for databases
sleep 15

# Start all services
docker-compose -f docker-compose.local.yml up -d

# Check status
./deploy.sh status
```

## Troubleshooting

### Jenkins can't access GitHub
- Ensure github-credentials is configured with PAT (not password)
- Check that SSH key is added to GitHub

### Nexus Docker push fails
- Configure Docker daemon for insecure registry:
```bash
sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "insecure-registries": ["localhost:8091", "localhost:8092"]
}
EOF
sudo systemctl restart docker
```

### Build fails - Java version
- Ensure Jenkins has Java 17 installed
- Set JAVA_HOME in Jenkins global configuration

### Frontend build fails - Node version
- Jenkins needs Node.js 18+ for Angular 17
- Update Jenkins Node.js installation

