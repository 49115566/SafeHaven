# SafeHaven Connect - Backend Services

AWS Serverless backend for SafeHaven Connect, providing emergency shelter management and real-time communication capabilities.

## Architecture

- **Framework**: AWS Serverless Framework
- **Runtime**: Node.js 18.x with TypeScript
- **Database**: Amazon DynamoDB
- **Authentication**: JWT with bcrypt password hashing
- **API**: REST API via AWS API Gateway
- **Real-time**: AWS WebSocket API (planned)

## Services Implemented

### ✅ Authentication Service (SH-S1-001) - COMPLETED

Complete authentication system with enterprise-grade security:

- **Registration**: Shelter operator account creation with shelter provisioning
- **Login**: Secure authentication with JWT token generation
- **Authorization**: JWT verification middleware for protected endpoints
- **Security**: bcrypt password hashing (12 salt rounds), rate limiting, input validation

**Endpoints**:
- `POST /auth/register` - User registration with shelter creation
- `POST /auth/login` - User authentication and JWT generation
- `GET /auth/verify` - JWT verification middleware (for protected routes)

**Key Features**:
- 🔒 **Password Security**: bcrypt with 12 salt rounds (exceeds industry standard of 10)
- 🛡️ **JWT Authentication**: 24-hour token expiration with secure payload
- 🚫 **Rate Limiting**: 10 attempts per 15 minutes per IP address
- ✅ **Input Validation**: Comprehensive Joi schemas with sanitization
- 🔐 **Error Security**: No information leakage in error responses
- 📊 **Audit Ready**: Structured logging for authentication events

### 🚧 Shelter Management Service (SH-S1-004) - PENDING

Real-time shelter capacity and status management.

### 🚧 Alert System Service (SH-S1-006) - PENDING

Emergency alert broadcasting and acknowledgment system.

### 🚧 WebSocket Service (SH-S1-002) - PENDING

Real-time communication infrastructure for live updates.

## Project Structure

```
backend/
├── src/
│   ├── functions/           # Lambda function handlers
│   │   ├── auth/           # Authentication endpoints ✅
│   │   │   ├── login.ts    # User login with JWT generation
│   │   │   ├── register.ts # User/shelter registration  
│   │   │   └── verify.ts   # JWT verification middleware
│   │   ├── shelters/       # Shelter management endpoints
│   │   ├── alerts/         # Alert system endpoints
│   │   └── websocket/      # WebSocket handlers
│   ├── services/           # Business logic services
│   │   ├── authService.ts  # Authentication utilities ✅
│   │   ├── shelterService.ts
│   │   └── notificationService.ts
│   ├── models/             # Data models and types
│   │   └── types.ts        # Shared TypeScript interfaces
│   ├── utils/              # Utility functions
│   │   ├── validation.ts   # Input validation schemas ✅
│   │   └── responseHelper.ts # API response formatting
│   └── __tests__/          # Unit tests
│       └── auth.test.ts    # Authentication test suite ✅
├── postman/                # API testing collections ✅
│   ├── SafeHaven_Authentication_Tests.postman_collection.json
│   ├── SafeHaven_Authentication.postman_environment.json
│   └── README.md           # Testing documentation
├── infrastructure/         # AWS infrastructure as code
├── serverless.yml          # Serverless Framework configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── jest.config.json       # Jest testing configuration
└── webpack.config.js      # Build configuration
```

## Quick Start

### Prerequisites

- Node.js 18+
- AWS CLI configured
- Serverless Framework CLI

### Installation

```bash
# Install dependencies
npm install

# Install Serverless Framework globally
npm install -g serverless

# Configure AWS credentials
aws configure
```

### Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Build project
npm run build
```

### Deployment

```bash
# Deploy to AWS
npx serverless deploy

# Deploy specific function
npx serverless deploy function -f login

# View logs
npx serverless logs -f login -t
```

### Environment Configuration

Create `.env` file with required environment variables:

```bash
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRATION=24h

# DynamoDB Configuration  
USERS_TABLE=SafeHaven-Users-${self:provider.stage}
SHELTERS_TABLE=SafeHaven-Shelters-${self:provider.stage}

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX_ATTEMPTS=10

# AWS Region
AWS_REGION=us-east-2
```

## Testing

### Unit Tests

Complete Jest test suite with 16 test scenarios:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test auth.test.ts
```

**Test Coverage**: 
- ✅ Authentication flows (login, registration, token verification)
- ✅ Password security (hashing, validation)
- ✅ Input validation (email, password strength, shelter data)
- ✅ Rate limiting behavior
- ✅ Error handling and security
- ✅ JWT token generation and validation

### API Tests (Postman)

Comprehensive Postman collection with 11 test scenarios:

```bash
# Install Newman for command-line testing
npm install -g newman

# Run Postman collection
newman run postman/SafeHaven_Authentication_Tests.postman_collection.json \
  -e postman/SafeHaven_Authentication.postman_environment.json
```

**API Test Coverage**:
- 🔐 **Authentication Tests**: Registration, login, duplicate prevention
- 🛡️ **Authorization Tests**: Protected endpoints, token validation
- ✅ **Validation Tests**: Input validation, password strength
- 🚫 **Security Tests**: Rate limiting, error message security

See `postman/README.md` for detailed setup and usage instructions.

## Security Features

### Authentication Security
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: HS256 signing with configurable expiration
- **Rate Limiting**: IP-based with configurable thresholds
- **Input Validation**: Joi schemas with sanitization
- **Error Security**: Generic error messages preventing information leakage

### OWASP Compliance
- ✅ **A01 - Broken Access Control**: JWT verification on all protected endpoints
- ✅ **A02 - Cryptographic Failures**: Strong password hashing and JWT signing
- ✅ **A03 - Injection**: Input validation and sanitization
- ✅ **A05 - Security Misconfiguration**: Secure default configurations
- ✅ **A07 - Identification and Authentication Failures**: Strong password policies

## API Documentation

### Authentication Endpoints

#### POST /auth/register
Register a new shelter operator account.

**Request Body**:
```json
{
  "email": "operator@shelter.org",
  "password": "SecurePassword123!",
  "role": "shelter_operator",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+15551234567",
    "organization": "City Emergency Shelter"
  },
  "shelterInfo": {
    "name": "Downtown Emergency Shelter",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, City, State 12345"
    },
    "capacity": {
      "maximum": 100
    },
    "contactInfo": {
      "phone": "+15551234567",
      "email": "contact@shelter.org"
    }
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "user-uuid",
      "email": "operator@shelter.org",
      "role": "shelter_operator",
      "shelterId": "shelter-uuid",
      "isActive": true,
      "createdAt": "2025-01-12T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body**:
```json
{
  "email": "operator@shelter.org",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "user-uuid",
      "email": "operator@shelter.org",
      "role": "shelter_operator",
      "shelterId": "shelter-uuid"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": ["Password must be at least 8 characters"]
  }
}
```

## Monitoring and Debugging

### CloudWatch Logs

View Lambda function logs:

```bash
# Real-time logs
npx serverless logs -f login -t

# Specific time range
npx serverless logs -f login --startTime 2h
```

### DynamoDB Monitoring

Monitor database operations:
- **Users Table**: User account storage and lookup
- **Shelters Table**: Shelter information and capacity data

### Performance Metrics

Key metrics to monitor:
- **Authentication latency**: Target < 500ms
- **Token validation**: Target < 100ms  
- **Database operations**: Target < 200ms
- **Rate limiting**: Monitor blocked requests

## Troubleshooting

### Common Issues

1. **JWT_SECRET not configured**
   ```bash
   Error: JWT secret not configured
   Solution: Set JWT_SECRET environment variable
   ```

2. **DynamoDB table not found**
   ```bash
   Error: ResourceNotFoundException
   Solution: Run 'npx serverless deploy' to create tables
   ```

3. **Rate limiting triggered**
   ```bash
   Error: Too many authentication attempts
   Solution: Wait 15 minutes or clear rate limit store
   ```

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment variable
export DEBUG=safehaven:*

# Run with verbose logging
npm test -- --verbose
```

## Contributing

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Standard configuration with security rules
- **Prettier**: Consistent code formatting
- **Jest**: Minimum 90% test coverage required

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run full test suite: `npm test`
4. Update documentation if needed
5. Submit PR with detailed description

### Security Guidelines

- Never commit secrets or credentials
- Follow OWASP secure coding practices
- Validate all user inputs
- Use parameterized database queries
- Implement proper error handling

## Support

For technical issues:
1. Check CloudWatch logs for detailed error information
2. Review DynamoDB table structure and data
3. Verify environment variable configuration
4. Test with Postman collection to isolate issues

## License

Part of SafeHaven Connect - Breaking Barriers Hackathon 2025 submission.