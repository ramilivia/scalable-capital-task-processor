# Scalable Capital Task Processor

A REST API service built with NestJS, TypeScript, PostgreSQL, AWS SQS, and Docker for processing asynchronous tasks such as currency conversion and interest calculations.

## Technologies Used

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Relational database
- **TypeORM** - Object-Relational Mapping
- **AWS SQS** - Message queue service for asynchronous task processing
- **Terraform** - Infrastructure as Code for provisioning AWS resources
- **LocalStack** - Local AWS cloud stack emulator for development
- **Docker** - Containerization

## Why NestJS? (Architecture-Focused Overview)

The decision felt very natural since I am a seasoned javascript developer and I really think NestJS it's the best available framework for backend on the javascript ecosystem. 

NestJS is a progressive Node.js framework that works on top of express and provides a strong architectural foundation out of the box.  It follows proven backend design practices—similar to those used in enterprise frameworks like Spring Boot—making it ideal for building scalable, maintainable, and testable server-side applications.

### Modular Architecture
NestJS organizes code using **modules**, each containing controllers, services, and providers.  
This keeps features separated, makes the project easier to navigate, and supports clear boundaries between responsibilities.

### Layered Design (Same Pattern Used in Spring Boot)
NestJS encourages a classic **Layered Architecture** (also called N-Tier), typically consisting of:

- **Controllers** — handle requests and responses  
- **Services** — contain business logic  
- **Repositories** — manage data access  

This approach provides clear separation of concerns, predictable structure, and easier testing, while laying a solid foundation for future architectural growth.

### Built-In TypeScript and Type Safety
NestJS is written in **TypeScript** and fully supports static typing.  
Benefits include:

- Strong type safety across the entire application  
- Safer refactoring and maintenance  
- Better IDE support and autocompletion  
- Fewer runtime errors thanks to early compile-time checks  

### Dependency Injection for Flexibility and Testability
NestJS uses **dependency injection (DI)** throughout the framework.  
DI makes components **loosely coupled**, allowing you to easily replace or mock dependencies during testing.  
This improves testability by enabling unit tests that focus on one class at a time without relying on real databases, services, or external APIs.

### Database Integration
NestJS has **native support for TypeORM**, making database integration simple and efficient.  
It works seamlessly with relational databases such as **PostgreSQL**, providing:

- Easy entity and repository management  
- Strong type safety for database operations  
- Automated migrations and schema synchronization  
- Clean separation between business logic and data access  

### Powerful CLI
NestJS comes with a **command-line interface (CLI)** that streamlines development by allowing you to quickly generate modules, controllers, services, and other boilerplate code.  
The CLI helps enforce project structure, reduces repetitive tasks, and accelerates onboarding for new team members.

### Support for Event-Driven and Microservices Architectures
NestJS has built-in support for event-driven workflows and **microservices**, with transport layers such as Redis, NATS, gRPC, Kafka, and RabbitMQ.  
Teams can start with a monolith and gradually adopt distributed services without major rewrites.

### Built-In Features for Common Backend Tasks
NestJS provides structured tools to handle recurring backend tasks, keeping your code organized:

- **Guards** — handle authorization  
- **Pipes** — validation and data transformation  
- **Interceptors** — logging, caching, and other cross-cutting concerns  
- **Exception Filters** — centralized error handling  
- **Middleware** — request processing extensions  

These features help separate business logic from supporting infrastructure, making the code easier to maintain and scale.

## PostgreSQL

PostgreSQL is a powerful, open-source relational database known for reliability, strong data integrity, and advanced SQL features. It supports ACID-compliant transactions, rich data types like JSON and arrays, and extensions such as PostGIS. With high performance, scalability, and seamless integration with ORMs like TypeORM, PostgreSQL provides a stable and type-safe foundation for modern backend applications built with NestJS, and it can also enable semantic search using embeddings for advanced search capabilities.

**Note**: PostgreSQL is run via Docker Compose rather than LocalStack because the free tier of LocalStack does not support RDS (Relational Database Service) emulation. 

## Terraform

**Terraform** is used for Infrastructure as Code (IaC) to provision and manage AWS resources, specifically SQS queues. This approach provides several key benefits:

### Infrastructure as Code Benefits
- **Version Control** - Infrastructure changes are tracked in git alongside application code
- **Reproducibility** - Same infrastructure can be provisioned consistently across environments
- **Documentation** - Infrastructure configuration serves as living documentation
- **Collaboration** - Team members can review and understand infrastructure changes through code reviews

### Local Development with LocalStack
Terraform is configured to work with **LocalStack**, allowing developers to:
- Provision SQS queues locally without AWS credentials
- Test infrastructure changes before deploying to production
- Maintain identical infrastructure configuration for local and production environments

### Infrastructure Provisioned
- **Task Queue** - Main queue for task processing with visibility timeout and message retention
- **Dead Letter Queue** - Automatically receives messages after 3 failed processing attempts
- **Queue Configuration** - Redrive policies, visibility timeouts, and retention periods

The Terraform configuration is located in the `terraform/` directory and can be applied to both LocalStack (for local development) and AWS (for production deployment).

## Project Setup

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Terraform (v1.0 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scalable-capital-currency
```

2. Install dependencies:
```bash
npm install
```

3. Start Docker services (LocalStack and PostgreSQL):
```bash
docker-compose up -d
```

This will start:
- **LocalStack** on port 4566 (AWS services emulator)
- **PostgreSQL** on port 5432

**Note**: PostgreSQL runs in Docker rather than LocalStack because the free tier of LocalStack does not support RDS emulation. LocalStack's free tier is used for AWS services like SQS, while PostgreSQL is containerized separately for local development.

4. Provision infrastructure with Terraform:
```bash
cd terraform
terraform init
terraform apply -auto-approve
cd ..
```

This will create the SQS queues (task queue and dead letter queue) in LocalStack.


## Running the Application

### Development Mode

Start the application in watch mode (auto-reload on file changes):

```bash
npm run start:dev
```

The application will:
- Start on port 3000 (configurable via `PORT` environment variable)
- Automatically create SQS queues on startup
- Connect to PostgreSQL and create tables automatically (synchronize mode)
- Start polling for tasks and results

### Production Mode

1. Build the application:
```bash
npm run build
```

2. Start the application:
```bash
npm run start:prod
```

### Environment Variables

You can configure the application using environment variables:

```bash
# AWS Configuration (for LocalStack, defaults are fine)
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566

# SQS Configuration
SQS_QUEUE_NAME=task-queue
SQS_RESULTS_QUEUE_NAME=results-queue
SQS_VISIBILITY_TIMEOUT=300
SQS_MESSAGE_RETENTION_PERIOD=86400

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=tasks_db
DB_SYNCHRONIZE=true
DB_LOGGING=false

# Application Configuration
PORT=3000
CONVERTER_POLL_INTERVAL=1000
RESULTS_POLL_INTERVAL=1000
```

## API Usage

### Create a Task

**Currency Conversion:**
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "convert-currency",
    "payload": {
      "amount": 100,
      "fromCurrency": "EUR",
      "toCurrency": "USD"
    }
  }'
```

**Interest Calculation:**
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "calculate-interest",
    "payload": {
      "principal": 1000,
      "annualRate": 0.05,
      "days": 30
    }
  }'
```

### Get All Tasks

```bash
curl http://localhost:3000/tasks
```

### Get Task by ID

```bash
curl http://localhost:3000/tasks/<task-id>
```

### Check SQS Queue (for debugging)

```bash
curl http://localhost:3000/tasks/sqs?maxMessages=10
```

## Task Status Flow

Tasks progress through the following statuses:

1. **pending** - Task created and queued, waiting to be processed
2. **processing** - Task is being processed by the converter service
3. **completed** - Task completed successfully with a result
4. **failed** - Task failed during processing (error details in `error` field)

## Architecture Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP POST /tasks
       ▼
┌─────────────────┐      ┌──────────────┐      ┌──────────────┐
│ Tasks Controller│─────▶│ Tasks Service│─────▶│  PostgreSQL  │
└─────────────────┘      └──────┬───────┘      └──────────────┘
                                │
                                │ Send Message
                                ▼
                         ┌──────────────┐
                         │  Task Queue  │
                         │    (SQS)     │
                         └──────┬───────┘
                                │
                                │ Poll & Process
                                ▼
                         ┌──────────────┐
                         │   Converter  │
                         │   Service    │
                         └──────┬───────┘
                                │
                                │ Send Result
                                ▼
                         ┌──────────────┐
                         │ Results Queue│
                         │    (SQS)     │
                         └──────┬───────┘
                                │
                                │ Poll & Update
                                ▼
                         ┌──────────────┐      ┌──────────────┐
                         │ Tasks Service│─────▶│  PostgreSQL  │
                         └──────────────┘      └──────────────┘
```

## Project Structure

```
src/
├── config/              # Configuration module
├── tasks/               # Tasks module (API layer)
│   ├── dto/            # Data Transfer Objects
│   ├── entities/       # TypeORM entities
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── tasks.module.ts
├── converter/          # Converter module (worker)
│   ├── converter.service.ts
│   └── converter.module.ts
├── sqs/                # SQS module
│   ├── sqs.service.ts
│   └── sqs.module.ts
├── app.module.ts       # Root module
└── main.ts             # Application entry point

terraform/
├── main.tf             # Terraform configuration
├── variables.tf         # Variable definitions
└── outputs.tf          # Output values
```

## Application Framework Team: Centralization & Standardization

If this project were part of a larger organization with an Application Framework team, several components would be abstracted away and standardized to reduce duplication and ensure consistency across application development teams.

### Components to Centralize

#### 1. **AWS Service Integration Layer**
**Current State**: Each application manually implements AWS SDK clients (SQS, S3, etc.) with configuration management.

**Framework Approach**:
- Create a shared `@company/aws-client` package that provides pre-configured, tested AWS service clients
- Abstract away credential management, endpoint configuration, and retry logic
- Provide standardized interfaces for common operations (send message, receive message, etc.)
- Include built-in connection pooling, circuit breakers, and health checks

**Benefits**: 
- Consistent error handling across all applications
- Centralized AWS best practices (retries, timeouts, backoff strategies)
- Easier credential rotation and security updates
- Reduced boilerplate code in application teams

#### 2. **Configuration Management**
**Current State**: Each application implements its own configuration loading from environment variables.

**Framework Approach**:
- Provide a standardized configuration module with:
  - Type-safe configuration schemas
  - Environment-specific configuration files (dev, staging, prod)
  - Secrets management integration (AWS Secrets Manager, HashiCorp Vault)
  - Configuration validation on startup
  - Hot-reload capabilities for non-sensitive config

**Benefits**:
- Consistent configuration patterns across teams
- Built-in validation prevents misconfiguration
- Centralized secrets management improves security
- Easier environment management

#### 3. **Database Connection & ORM Setup**
**Current State**: Each application configures TypeORM independently.

**Framework Approach**:
- Provide a shared database module with:
  - Pre-configured connection pooling
  - Standardized migration management
  - Health check endpoints
  - Query logging and monitoring hooks
  - Read/write replica support
  - Transaction management utilities

**Benefits**:
- Consistent database patterns
- Built-in monitoring and observability
- Easier database scaling strategies
- Reduced connection pool configuration errors

#### 4. **Message Queue Abstraction**
**Current State**: Applications directly interact with SQS APIs.

**Framework Approach**:
- Create a message queue abstraction layer that:
  - Supports multiple queue backends (SQS, RabbitMQ, Redis)
  - Provides standardized message schemas and serialization
  - Includes built-in dead letter queue handling
  - Offers message versioning and schema evolution
  - Provides observability (metrics, tracing)

**Benefits**:
- Vendor-agnostic queue implementation
- Easier migration between queue providers
- Consistent message handling patterns
- Built-in observability

#### 5. **Validation & DTO Framework**
**Current State**: Each application defines validation decorators manually.

**Framework Approach**:
- Provide standardized DTO base classes with:
  - Common validation decorators
  - Automatic API documentation generation (OpenAPI/Swagger)
  - Request/response transformation utilities
  - Version-aware serialization

**Benefits**:
- Consistent API contracts
- Automatic API documentation
- Reduced validation boilerplate
- Better API versioning support

#### 6. **Error Handling & Logging**
**Current State**: Basic error handling with console.log statements.

**Framework Approach**:
- Centralized error handling with:
  - Standardized error response formats
  - Structured logging (JSON logs with correlation IDs)
  - Error categorization and alerting
  - Integration with monitoring systems (Datadog, CloudWatch)
  - Request tracing across services

**Benefits**:
- Consistent error responses
- Better debugging with correlation IDs
- Centralized monitoring and alerting
- Easier troubleshooting across services

#### 7. **Health Checks & Observability**
**Current State**: No health check endpoints or observability.

**Framework Approach**:
- Standardized health check module with:
  - Liveness and readiness probes
  - Dependency health checks (database, queues, external APIs)
  - Metrics collection (Prometheus format)
  - Distributed tracing (OpenTelemetry)
  - Performance monitoring

**Benefits**:
- Consistent monitoring across all services
- Better Kubernetes/Docker orchestration support
- Easier debugging and performance optimization

### Implementation Strategy

1. **Shared NPM Packages**: Create internal packages (`@company/framework-core`, `@company/aws-integration`, etc.)
2. **NestJS Modules**: Provide pre-built, reusable NestJS modules that teams can import
3. **CLI Tools**: Framework CLI for scaffolding new services with best practices
4. **Documentation**: Comprehensive guides and examples for framework usage
5. **Versioning**: Semantic versioning with migration guides for breaking changes

## Security Concerns & Improvements

### Current Security Issues

#### 1. **No Authentication/Authorization**
**Risk**: The API is completely open - anyone can create, read, or modify tasks.

**Mitigation**:
- Implement API key authentication or OAuth2/JWT tokens
- Add role-based access control (RBAC) for different operations
- Use NestJS Guards to protect endpoints
- Implement rate limiting per user/API key

#### 2. **Hardcoded Credentials**
**Risk**: Database and AWS credentials are hardcoded in configuration with default values.

**Mitigation**:
- Use AWS Secrets Manager or HashiCorp Vault for secrets
- Never commit secrets to version control
- Use environment-specific secret injection
- Implement credential rotation policies
- Use IAM roles instead of access keys where possible

#### 3. **No Input Sanitization**
**Risk**: While basic validation exists, there's no protection against injection attacks.

**Mitigation**:
- Add input sanitization for all user inputs
- Use parameterized queries (TypeORM already does this, but verify)
- Implement content security policies
- Validate and sanitize JSON payloads deeply

#### 4. **No HTTPS/TLS**
**Risk**: All communication is over HTTP, making it vulnerable to man-in-the-middle attacks.

**Mitigation**:
- Enforce HTTPS in production
- Use TLS termination at load balancer or API gateway
- Implement certificate pinning for mobile clients
- Use HSTS headers

#### 5. **No CORS Configuration**
**Risk**: Unrestricted cross-origin requests could lead to CSRF attacks.

**Mitigation**:
- Configure CORS to allow only trusted origins
- Use CSRF tokens for state-changing operations
- Implement SameSite cookie attributes

#### 6. **Database Security**
**Risk**: Database credentials in plain text, no connection encryption.

**Mitigation**:
- Use SSL/TLS for database connections
- Implement database user with least privilege
- Use connection string encryption
- Enable database audit logging
- Regular security patches and updates

#### 7. **No Rate Limiting**
**Risk**: API is vulnerable to abuse and DDoS attacks.

**Mitigation**:
- Implement rate limiting per IP/API key
- Use AWS API Gateway or CloudFront for DDoS protection
- Implement exponential backoff for retries
- Monitor and alert on unusual traffic patterns

#### 8. **Sensitive Data Exposure**
**Risk**: Task payloads and results may contain sensitive information.

**Mitigation**:
- Encrypt sensitive data at rest
- Use field-level encryption for PII
- Implement data retention policies
- Add audit logging for data access

#### 9. **No Security Headers**
**Risk**: Missing security headers makes the application vulnerable to various attacks.

**Mitigation**:
- Add security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Implement Content Security Policy
- Use Helmet.js middleware

#### 10. **Error Information Leakage**
**Risk**: Error messages may expose internal system details.

**Mitigation**:
- Sanitize error messages in production
- Use generic error messages for users
- Log detailed errors server-side only
- Implement proper error handling middleware

## Future Improvements

If given more time, the following improvements would significantly enhance the application:

### 1. **Testing Infrastructure**
- Unit tests for all services and controllers
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- Test coverage reporting and CI integration
- Mock services for external dependencies

### 2. **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (RBAC)
- API key management
- OAuth2 integration for third-party access
- Multi-factor authentication (MFA)

### 3. **API Documentation**
- OpenAPI/Swagger documentation
- Interactive API explorer
- Request/response examples
- Authentication documentation
- Versioning strategy

### 4. **Monitoring & Observability**
- Structured logging with correlation IDs
- Distributed tracing (OpenTelemetry)
- Metrics collection (Prometheus)
- Alerting for errors and performance issues
- Dashboard for system health

### 5. **Performance Optimizations**
- Database query optimization and indexing
- Caching layer (Redis) for frequently accessed data
- Connection pooling optimization
- Message batching for SQS
- Async processing improvements

### 6. **Resilience & Reliability**
- Circuit breakers for external services
- Retry policies with exponential backoff
- Health check endpoints (liveness/readiness)
- Graceful shutdown handling
- Database connection retry logic

### 7. **CI/CD Pipeline**
- Automated testing in CI
- Automated deployments
- Environment promotion strategy
- Rollback capabilities
- Infrastructure as Code validation

### 8. **API Enhancements**
- API versioning strategy
- Pagination for list endpoints
- Filtering and sorting capabilities
- Bulk operations support
- Webhook notifications for task completion

### 9. **Developer Experience**
- Better error messages
- Development tooling and scripts
- Local development improvements
- Documentation improvements
- Code generation tools

### 10. **Scalability Improvements**
- Horizontal scaling support
- Database read replicas
- Message queue partitioning
- Load balancing configuration
- Auto-scaling policies

### 11. **Data Management**
- Database migrations management
- Data backup and recovery procedures
- Data archival for old tasks
- Data export capabilities
- GDPR compliance features (data deletion, export)

### 12. **Security Hardening**
- Security audit and penetration testing
- Dependency vulnerability scanning
- Regular security updates
- Security headers implementation
- Secrets management integration
