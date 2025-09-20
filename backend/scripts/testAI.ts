import { AIService } from '../src/services/aiService';
import fs from 'fs';

async function testAIService() {
  console.log('🤖 SafeHaven AI Service Test\n');
  
  try {
    // Load test data
    const testShelters = JSON.parse(fs.readFileSync('/Users/andyge/SafeHaven/backend/data/test-shelters.json', 'utf8'));
    const context = AIService.loadContext();
    
    console.log('📊 INPUT DATA:');
    console.log('==============');
    if (context) {
      console.log(`Disaster: ${context.disaster.name} (${context.disaster.severity})`);
      console.log(`Weather: ${context.weather.conditions}, ${context.weather.temperature}°F`);
      console.log(`Time: ${context.timeContext.timeOfDay}, ${context.timeContext.hoursIntoDisaster}h into disaster\n`);
    }
    
    testShelters.forEach((shelter: any, index: number) => {
      console.log(`${index + 1}. ${shelter.name}`);
      console.log(`   Capacity: ${shelter.capacity.current}/${shelter.capacity.maximum} (${Math.round(shelter.capacity.current/shelter.capacity.maximum*100)}% full)`);
      console.log(`   Resources: Water=${shelter.resources.water}, Medical=${shelter.resources.medical}, Food=${shelter.resources.food}`);
      console.log('');
    });

    console.log('🔄 Calling AI Service...\n');
    
    const predictions = await AIService.predictResourceNeeds(testShelters, context || undefined);
    
    console.log('📈 AI PREDICTIONS:');
    console.log('==================');
    predictions.forEach(prediction => {
      const priorityEmoji = {
        critical: '🚨',
        high: '⚠️',
        medium: '⚡',
        low: '✅'
      };
      
      console.log(`${priorityEmoji[prediction.priority]} ${prediction.name}`);
      console.log(`   Priority: ${prediction.priority.toUpperCase()}`);
      console.log(`   People Affected: ${prediction.peopleAffected || 'N/A'}`);
      console.log(`   Timeframe: ${prediction.estimatedTimeframe || 'N/A'}`);
      console.log(`   Risk Level: ${prediction.riskLevel || 'N/A'}`);
      console.log(`   Resource Needs: Water=${prediction.resourceNeeds.water}, Medical=${prediction.resourceNeeds.medical}`);
      if (prediction.recommendedActions?.length) {
        console.log(`   Actions: ${prediction.recommendedActions.join(', ')}`);
      }
      console.log(`   Reasoning: ${prediction.reasoning}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Note: Make sure AWS credentials are configured and Bedrock access is enabled');
  }
}

// Run the test
if (require.main === module) {
  testAIService();
}