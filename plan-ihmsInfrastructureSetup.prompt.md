# IHMS CI/CD Infrastructure Setup Plan

## Overview
Complete setup for IHMS (Integrated Hospital Management System) with Spring Boot microservices, Angular frontend, and Jenkins CI/CD pipeline that builds and deploys artifacts to Nexus Repository.

## Architecture Summary
- **Backend**: Spring Boot microservices (appointment, auth, billing, gateway, patient, pharmacy)
- **Frontend**: Angular application (ihms-portal)
- **CI/CD**: Jenkins with selectable build parameters
- **Artifact Repository**: Nexus Repository Manager
- **Container Registry**: Nexus Docker hosted repository
- **Database**: Database-per-service pattern
- **Security**: Spring Security with JWT
- **Deployment**: Docker Compose

## Infrastructure Components

### 1. Docker Network
- Network name: `jenkins_po_source_ihms-network`
- Connects all services for inter-container communication

### 2. Jenkins Setup
- **Image**: jenkins/jenkins:lts-jdk17
- **Port**: 8888 (UI), 50000 (agent)
- **Docker-in-Docker**: docker:dind for building images
- **Setup wizard**: Disabled for automation

### 3. Nexus Repository Manager
- **Port**: 8090 (UI)
- **Docker Registry Ports**: 8091, 8092
- **Repositories to create**:
  - docker-hosted (HTTP port 8082)
  - maven-releases
  - maven-snapshots

### 4. Docker Daemon Configuration
- Insecure registries: localhost:8091, localhost:8092, nexus:8082

## Jenkins Pipeline Features (Jenkinsfile.selectable)

### Build Parameters
- **BUILD_TARGET**: Choice parameter
  - ALL
  - BACKEND_ONLY
  - FRONTEND_ONLY
  
- **Backend Services Selection**:
  - appointment-service
  - auth-service
  - billing-service
  - gateway-service
  - patient-service
  - pharmacy-service
  - discovery-service

- **Frontend Selection**:
  - ihms-portal

## Setup Steps

### Step 1: Create Docker Network
```bash
docker network create jenkins_po_source_ihms-network
```

### Step 2: Start Jenkins
- Deploy Jenkins using docker-compose.jenkins.yml
- Wait for service to be available at http://localhost:8888

### Step 3: Start Nexus
- Deploy Nexus using docker-compose.nexus.yml
- Wait for service to be available at http://localhost:8090
- Retrieve admin password from /nexus-data/admin.password

### Step 4: Configure Docker for Insecure Registry
- Update /etc/docker/daemon.json
- Restart Docker daemon
- Restart containers

### Step 5: SSH Key for GitHub
- Generate or display existing SSH key
- Add to GitHub (https://github.com/settings/keys)

## Post-Setup Configuration

### Jenkins Configuration
1. Get initial admin password:
   ```bash
   docker exec jenkins-controller cat /var/jenkins_home/secrets/initialAdminPassword
   ```
2. Complete setup wizard at http://localhost:8888
3. Install suggested plugins
4. Create admin user

### Nexus Configuration
1. Login at http://localhost:8090
   - Username: admin
   - Password: (from admin.password file)
2. Complete setup wizard and change password
3. Create Docker hosted repository:
   - Name: docker-hosted
   - HTTP Port: 8082

### Jenkins Credentials
Add the following credentials (Manage Jenkins → Credentials):
- **github-credentials**: GitHub PAT for repository access
- **nexus-credentials**: Nexus username/password for artifacts
- **nexus-docker-credentials**: Nexus username/password for Docker registry

### Jenkins Pipeline Job
1. Create new Pipeline job: IHMS-Build
2. Configure Pipeline from SCM:
   - Type: Git
   - URL: https://github.com/gopigopi096/ai_project_test.git
   - Credentials: github-credentials
   - Script Path: Jenkinsfile.selectable

## Git Repository
- **URL**: git@github.com:gopigopi096/ai_project_test.git
- **Credentials**: 
  - Username: gopigopi096@gmail.com
  - Password: gopinathM!123

## Push Code to GitHub
```bash
git add -A && git commit -m 'Setup' && git push origin main
```

## Access URLs
| Service | URL |
|---------|-----|
| Jenkins | http://localhost:8888 |
| Nexus | http://localhost:8090 |
| Docker Registry | localhost:8091 |

## Files Reference
- `setup-infrastructure.sh` - Main setup script
- `docker-compose.jenkins.yml` - Jenkins configuration
- `docker-compose.nexus.yml` - Nexus configuration
- `Jenkinsfile.selectable` - Pipeline with build parameters
- `SETUP_GUIDE.md` - Detailed setup instructions

