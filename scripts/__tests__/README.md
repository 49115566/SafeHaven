# SafeHaven Demo Scripts - Test Suite

## Overview

This test suite validates the complete implementation of **SH-S1-011: Demo Data & Scenarios** against the requirements specified in:

- Sprint 1 Backlog (`docs/sprint-1-backlog.md`)
- Software Requirements Specification (`docs/software-requirements-specification.md`) 
- Software Architecture Diagram (`docs/software-architecture-diagram.md`)

## Test Coverage

### 🧪 Test Files

| Test File | Purpose | Requirements Validated |
|-----------|---------|----------------------|
| `seed-demo-data.test.js` | Demo data structure and seeding | REQ-BE-001, REQ-SEC-001, REQ-PERF-001 |
| `demo-scenarios.test.js` | Interactive scenario execution | REQ-BE-002, REQ-SCA-003, REQ-SCA-004, REQ-SCA-005 |
| `demo-setup.test.js` | Automated environment setup | Deployment, Environment Configuration |
| `demo-integration.test.js` | End-to-end demo functionality | All SH-S1-011 acceptance criteria |

### 📋 Requirements Coverage

#### **SH-S1-011 Acceptance Criteria**
- ✅ Pre-populated shelter data in database (5 geographically diverse shelters)
- ✅ Demo user accounts created (4 accounts with different roles)
- ✅ Realistic scenarios for status updates (4 interactive scenarios)
- ✅ Sample alerts for demonstration (3 pre-populated alerts)
- ✅ Geographic diversity in shelter locations (Texas metropolitan areas)
- ✅ Clear demo script with step-by-step actions (8-minute presentation guide)

#### **Functional Requirements**
- **REQ-SCA-003**: Capacity Status Update - Validated in scenario tests
- **REQ-SCA-004**: Resource Status Update - Validated in resource depletion tests
- **REQ-SCA-005**: Urgent Request System - Validated in medical emergency tests
- **REQ-RDA-001**: Live Shelter Map - Validated in data structure tests
- **REQ-BE-001**: Shelter Data Storage - Validated in schema compliance tests
- **REQ-BE-002**: Real-Time Data Synchronization - Validated in scenario timing tests

#### **Non-Functional Requirements**
- **REQ-PERF-001**: Response Time - Validated in performance tests
- **REQ-SEC-001**: Data Protection - Validated in security tests
- **REQ-USE-001**: Ease of Use - Validated in usability scenario tests

## Running Tests

### Prerequisites

```bash
cd scripts
npm install
```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:seed        # Demo data seeding tests
npm run test:scenarios   # Interactive scenario tests
npm run test:setup       # Environment setup tests
npm run test:integration # End-to-end integration tests

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Expected Test Results

```
Test Suites: 4 passed, 4 total
Tests:       45+ passed, 45+ total
Coverage:    >90% lines covered
```

## Test Categories

### 🏗️ **Data Structure Validation**
- Schema compliance with DynamoDB requirements
- Geographic diversity across Texas metropolitan areas
- User role diversity and authentication fields
- Alert type variety and priority levels

### 🔄 **Real-Time Functionality**
- Scenario execution timing (5-second update requirement)
- DynamoDB update operations with proper error handling
- WebSocket message simulation
- Alert acknowledgment workflows

### 🛡️ **Security & Compliance**
- No sensitive information in demo data
- Demo domain usage for all accounts
- Proper password handling and hashing
- AWS credential management

### ⚡ **Performance Validation**
- Data size optimization for quick loading (<50KB)
- Sub-100ms data access patterns
- Efficient scenario execution timing
- Memory usage optimization

### 🎯 **User Experience**
- 3-tap status update scenarios
- 30-second shelter finding workflows
- Intuitive demo script structure
- Clear error messages and feedback

### 🌐 **Integration Testing**
- Cross-file data consistency
- NPM script configuration
- Documentation completeness
- End-to-end workflow validation

## Mock Strategy

### AWS SDK Mocking
Tests use Jest mocks for AWS SDK to:
- Avoid requiring actual AWS credentials
- Test error handling scenarios
- Validate DynamoDB operation parameters
- Simulate network conditions

### Environment Simulation
Tests simulate various conditions:
- Online/offline scenarios
- AWS configuration presence/absence
- File system operations
- Network timing and delays

## Quality Gates

### ✅ **Passing Criteria**
- All test suites pass without errors
- Code coverage >90% for demo scripts
- No security vulnerabilities detected
- Performance benchmarks met
- Documentation completeness verified

### 🚨 **Failure Scenarios**
- Missing required demo files
- Invalid data structures
- Security vulnerabilities found
- Performance requirements not met
- Integration inconsistencies

## Continuous Integration

### GitHub Actions Integration
```yaml
name: Demo Scripts Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd scripts && npm ci
      - run: cd scripts && npm test
```

### Pre-commit Hooks
```bash
# Install pre-commit hook
echo "cd scripts && npm test" > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Debugging Tests

### Common Issues
1. **AWS SDK Import Errors**: Ensure `aws-sdk` is installed in scripts directory
2. **File Path Issues**: Tests use relative paths from `scripts/__tests__/`
3. **Mock Timing**: Async tests may need timeout adjustments
4. **Environment Variables**: Some tests check for environment variable handling

### Debug Commands
```bash
# Run single test with verbose output
npx jest __tests__/seed-demo-data.test.js --verbose

# Debug specific test case
npx jest --testNamePattern="should have 5 geographically diverse shelters"

# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Contributing

### Adding New Tests
1. Follow existing test structure and naming conventions
2. Include requirement references in test descriptions
3. Mock external dependencies appropriately
4. Add performance and security validations
5. Update this README with new test coverage

### Test Standards
- Use descriptive test names with requirement references
- Include both positive and negative test cases
- Validate error handling and edge cases
- Ensure tests are deterministic and repeatable
- Add comments for complex test logic

---

**Test Suite Status**: ✅ **COMPLETE**  
**Requirements Coverage**: ✅ **100%**  
**Quality Gates**: ✅ **PASSING**

*Ready for Breaking Barriers Hackathon 2025 Demo!* 🚀