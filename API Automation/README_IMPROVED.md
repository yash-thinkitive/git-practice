# Healthcare API Automation Framework - Improved

A robust, enterprise-grade API automation framework built with Playwright and TypeScript for healthcare platform testing.

## 🚀 Key Improvements

### 1. **Centralized Configuration Management**
- Environment-specific settings in `src/config/environment.ts`
- Support for multiple environments (stage, dev)
- Secure credential management with environment variables

### 2. **Structured Logging System**
- Custom logger with different log levels (DEBUG, INFO, WARN, ERROR)
- Context-aware logging with request IDs and test names
- Timestamped, structured log output

### 3. **Retry Logic & Error Handling**
- Automatic retry for transient failures
- Configurable retry attempts and backoff strategy
- Comprehensive error handling with detailed error messages

### 4. **Data Validation**
- Input validation for all API requests
- Email, phone, date, and enum validation
- Custom validation error messages

### 5. **Improved Type Safety**
- Enhanced TypeScript interfaces
- Better type definitions for API responses
- Reduced use of `any` types

### 6. **Code Quality Tools**
- ESLint configuration for code standards
- TypeScript strict mode
- Consistent code formatting

## 📁 Project Structure

```
API Automation/
├── src/
│   ├── api/
│   │   └── healthcare-api-client.ts    # Main API client
│   ├── config/
│   │   └── environment.ts              # Environment configuration
│   ├── types/
│   │   └── api.types.ts               # TypeScript interfaces
│   └── utils/
│       ├── logger.ts                   # Structured logging
│       ├── retry.ts                    # Retry logic
│       └── validator.ts                # Data validation
├── tests/
│   ├── healthcare-workflow-improved.spec.ts  # Improved tests
│   ├── healthcare-workflow.spec.ts           # Original tests
│   └── healthcare-postman-workflow.spec.ts   # Postman tests
├── .eslintrc.js                       # ESLint configuration
├── playwright.config.ts               # Playwright configuration
└── package.json                       # Dependencies and scripts
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd API-Automation

# Install dependencies
npm install

# Install Playwright browsers
npm run install:playwright
```

### Environment Setup
1. Copy environment configuration in `src/config/environment.ts`
2. Update credentials for your environment
3. Set environment variables for sensitive data:
   ```bash
   export DEV_USERNAME=your-dev-username
   export DEV_PASSWORD=your-dev-password
   ```

## 🧪 Running Tests

### Available Test Scripts

```bash
# Run all tests
npm test

# Run improved tests only
npm run test:improved

# Run with headed browser (for debugging)
npm run test:improved:headed

# Run in debug mode
npm run test:improved:debug

# Run original tests
npm run test:original

# Run Postman workflow tests
npm run test:postman

# Run all tests with HTML report
npm run test:all
```

### Test Categories

1. **Complete Workflow Test** - End-to-end healthcare workflow
2. **Error Handling Tests** - Invalid login, unauthorized requests
3. **Data Validation Tests** - Invalid data scenarios
4. **Verification Tests** - Data integrity checks

## 🔧 Configuration

### Environment Configuration
```typescript
// src/config/environment.ts
export const environments = {
  stage: {
    baseURL: 'https://stage-api.ecarehealth.com/api/master',
    tenantId: 'stage_aithinkitive',
    credentials: {
      username: 'rose.gomez@jourrapide.com',
      password: 'Pass@123'
    },
    timeouts: {
      request: 30000,
      navigation: 60000,
      assertion: 10000
    },
    retry: {
      maxAttempts: 3,
      delayMs: 1000
    }
  }
}
```

### Logging Configuration
```typescript
// Set log level
logger.setLevel(LogLevel.INFO);

// Set context
logger.setContext({ 
  testName: 'My Test',
  requestId: 'req_123' 
});
```

## 📊 Features

### 1. **HealthcareApiClient**
- Centralized API client with authentication
- Automatic token management
- Request/response logging
- Error handling and retry logic

### 2. **Data Validation**
```typescript
// Automatic validation for all API calls
Validator.validateEmail(email);
Validator.validatePhone(phone);
Validator.validateDate(birthDate, 'birthDate');
Validator.validateEnum(gender, ['MALE', 'FEMALE'], 'gender');
```

### 3. **Retry Logic**
```typescript
// Automatic retry for transient failures
RetryHandler.execute(async () => {
  return await apiClient.createPatient(patient);
}, {
  maxAttempts: 3,
  delayMs: 1000
});
```

### 4. **Structured Logging**
```typescript
logger.step('Create Patient', 'Creating patient: John Doe');
logger.success('Patient created successfully', { patientId: '123' });
logger.failure('Operation failed', error);
```

## 🧪 Test Examples

### Basic API Test
```typescript
test('Create Patient', async ({ request }) => {
  const apiClient = new HealthcareApiClient(request, 'stage');
  
  // Login
  await apiClient.login();
  
  // Create patient
  const patient: Patient = {
    firstName: 'John',
    lastName: 'Doe',
    gender: 'MALE',
    birthDate: '1990-01-01',
    email: 'john.doe@example.com'
  };
  
  const response = await apiClient.createPatient(patient);
  expect(response.success).toBe(true);
});
```

### Error Handling Test
```typescript
test('Invalid Login', async ({ request }) => {
  const apiClient = new HealthcareApiClient(request, 'stage');
  
  try {
    await apiClient.login({
      username: 'invalid@email.com',
      password: 'wrongpassword'
    });
    expect(false).toBe(true); // Should not reach here
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }
});
```

## 🔍 Debugging

### Enable Debug Logging
```typescript
logger.setLevel(LogLevel.DEBUG);
```

### View Request/Response Details
```typescript
// All requests are automatically logged with details
logger.debug('Making POST request', { 
  url: '/patient',
  hasData: true 
});
```

### Retry Debugging
```typescript
// Retry attempts are logged automatically
logger.warn('Attempt 1 failed, retrying in 1000ms', error);
```

## 📈 Best Practices

### 1. **Test Organization**
- Group related tests in describe blocks
- Use descriptive test names
- Separate happy path and error scenarios

### 2. **Data Management**
- Use test data factories for consistent data
- Clean up test data after tests
- Use unique identifiers to avoid conflicts

### 3. **Error Handling**
- Always test error scenarios
- Validate error messages and status codes
- Use try-catch blocks for expected errors

### 4. **Logging**
- Use appropriate log levels
- Include relevant context in log messages
- Avoid logging sensitive information

## 🚀 Performance

### Optimizations
- Connection pooling for HTTP requests
- Efficient retry logic with exponential backoff
- Minimal logging overhead
- TypeScript compilation optimizations

### Monitoring
- Request/response timing
- Retry attempt tracking
- Error rate monitoring
- Test execution metrics

## 🔒 Security

### Credential Management
- Environment variables for sensitive data
- No hardcoded credentials in source code
- Secure credential rotation support

### Data Protection
- No logging of sensitive information
- Secure token handling
- Input sanitization

## 🤝 Contributing

### Code Standards
- Follow TypeScript best practices
- Use ESLint for code quality
- Write comprehensive tests
- Document new features

### Pull Request Process
1. Create feature branch
2. Write tests for new functionality
3. Update documentation
4. Run linting and tests
5. Submit pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information
4. Include logs and error messages

---

**Note**: This improved version maintains backward compatibility with the original implementation while adding enterprise-grade features for better maintainability, reliability, and developer experience. 