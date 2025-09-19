# SafeHaven Authentication API - Postman Testing

This directory contains comprehensive Postman collections for testing the SafeHaven Connect authentication service.

## Files

- `SafeHaven_Authentication_Tests.postman_collection.json` - Complete test collection with 11 test scenarios
- `SafeHaven_Authentication.postman_environment.json` - Environment variables and configuration
- `README.md` - This file with setup and usage instructions

## Test Coverage

The Postman collection provides comprehensive testing for all authentication endpoints:

### Authentication Tests (5 scenarios)
1. **Register Shelter Operator** - Complete registration flow with shelter creation
2. **Register Duplicate User** - Validates duplicate email prevention
3. **Login with Valid Credentials** - Successful authentication and JWT issuance
4. **Login with Invalid Password** - Security validation for wrong passwords
5. **Login with Invalid Email** - Security validation for non-existent users

### Authorization Tests (3 scenarios)
6. **Access Protected Endpoint with Valid Token** - JWT verification middleware
7. **Access Protected Endpoint without Token** - Unauthorized access prevention
8. **Access Protected Endpoint with Invalid Token** - Invalid JWT rejection

### Validation Tests (2 scenarios)
9. **Register with Weak Password** - Password strength requirements
10. **Register with Invalid Email** - Email format validation

### Rate Limiting Tests (1 scenario)
11. **Test Rate Limiting** - Multiple failed login attempts to trigger rate limiting

## Setup Instructions

### 1. Import to Postman

1. Open Postman Desktop or Web App
2. Click **Import** button
3. Select **Files** tab
4. Import both JSON files:
   - `SafeHaven_Authentication_Tests.postman_collection.json`
   - `SafeHaven_Authentication.postman_environment.json`

### 2. Configure Environment

1. Select the **SafeHaven Authentication Environment** from the environment dropdown
2. Update the `base_url` variable with your actual API Gateway URL:
   ```
   https://your-api-gateway-id.execute-api.us-east-2.amazonaws.com/dev
   ```

### 3. Deploy Your Backend

Ensure your SafeHaven backend is deployed to AWS:

```bash
cd backend
npm install
npx serverless deploy
```

Copy the API Gateway URL from the deployment output and update the Postman environment.

## Running Tests

### Option 1: Run Individual Tests
- Open the collection in Postman
- Select any test request
- Click **Send** to execute
- View test results in the **Test Results** tab

### Option 2: Run Collection (Recommended)
1. Right-click on the **SafeHaven Authentication API** collection
2. Select **Run collection**
3. Choose **SafeHaven Authentication Environment**
4. Click **Run SafeHaven Authentication API**
5. View comprehensive test results with pass/fail status

### Option 3: Command Line (Newman)
```bash
# Install Newman if not already installed
npm install -g newman

# Run the collection
newman run SafeHaven_Authentication_Tests.postman_collection.json \
  -e SafeHaven_Authentication.postman_environment.json \
  --globals base_url=https://your-api-gateway-url.execute-api.us-east-2.amazonaws.com/dev
```

## Test Features

### Automatic Data Generation
- **Dynamic test data**: Email addresses and shelter names auto-generated with timestamps
- **Random coordinates**: Shelter locations randomly generated within valid ranges
- **Token management**: JWT tokens automatically extracted and used in subsequent requests

### Comprehensive Assertions
- **Status code validation**: All responses checked for correct HTTP status
- **Response structure**: JSON structure validation for all endpoints
- **Security checks**: Password exposure prevention, token format validation
- **Business logic**: User data consistency, shelter creation verification

### Rate Limiting Validation
- **Progressive testing**: Automatically makes multiple failed login attempts
- **Rate limit detection**: Stops when 429 status received
- **Reset time validation**: Checks for proper rate limit reset information

## Expected Results

When all tests pass, you should see:

```
✅ Registration successful
✅ Response has correct structure  
✅ User data is correct
✅ JWT token is valid format
✅ Password not exposed in response
✅ Duplicate registration rejected
✅ Error message is appropriate
✅ Login successful
✅ User data matches registration
✅ New JWT token issued
✅ Invalid login rejected
✅ Error message is secure
✅ Protected endpoint accessible with valid token
✅ Unauthorized access rejected
✅ Invalid token rejected
✅ Weak password rejected
✅ Validation error message provided
✅ Invalid email rejected
✅ Email validation error provided
✅ Rate limiting applied after multiple attempts
✅ Rate limit error message provided
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Check that your backend is deployed and the base_url is correct
2. **401 Unauthorized**: Verify JWT implementation and token format
3. **500 Internal Server Error**: Check CloudWatch logs for Lambda function errors
4. **Rate limiting not working**: Ensure Redis/DynamoDB rate limiting store is configured

### Debug Tips

1. **Enable Postman Console**: View → Show Postman Console to see detailed request/response logs
2. **Check AWS CloudWatch**: Monitor Lambda function logs for backend errors
3. **Verify DynamoDB tables**: Ensure Users and Shelters tables are created and accessible
4. **Test individual endpoints**: Start with registration, then login, then protected endpoints

## Security Considerations

This test collection validates key security features:

- **Password hashing**: Ensures passwords are never returned in responses
- **JWT security**: Validates token format and expiration
- **Input validation**: Tests against SQL injection and XSS attempts
- **Rate limiting**: Prevents brute force attacks
- **Authorization**: Ensures protected endpoints require valid tokens

## Integration with CI/CD

To integrate with automated testing pipelines:

```yaml
# Example GitHub Actions step
- name: Run API Tests
  run: |
    newman run backend/postman/SafeHaven_Authentication_Tests.postman_collection.json \
      -e backend/postman/SafeHaven_Authentication.postman_environment.json \
      --globals base_url=${{ secrets.API_GATEWAY_URL }} \
      --reporters cli,json \
      --reporter-json-export test-results.json
```

## Support

For issues with the Postman collection:
1. Check the test assertions in each request
2. Verify environment variables are set correctly  
3. Ensure backend services are deployed and accessible
4. Review AWS CloudWatch logs for detailed error information

The collection is designed to be self-documenting with detailed test descriptions and error messages to help diagnose any issues.