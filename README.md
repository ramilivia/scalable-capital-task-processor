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

NestJS is a progressive Node.js framework that works on top of express and provides a strong architectural foundation out of the box.  It follows great backend design practices similar to those used in other solid frameworks like Spring Boot making it ideal for building scalable, maintainable, and testable server-side applications.

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

PostgreSQL it's a powerful, open-source relational database. It supports ACID-compliant transactions, rich data types like JSON and can also be used as vector database allowing semantic search for advanced capabilities.

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
- **Dead Letter Queue (Failed Queue)** - Automatically receives messages after failed processing attempts
- **Queue Configuration** - Redrive policies, visibility timeouts, and retention periods

### Retry Configuration & Dead Letter Queue

The retry mechanism and dead letter queue are configured in Terraform using AWS SQS redrive policies:

- **Visibility Timeout**: When a message is received from the queue, it becomes invisible to other consumers for a configurable period (default: 300 seconds / 5 minutes). This prevents multiple workers from processing the same message simultaneously. If the message isn't deleted within this timeout period, it becomes visible again and can be retried.
- **Retry Policy**: Messages that fail processing are automatically retried up to **3 times** (`maxReceiveCount = 3`)
- **Dead Letter Queue**: After 3 failed attempts, messages are automatically moved to the dead letter queue (`task-queue-failed`)
- **Automatic Handling**: This retry and dead letter queue configuration is handled entirely by AWS SQS through the redrive policy defined in Terraform - no application-level retry logic is required


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

### Components to Standardize

#### 1. **AWS Service Integration Layer**
Instead of each application manually implements AWS SDK clients (SQS, S3, etc.) with configuration management this could be centralized.

#### 2. **Initial Repository Setup**
In this case for practicality the converter and the task producer are on the same codebase but they are very likely to be separate services. Having a way to start a codebase that it's already configured and ready to use with all dependencies and good practices would be very useful.

This could include:
- Linting
- Formatting
- Dependencies
- Secret Management
- Examples for common operations
- Custom Decorators
- Out of the box authentication
- Roles Management

#### 3. **Error Handling & Exception Management**
Standardized error handling patterns would ensure consistent error responses and proper error propagation.

#### 4. **Logging & Observability Framework**
Centralized logging, tracing, and metrics collection would provide consistent observability across all services

#### 5. **CI/CD Templates & Workflows**
Pre-built CI/CD pipelines would standardize deployment processes. And facilitate deployments to production.

## Security Concerns & General Improvements

### Current Security Issues

#### 1. **No Authentication/Authorization**
The API is completely open - anyone can create, read, or modify tasks.

#### 2. **Hardcoded Credentials**
Database and AWS credentials are hardcoded in configuration with default values.

#### 4. **No HTTPS/TLS**
All communication is over HTTP, making it vulnerable to man-in-the-middle attacks.


#### 5. **No CORS Configuration**
Unrestricted cross-origin requests could lead to CSRF attacks.

#### 6. **Database Security**
Database credentials in plain text, no connection encryption.

#### 7. **No Rate Limiting**
API is vulnerable to abuse and DDoS attacks.

## Future Improvements

If given more time, the following improvements would improve the application:

### 1. **Testing Infrastructure**
- Unit tests for all services and controllers
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- High test coverage to enable safe and frequent deployments

### 2. **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (RBAC)

### 3. **API Documentation**
- OpenAPI/Swagger documentation

### 4. **Developer Experience**
- Linter running on pre-push
- Formatting running on pre-commit 

### 5. **Scalability Improvements on Terraform**
- Horizontal scaling support
- Database read replicas
- Load balancing configuration
- Auto-scaling policies
- Caching when possible

### 6. **Data Management**
- Database migrations management

