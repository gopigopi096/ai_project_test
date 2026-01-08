# IHMS - Integrated Hospital Management System

A microservices-based Hospital Management System built with Spring Boot and Angular, featuring a Jenkins CI/CD pipeline with Nexus Repository integration.

## 🏗️ Architecture

### Backend Services (Spring Boot 3.2)
| Service | Port | Description |
|---------|------|-------------|
| discovery-service | 8761 | Eureka Service Discovery |
| gateway-service | 8080 | API Gateway |
| auth-service | 8081 | Authentication & JWT |
| patient-service | 8082 | Patient Management |
| appointment-service | 8083 | Appointment Scheduling |
| billing-service | 8084 | Billing & Invoicing |
| pharmacy-service | 8085 | Pharmacy & Inventory |

### Frontend (Angular 17)
| Service | Port | Description |
|---------|------|-------------|
| ihms-portal | 3000 | Angular SPA |

### Infrastructure
| Service | Port | Description |
|---------|------|-------------|
| Nexus Repository | 8090 | Artifact & Docker Registry |
| Nexus Docker Registry | 8091 | Docker Image Registry |
| Jenkins | 8888 | CI/CD Pipeline |
| PostgreSQL (per service) | 5433-5437 | Databases |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Java 17
- Node.js 18+
- Git

### 1. Start Infrastructure

```bash
# Start all databases
docker-compose -f docker-compose.local.yml up -d auth-db patient-db appointment-db billing-db pharmacy-db

# Start Nexus Repository
docker-compose -f docker-compose.nexus.yml up -d

# Wait for Nexus to start (2-3 minutes), then get admin password
docker exec nexus cat /nexus-data/admin.password
```

### 2. Build & Run Services

```bash
# Build all services
./gradlew clean build -x test

# Start all services
docker-compose -f docker-compose.local.yml up -d
```

### 3. Access Applications

| Application | URL |
|-------------|-----|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Eureka Dashboard | http://localhost:8761 |
| Nexus Repository | http://localhost:8090 |
| Jenkins | http://localhost:8888 |

## 🔧 Jenkins Pipeline Setup

### Pipeline Features
The `Jenkinsfile.selectable` provides:
- **Selectable Build Scope**: ALL, ALL_BACKEND, ALL_FRONTEND, or SELECT_INDIVIDUAL
- **Individual Service Selection**: Checkbox for each microservice
- **Nexus Integration**: Deploy JARs to Maven repository
- **Docker Registry**: Push Docker images to Nexus
- **Local Deployment**: Optional deployment to local Docker

### Setting Up Jenkins Job

1. **Open Jenkins**: http://localhost:8888

2. **Add Credentials** (Manage Jenkins → Credentials → System → Global):
   - `github-credentials`: Username with password (GitHub)
   - `nexus-credentials`: Username with password (admin / nexus-password)
   - `nexus-docker-credentials`: Username with password (admin / nexus-password)

3. **Create Pipeline Job**:
   - New Item → "IHMS-Build" → Pipeline → OK
   - Check "This project is parameterized" (parameters auto-load from Jenkinsfile)
   - Pipeline → Definition: "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: `https://github.com/gopigopi096/ai_project_test.git`
   - Credentials: `github-credentials`
   - Script Path: `Jenkinsfile.selectable`
   - Save

4. **Run Pipeline**:
   - Click "Build with Parameters"
   - Select BUILD_SCOPE or individual services
   - Click Build

### Build Parameters

| Parameter | Description |
|-----------|-------------|
| BUILD_SCOPE | ALL, ALL_BACKEND, ALL_FRONTEND, SELECT_INDIVIDUAL |
| BUILD_DISCOVERY_SERVICE | Build Eureka Discovery Service |
| BUILD_GATEWAY_SERVICE | Build API Gateway |
| BUILD_AUTH_SERVICE | Build Authentication Service |
| BUILD_PATIENT_SERVICE | Build Patient Management |
| BUILD_APPOINTMENT_SERVICE | Build Appointment Scheduling |
| BUILD_BILLING_SERVICE | Build Billing Service |
| BUILD_PHARMACY_SERVICE | Build Pharmacy/Inventory |
| BUILD_FRONTEND | Build Angular Portal |
| DEPLOY_TO_NEXUS | Upload JARs to Nexus Maven |
| DEPLOY_DOCKER_TO_NEXUS | Push Docker images to Nexus |
| DEPLOY_TO_LOCAL_DOCKER | Deploy to local Docker |
| RUN_TESTS | Run tests during build |

## 📦 Nexus Repository Setup

### Initial Configuration

1. Open http://localhost:8090
2. Login with `admin` and password from: `docker exec nexus cat /nexus-data/admin.password`
3. Complete setup wizard (change password)

### Create Docker Repository

1. Settings → Repositories → Create Repository
2. Select `docker (hosted)`
3. Configure:
   - Name: `docker-hosted`
   - HTTP Port: `8082`
   - Enable Docker V1 API: ✓
4. Click Create

### Configure Docker Daemon

```bash
# Add insecure registry
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "insecure-registries": ["localhost:8091"]
}
EOF

# Restart Docker
sudo systemctl restart docker
```

## 📁 Project Structure

```
├── appointment-service/     # Appointment microservice
├── auth-service/           # Authentication microservice
├── billing-service/        # Billing microservice
├── common-lib/             # Shared library
├── discovery-service/      # Eureka server
├── frontend/
│   └── ihms-portal/       # Angular frontend
├── gateway-service/        # API Gateway
├── patient-service/        # Patient microservice
├── pharmacy-service/       # Pharmacy microservice
├── docker-compose.yml      # Production compose
├── docker-compose.local.yml # Local development
├── docker-compose.nexus.yml # Nexus setup
├── Jenkinsfile             # Standard pipeline
├── Jenkinsfile.selectable  # Selectable build pipeline
└── setup-nexus.sh          # Nexus setup script
```

## 🔐 Security

- JWT-based authentication
- Spring Security integration
- Role-based access control (ADMIN, DOCTOR, NURSE, PATIENT)

## 📝 API Documentation

After starting services, access Swagger UI:
- Gateway: http://localhost:8080/swagger-ui.html
- Individual services: http://localhost:{port}/swagger-ui.html

## 🛠️ Development

### Build Individual Service
```bash
./gradlew :auth-service:build
```

### Run Individual Service
```bash
./gradlew :auth-service:bootRun
```

### Run Tests
```bash
./gradlew test
```

## 📞 Support

For issues, please create a GitHub issue or contact the development team.

