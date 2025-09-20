import { ShelterService } from './services/shelterService';
import { AlertService } from './services/alertService';
import { UserService } from './services/userService';
import { UserRole, ResourceStatus, ShelterStatus, AlertType, AlertPriority } from './models/types';

async function testDatabaseConnections() {
  console.log('🧪 Testing DynamoDB connections...');
  
  try {
    // Test ShelterService
    console.log('📍 Testing ShelterService...');
    const shelterService = new ShelterService();
    
    // Test getAllShelters (should work even if empty)
    const shelters = await shelterService.getAllShelters();
    console.log(`✅ ShelterService.getAllShelters() returned ${shelters.length} shelters`);
    
    // Test UserService
    console.log('👤 Testing UserService...');
    const userService = new UserService();
    
    // Test getting all users (should work even if empty)
    const users = await userService.getAllUsers();
    console.log(`✅ UserService.getAllUsers() returned ${users.length} users`);
    
    // Test AlertService
    console.log('🚨 Testing AlertService...');
    const alertService = new AlertService();
    
    // Test getting all alerts (should work even if empty)
    const alerts = await alertService.getAllAlerts();
    console.log(`✅ AlertService.getAllAlerts() returned ${alerts.length} alerts`);
    
    console.log('🎉 All database connections are working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  testDatabaseConnections().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testDatabaseConnections };