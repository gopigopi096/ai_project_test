# IHMS Production Deployment Guide

## Overview

This guide covers the complete workflow for:
1. Building Docker images in Jenkins
2. Pushing images to Nexus Docker Registry
3. Pulling and deploying images on production server via SSH tunnel

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BUILD SERVER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────┐    ┌───────────┐    ┌──────────────────────────────────┐ │
│  │  Jenkins  │───►│  Docker   │───►│  Nexus Docker Registry           │ │
│  │ :8888     │    │  Build    │    │  :8090 (UI) / :8091 (Registry)   │ │
│  └───────────┘    └───────────┘    └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                            │
                                            │ SSH Tunnel (port 8091)
                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION SERVER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐    ┌───────────────────────────────────────────────┐ │
│  │ autossh       │───►│  Docker Pull localhost:8091/ihms/*            │ │
│  │ (SSH Tunnel)  │    │                                               │ │
│  └───────────────┘    └───────────────────────────────────────────────┘ │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  IHMS Services (docker-compose.production.yml)                  │   │
│  │  • Discovery :8761  • Gateway :8080    • Frontend :3000         │   │
│  │  • Auth :8081       • Patient :8082    • Appointment :8083      │   │
│  │  • Billing :8084    • Pharmacy :8085                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Build Server
- Docker & Docker Compose installed
- Jenkins running on port 8888
- Nexus Repository Manager running on port 8090
- Nexus Docker Registry on port 8091

### Production Server
- Docker & Docker Compose installed
- SSH key access to build server
- sudo access for Docker daemon configuration
- Port 22 (SSH) open to build server

---

## Part 1: Build Server Setup

### Step 1: Start Infrastructure

```bash
cd /home/raster/Documents/jenkins_po_source

# Start Nexus Repository Manager
./setup-nexus.sh

# This will:
# - Start Nexus container
# - Configure Docker insecure registry
# - Display admin password
```

### Step 2: Create Nexus Docker Repository

1. Open Nexus UI: http://localhost:8090
2. Login with admin credentials (password from setup-nexus.sh output)
3. Go to **Settings** → **Repositories** → **Create Repository**
4. Select **docker (hosted)**
5. Configure:
   - **Name**: `docker-hosted`
   - **HTTP Port**: `8082` (maps to host port 8091)
   - **Enable Docker V1 API**: ✓
6. Click **Create repository**

### Step 3: Configure Jenkins

```bash
# Run Jenkins setup script
./setup-jenkins.sh

# This will:
# - Create nexus-credentials
# - Create nexus-docker-credentials
# - Create IHMS-Build pipeline job
```

### Step 4: Add GitHub Credentials (Manual)

1. Open Jenkins: http://localhost:8888
2. Go to **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
3. Click **Add Credentials**
4. Configure:
   - **Kind**: Username with password
   - **Username**: `gopigopi096`
   - **Password**: `<your-github-pat-token>`
   - **ID**: `github-credentials`
   - **Description**: GitHub PAT for IHMS project
5. Click **Create**

> **Note**: Create a GitHub PAT at https://github.com/settings/tokens with `repo` scope

### Step 5: Run Jenkins Build

1. Open Jenkins: http://localhost:8888/job/IHMS-Build/
2. Click **Build with Parameters**
3. Configure build options:
   - **BUILD_SCOPE**: `ALL` (builds all services)
   - **DEPLOY_TO_NEXUS**: ✓ (push JARs to Nexus Maven)
   - **DEPLOY_DOCKER_TO_NEXUS**: ✓ (push Docker images to Nexus)
   - **DEPLOY_TO_LOCAL_DOCKER**: ☐ (optional, for local testing)
4. Click **Build**

### Step 6: Verify Images in Nexus

After build completes, verify images are pushed:

```bash
# List images in Nexus Docker registry
curl -u admin:<nexus-password> http://localhost:8091/v2/_catalog

# Expected output:
# {"repositories":["ihms/discovery-service","ihms/gateway-service",...]}
```

---

## Part 2: Production Server Deployment

### Step 1: Copy SSH Key to Build Server

On production server, ensure SSH key access to build server:

```bash
# Generate SSH key if not exists
ssh-keygen -t ed25519 -C "production-server"

# Copy key to build server
ssh-copy-id <user>@<build-server-ip>

# Test connection
ssh <user>@<build-server-ip>
```

### Step 2: Copy Deployment Files

From build server, copy deployment files to production:

```bash
# On build server
cd /home/raster/Documents/jenkins_po_source

scp deploy-production.sh docker-compose.production.yml nexus-tunnel.service \
    <user>@<production-server>:~/ihms-deployment/
```

Or on production server, download from GitHub (if pushed):

```bash
git clone https://github.com/gopigopi096/ai_project_test.git ihms-deployment
cd ihms-deployment
```

### Step 3: Run Production Deployment

```bash
cd ~/ihms-deployment

# Make script executable
chmod +x deploy-production.sh

# Run deployment
./deploy-production.sh --nexus-host=<build-server-ip> --ssh-user=<user>
```

The script will:
1. ✅ Install autossh for persistent SSH tunnel
2. ✅ Create and start systemd service for tunnel
3. ✅ Configure Docker for insecure registry (localhost:8091)
4. ✅ Login to Nexus Docker registry
5. ✅ Pull all IHMS Docker images
6. ✅ Deploy services with proper startup order:
   - Databases first
   - Discovery service (Eureka)
   - Gateway service
   - Backend services
   - Frontend

### Step 4: Verify Deployment

```bash
# Check running containers
docker ps

# Check service health
curl http://localhost:8761/actuator/health  # Discovery
curl http://localhost:8080/actuator/health  # Gateway
curl http://localhost:8081/actuator/health  # Auth
curl http://localhost:3000                  # Frontend

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `setup-nexus.sh` | Start and configure Nexus on build server |
| `setup-jenkins.sh` | Configure Jenkins credentials and create pipeline job |
| `Jenkinsfile.selectable` | Jenkins pipeline with build parameters |
| `deploy-production.sh` | Production deployment script with SSH tunnel |
| `docker-compose.production.yml` | Production compose file pulling from Nexus |
| `nexus-tunnel.service` | Systemd service for persistent SSH tunnel |

---

## Useful Commands

### Build Server

```bash
# Restart Nexus
docker-compose -f docker-compose.nexus.yml restart

# View Nexus logs
docker logs nexus -f

# Check Docker registry
curl http://localhost:8091/v2/_catalog

# Rebuild specific service in Jenkins
# Go to http://localhost:8888/job/IHMS-Build/build?delay=0sec
# Set BUILD_SCOPE=SELECT_INDIVIDUAL and select specific services
```

### Production Server

```bash
# SSH Tunnel Status
sudo systemctl status nexus-tunnel.service
sudo journalctl -u nexus-tunnel.service -f

# Restart tunnel
sudo systemctl restart nexus-tunnel.service

# Stop all services
docker-compose -f docker-compose.production.yml down

# Restart all services
docker-compose -f docker-compose.production.yml restart

# Update specific service
docker-compose -f docker-compose.production.yml pull <service-name>
docker-compose -f docker-compose.production.yml up -d --no-deps <service-name>

# Pull latest images and redeploy
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

---

## Troubleshooting

### SSH Tunnel Not Working

```bash
# Check tunnel service
sudo systemctl status nexus-tunnel.service

# View logs
sudo journalctl -u nexus-tunnel.service -n 50

# Test SSH connection manually
ssh -v <user>@<build-server-ip>

# Restart tunnel
sudo systemctl restart nexus-tunnel.service
```

### Docker Pull Fails

```bash
# Check if registry is accessible
curl http://localhost:8091/v2/_catalog

# Login to registry
docker login localhost:8091

# Check Docker daemon config
cat /etc/docker/daemon.json

# Restart Docker
sudo systemctl restart docker
```

### Service Not Starting

```bash
# Check container logs
docker logs <container-name>

# Check if database is ready
docker logs ihms-prod-auth-db

# Restart specific service
docker-compose -f docker-compose.production.yml restart <service-name>
```

---

## Security Notes

⚠️ **Important Security Considerations**:

1. **HTTP Registry**: This setup uses HTTP (insecure) for Docker registry via SSH tunnel. The SSH tunnel provides encryption in transit.

2. **SSH Key Security**: Protect the SSH private key on production server. Consider using passphrase-protected keys.

3. **Nexus Credentials**: Store Nexus credentials securely. Consider using Docker credential helpers.

4. **Firewall**: Only port 22 (SSH) needs to be open between production and build server.

5. **Production Database Passwords**: Change default database passwords in `docker-compose.production.yml` for production use.

---

## Quick Reference

| Service | Build Server Port | Production Port |
|---------|-------------------|-----------------|
| Jenkins | 8888 | - |
| Nexus UI | 8090 | - |
| Nexus Docker Registry | 8091 | 8091 (via tunnel) |
| Discovery (Eureka) | - | 8761 |
| Gateway | - | 8080 |
| Auth Service | - | 8081 |
| Patient Service | - | 8082 |
| Appointment Service | - | 8083 |
| Billing Service | - | 8084 |
| Pharmacy Service | - | 8085 |
| Frontend | - | 3000 |

