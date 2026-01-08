# IHMS - Integrated Hospital Management System

A comprehensive microservices-based hospital management system built with Spring Boot and Angular.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Angular Frontend                              │
│                       (ihms-portal:80)                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway                                   │
│                    (gateway-service:8080)                            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Service  │   │Patient Service│   │ Appointment   │
│   (:8081)     │   │   (:8082)     │   │   (:8083)     │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   auth-db     │   │  patient-db   │   │appointment-db │
│   (:5433)     │   │   (:5434)     │   │   (:5435)     │
└───────────────┘   └───────────────┘   └───────────────┘

        ┌───────────────────────┬───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│Billing Service│   │Pharmacy Svc   │   │Discovery Svc  │
│   (:8084)     │   │   (:8085)     │   │(Eureka:8761)  │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│  billing-db   │   │  pharmacy-db  │
│   (:5436)     │   │   (:5437)     │
└───────────────┘   └───────────────┘
```

## Technology Stack

### Backend
- **Java 17** with Spring Boot 3.2
- **Spring Cloud** (Eureka, Gateway, OpenFeign)
- **Spring Security** with JWT Authentication
- **Spring Data JPA** with PostgreSQL
- **Flyway** for database migrations
- **SpringDoc OpenAPI** for API documentation

### Frontend
- **Angular 17** (Standalone Components)
- **Angular Material** for UI components
- **RxJS** for reactive programming

### Infrastructure
- **Docker** & **Docker Compose**
- **Jenkins** CI/CD Pipeline
- **Nexus Repository** for artifact storage
- **PostgreSQL 15** (Database per service)

## Project Structure

```
ihms/
├── common-lib/             # Shared DTOs, utilities, security
├── discovery-service/      # Eureka Service Registry
├── gateway-service/        # API Gateway with routing
├── auth-service/           # Authentication & Authorization
├── patient-service/        # Patient Management
├── appointment-service/    # Appointment Scheduling
├── billing-service/        # Invoicing & Payments
├── pharmacy-service/       # Medication & Inventory
└── frontend/
    └── ihms-portal/        # Angular SPA
```

## Getting Started

### Prerequisites
- JDK 17+
- Node.js 18+
- Docker & Docker Compose
- Gradle 8+

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourorg/ihms.git
   cd ihms
   ```

2. **Start infrastructure (databases)**
   ```bash
   docker-compose up -d auth-db patient-db appointment-db billing-db pharmacy-db
   ```

3. **Build all services**
   ```bash
   ./gradlew clean build
   ```

4. **Start Discovery Service first**
   ```bash
   ./gradlew :discovery-service:bootRun
   ```

5. **Start other services**
   ```bash
   ./gradlew :gateway-service:bootRun
   ./gradlew :auth-service:bootRun
   ./gradlew :patient-service:bootRun
   ./gradlew :appointment-service:bootRun
   ./gradlew :billing-service:bootRun
   ./gradlew :pharmacy-service:bootRun
   ```

6. **Start Angular frontend**
   ```bash
   cd frontend/ihms-portal
   npm install
   npm start
   ```

### Docker Deployment

1. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

2. **Build and run all services**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application**
   - Frontend: http://localhost
   - API Gateway: http://localhost:8080
   - Eureka Dashboard: http://localhost:8761
   - Swagger UI: http://localhost:8080/swagger-ui.html

## API Documentation

Once services are running, access Swagger UI:
- Auth Service: http://localhost:8081/swagger-ui.html
- Patient Service: http://localhost:8082/swagger-ui.html
- Appointment Service: http://localhost:8083/swagger-ui.html
- Billing Service: http://localhost:8084/swagger-ui.html
- Pharmacy Service: http://localhost:8085/swagger-ui.html

## Default Credentials

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin123 | ADMIN |

## Jenkins CI/CD Pipeline

The project includes a complete CI/CD pipeline (`Jenkinsfile`) that:

1. **Builds** all Spring Boot services
2. **Runs** unit tests
3. **Builds** Angular frontend
4. **Creates** Docker images
5. **Pushes** to Nexus Docker Registry
6. **Deploys** to Dev/Staging/Production environments

### Pipeline Stages
- Checkout
- Build & Test
- Code Quality (SonarQube)
- Build Angular Frontend
- Build Docker Images
- Push to Nexus Registry
- Deploy to Dev (develop branch)
- Deploy to Staging (main branch)
- Deploy to Production (tagged releases)

## Environment Variables

| Variable      | Description                  | Default                |
|---------------|------------------------------|------------------------|
| DB_HOST       | Database hostname            | localhost              |
| DB_PORT       | Database port                | 5432                   |
| DB_USER       | Database username            | postgres               |
| DB_PASSWORD   | Database password            | postgres               |
| JWT_SECRET    | JWT signing secret           | (development default)  |
| EUREKA_HOST   | Eureka server hostname       | localhost              |

## License

MIT License - see LICENSE file for details.

