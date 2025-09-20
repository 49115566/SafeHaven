/**
 * Basic WebSocket functionality test for SafeHaven Connect
 * Tests connection, authentication, and message broadcasting
 */

const WebSocket = require('ws');

// Test configuration
const WS_URL = 'ws://localhost:3004';
const API_URL = 'http://localhost:3003/dev';

// Mock JWT token for testing (in real scenario, get this from auth/login)
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJzaGVsdGVyX29wZXJhdG9yIiwiaWF0IjoxNjMyNzI3MjAwLCJleHAiOjk5OTk5OTk5OTl9.test';

async function testWebSocketConnection() {
  console.log('🧪 Testing WebSocket Infrastructure...\n');

  try {
    // Test 1: Connection without auth (should fail)
    console.log('Test 1: Connection without authorization');
    const ws1 = new WebSocket(WS_URL);
    
    await new Promise((resolve, reject) => {
      ws1.on('close', (code, reason) => {
        console.log(`❌ Connection closed as expected: ${code} ${reason}`);
        resolve();
      });
      
      ws1.on('error', (error) => {
        console.log(`❌ Connection failed as expected: ${error.message}`);
        resolve();
      });
      
      setTimeout(() => {
        if (ws1.readyState === WebSocket.OPEN) {
          reject(new Error('Connection should have failed without auth'));
        } else {
          resolve();
        }
      }, 2000);
    });

    // Test 2: Connection with auth token (should succeed)
    console.log('\nTest 2: Connection with authorization token');
    const ws2 = new WebSocket(`${WS_URL}?Authorization=${MOCK_JWT}`);
    
    let connectionId;
    
    await new Promise((resolve, reject) => {
      ws2.on('open', () => {
        console.log('✅ WebSocket connection established');
        resolve();
      });
      
      ws2.on('close', (code, reason) => {
        console.log(`❌ Unexpected close: ${code} ${reason}`);
        reject(new Error('Connection closed unexpectedly'));
      });
      
      ws2.on('error', (error) => {
        console.log(`❌ Connection error: ${error.message}`);
        reject(error);
      });
      
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
    });

    // Test 3: Send ping message
    console.log('\nTest 3: Sending ping message');
    await new Promise((resolve) => {
      ws2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('📨 Received message:', message);
        
        if (message.action === 'pong') {
          console.log('✅ Ping/pong successful');
          resolve();
        }
      });
      
      ws2.send(JSON.stringify({ action: 'ping' }));
    });

    // Test 4: Send shelter update message
    console.log('\nTest 4: Sending shelter update message');
    const shelterUpdate = {
      action: 'shelter_update',
      data: {
        capacity: { current: 25, maximum: 50 },
        status: 'available',
        resources: {
          food: 'adequate',
          water: 'adequate',
          medical: 'low'
        }
      }
    };
    
    ws2.send(JSON.stringify(shelterUpdate));
    console.log('✅ Shelter update sent');

    // Test 5: Send broadcast message
    console.log('\nTest 5: Sending broadcast message');
    const broadcastMessage = {
      action: 'broadcast',
      data: {
        message: 'Test broadcast from WebSocket test',
        urgency: 'low'
      },
      target: { type: 'all' }
    };
    
    ws2.send(JSON.stringify(broadcastMessage));
    console.log('✅ Broadcast message sent');

    // Clean up
    ws2.close();
    console.log('\n✅ All WebSocket tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ WebSocket test failed:', error.message);
    process.exit(1);
  }
}

// Additional REST API test
async function testHTTPEndpoints() {
  console.log('\n🌐 Testing HTTP Endpoints...\n');
  
  // Test auth endpoints are accessible
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'invalid' })
    });
    
    if (response.status === 400 || response.status === 401) {
      console.log('✅ Auth endpoint accessible (returned expected error)');
    } else {
      console.log(`⚠️  Auth endpoint returned unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Auth endpoint test failed: ${error.message}`);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 SafeHaven Connect WebSocket Infrastructure Test\n');
  console.log('='.repeat(50));
  
  await testHTTPEndpoints();
  await testWebSocketConnection();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Test suite completed!');
  process.exit(0);
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runTests().catch(console.error);