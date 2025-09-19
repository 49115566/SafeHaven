#!/usr/bin/env node

/**
 * SafeHaven Authentication API Test Runner
 * 
 * This script simulates the Postman collection tests by directly testing
 * the authentication functions locally, demonstrating the same test scenarios
 * that would be run via Newman/Postman against a deployed API.
 */

const { register } = require('./src/functions/auth/register');
const { login } = require('./src/functions/auth/login');
const { verify } = require('./src/functions/auth/verify');

// Test data setup
const testData = {
  email: `test-${Date.now()}@safehaven.org`,
  password: 'TestPassword123!',
  weakPassword: 'weak',
  invalidEmail: 'not-an-email',
  nonExistentEmail: 'nonexistent@safehaven.org',
  shelterInfo: {
    name: `Test Shelter ${Date.now()}`,
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: "123 Test Street, Test City, TC 12345"
    },
    capacity: { maximum: 100 },
    contactInfo: {
      phone: "+15551234567",
      email: "contact@testshelter.org"
    }
  }
};

// Mock AWS Lambda event structure
const createMockEvent = (body, headers = {}) => ({
  httpMethod: 'POST',
  path: '/auth/login',
  headers: {
    'Content-Type': 'application/json',
    ...headers
  },
  body: JSON.stringify(body),
  requestContext: {
    requestId: 'test-request-id',
    requestTime: new Date().toISOString(),
    identity: {
      sourceIp: '127.0.0.1'
    }
  }
});

const createMockContext = () => ({
  requestId: 'test-request-id',
  functionName: 'test-function',
  getRemainingTimeInMillis: () => 30000
});

// Test runner functions
class PostmanTestRunner {
  constructor() {
    this.testResults = [];
    this.authToken = null;
    this.userId = null;
    this.shelterId = null;
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    try {
      const result = await testFunction();
      this.testResults.push({ name: testName, status: 'PASS', result });
      console.log(`✅ PASS: ${testName}`);
      return result;
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      console.log(`❌ FAIL: ${testName} - ${error.message}`);
      throw error;
    }
  }

  // Test 01: Register Shelter Operator
  async test01_registerShelterOperator() {
    return this.runTest('01 - Register Shelter Operator', async () => {
      const event = createMockEvent({
        email: testData.email,
        password: testData.password,
        role: 'shelter_operator',
        profile: {
          firstName: 'Test',
          lastName: 'Operator',
          phone: '+15551234567',
          organization: 'Test Emergency Shelter'
        },
        shelterInfo: testData.shelterInfo
      });

      const result = await register.handler(event, createMockContext());
      const response = JSON.parse(result.body);

      // Assertions
      if (result.statusCode !== 201) {
        throw new Error(`Expected status 201, got ${result.statusCode}`);
      }
      if (!response.success) {
        throw new Error('Registration should be successful');
      }
      if (response.data.user.email !== testData.email) {
        throw new Error('Email should match');
      }
      if (response.data.user.role !== 'shelter_operator') {
        throw new Error('Role should be shelter_operator');
      }
      if (!response.data.token) {
        throw new Error('JWT token should be provided');
      }

      // Store for subsequent tests
      this.authToken = response.data.token;
      this.userId = response.data.user.userId;
      this.shelterId = response.data.user.shelterId;

      return response;
    });
  }

  // Test 02: Register Duplicate User (Should Fail)
  async test02_registerDuplicate() {
    return this.runTest('02 - Register Duplicate User (Should Fail)', async () => {
      const event = createMockEvent({
        email: testData.email, // Same email as before
        password: testData.password,
        role: 'shelter_operator',
        profile: {
          firstName: 'Duplicate',
          lastName: 'User'
        },
        shelterInfo: {
          name: 'Duplicate Shelter',
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Duplicate St, NY, NY'
          },
          capacity: { maximum: 50 },
          contactInfo: {
            phone: '+15559999999',
            email: 'duplicate@test.org'
          }
        }
      });

      const result = await register.handler(event, createMockContext());
      const response = JSON.parse(result.body);

      // Should fail with 400 status
      if (result.statusCode !== 400) {
        throw new Error(`Expected status 400, got ${result.statusCode}`);
      }
      if (response.success !== false) {
        throw new Error('Duplicate registration should fail');
      }
      if (!response.error.message.includes('already exists')) {
        throw new Error('Error message should indicate user already exists');
      }

      return response;
    });
  }

  // Test 03: Login with Valid Credentials
  async test03_loginValid() {
    return this.runTest('03 - Login with Valid Credentials', async () => {
      const event = createMockEvent({
        email: testData.email,
        password: testData.password
      });

      const result = await login.handler(event, createMockContext());
      const response = JSON.parse(result.body);

      // Assertions
      if (result.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${result.statusCode}`);
      }
      if (!response.success) {
        throw new Error('Login should be successful');
      }
      if (response.data.user.email !== testData.email) {
        throw new Error('Email should match');
      }
      if (!response.data.token) {
        throw new Error('JWT token should be provided');
      }

      // Update token for subsequent tests
      this.authToken = response.data.token;

      return response;
    });
  }

  // Test 04: Login with Invalid Password
  async test04_loginInvalidPassword() {
    return this.runTest('04 - Login with Invalid Password', async () => {
      const event = createMockEvent({
        email: testData.email,
        password: 'WrongPassword123!'
      });

      const result = await login.handler(event, createMockContext());
      const response = JSON.parse(result.body);

      // Should fail with 401 status
      if (result.statusCode !== 401) {
        throw new Error(`Expected status 401, got ${result.statusCode}`);
      }
      if (response.success !== false) {
        throw new Error('Invalid login should fail');
      }
      if (response.error.message !== 'Invalid email or password') {
        throw new Error('Error message should be generic for security');
      }

      return response;
    });
  }

  // Test 05: Login with Invalid Email
  async test05_loginInvalidEmail() {
    return this.runTest('05 - Login with Invalid Email', async () => {
      const event = createMockEvent({
        email: testData.nonExistentEmail,
        password: testData.password
      });

      const result = await login.handler(event, createMockContext());
      const response = JSON.parse(result.body);

      // Should fail with 401 status
      if (result.statusCode !== 401) {
        throw new Error(`Expected status 401, got ${result.statusCode}`);
      }
      if (response.success !== false) {
        throw new Error('Invalid email login should fail');
      }
      if (response.error.message !== 'Invalid email or password') {
        throw new Error('Error message should be generic for security');
      }

      return response;
    });
  }

  // Test 06: JWT Token Verification
  async test06_jwtVerification() {
    return this.runTest('06 - JWT Token Verification', async () => {
      const event = {
        authorizationToken: `Bearer ${this.authToken}`,
        methodArn: 'arn:aws:execute-api:us-east-2:123456789012:abcdef123/test/GET/shelters'
      };

      const result = await verify.handler(event, createMockContext());

      // Should succeed with proper policy
      if (result.principalId !== this.userId) {
        throw new Error('Principal ID should match user ID');
      }
      if (result.policyDocument.Statement[0].Effect !== 'Allow') {
        throw new Error('Policy should allow access');
      }

      return result;
    });
  }

  // Test 07: Invalid JWT Token
  async test07_invalidJWT() {
    return this.runTest('07 - Invalid JWT Token Verification', async () => {
      const event = {
        authorizationToken: 'Bearer invalid.jwt.token',
        methodArn: 'arn:aws:execute-api:us-east-2:123456789012:abcdef123/test/GET/shelters'
      };

      try {
        await verify.handler(event, createMockContext());
        throw new Error('Invalid token should fail');
      } catch (error) {
        if (error.message !== 'Unauthorized') {
          throw new Error(`Expected 'Unauthorized' error, got: ${error.message}`);
        }
        return { error: 'Unauthorized' };
      }
    });
  }

  // Test 08: Register with Weak Password
  async test08_weakPassword() {
    return this.runTest('08 - Register with Weak Password', async () => {
      const event = createMockEvent({
        email: 'weak@test.org',
        password: testData.weakPassword,
        role: 'shelter_operator',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        shelterInfo: testData.shelterInfo
      });

      const result = await register.handler(event, createMockContext());
      const response = JSON.parse(result.body);

      // Should fail with 400 status
      if (result.statusCode !== 400) {
        throw new Error(`Expected status 400, got ${result.statusCode}`);
      }
      if (response.success !== false) {
        throw new Error('Weak password should be rejected');
      }
      if (!response.error.message.includes('Validation failed')) {
        throw new Error('Should be a validation error');
      }

      return response;
    });
  }

  // Test 09: Register with Invalid Email
  async test09_invalidEmailFormat() {
    return this.runTest('09 - Register with Invalid Email Format', async () => {
      const event = createMockEvent({
        email: testData.invalidEmail,
        password: 'ValidPassword123!',
        role: 'shelter_operator',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        shelterInfo: testData.shelterInfo
      });

      const result = await register.handler(event, createMockContext());
      const response = JSON.parse(result.body);

      // Should fail with 400 status
      if (result.statusCode !== 400) {
        throw new Error(`Expected status 400, got ${result.statusCode}`);
      }
      if (response.success !== false) {
        throw new Error('Invalid email should be rejected');
      }

      return response;
    });
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting SafeHaven Authentication API Tests (Postman Collection Simulation)');
    console.log('=' .repeat(80));

    try {
      await this.test01_registerShelterOperator();
      await this.test02_registerDuplicate();
      await this.test03_loginValid();
      await this.test04_loginInvalidPassword();
      await this.test05_loginInvalidEmail();
      await this.test06_jwtVerification();
      await this.test07_invalidJWT();
      await this.test08_weakPassword();
      await this.test09_invalidEmailFormat();

      // Print summary
      console.log('\n' + '=' .repeat(80));
      console.log('📊 TEST SUMMARY');
      console.log('=' .repeat(80));

      const passed = this.testResults.filter(t => t.status === 'PASS').length;
      const failed = this.testResults.filter(t => t.status === 'FAIL').length;

      console.log(`✅ Tests Passed: ${passed}`);
      console.log(`❌ Tests Failed: ${failed}`);
      console.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);

      if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Authentication service is working correctly.');
        console.log('\n📝 Note: This simulation tests the same scenarios that would be');
        console.log('   executed by the Postman collection against a deployed API.');
      } else {
        console.log('\n⚠️  Some tests failed. Check the output above for details.');
      }

    } catch (error) {
      console.error('\n💥 Test execution failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the tests
if (require.main === module) {
  const runner = new PostmanTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = PostmanTestRunner;