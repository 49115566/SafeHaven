// Local test without AWS - shows prompt generation only
import fs from 'fs';

interface ShelterResourceData {
  shelterId: string;
  name: string;
  capacity: { current: number; maximum: number };
  resources: {
    food: 'adequate' | 'low' | 'critical' | 'unavailable';
    water: 'adequate' | 'low' | 'critical' | 'unavailable';
    medical: 'adequate' | 'low' | 'critical' | 'unavailable';
    bedding: 'adequate' | 'low' | 'critical' | 'unavailable';
  };
  urgentNeeds: string[];
  lastUpdated: string;
}

// Import the AI service to use the enhanced prompt
import { AIService } from '../src/services/aiService';

function buildResourcePredictionPrompt(shelters: ShelterResourceData[]): string {
  // Use the private method via reflection to access enhanced prompt
  return (AIService as any).buildResourcePredictionPrompt(shelters);
}

// Load real shelter data from generated test data
const sheltersData = JSON.parse(fs.readFileSync('/Users/andyge/SafeHaven/backend/data/shelters.json', 'utf8'));

// Take first 3 shelters for testing
const testShelters = sheltersData.slice(0, 3);

console.log('🤖 AI Service Prompt Generation Test\n');

console.log('📊 INPUT SHELTER DATA:');
console.log('======================');
testShelters.forEach((shelter: any, index: number) => {
  console.log(`${index + 1}. ${shelter.name} (${shelter.shelterId})`);
  console.log(`   Location: ${shelter.location.city}, ${shelter.location.state}`);
  console.log(`   Capacity: ${shelter.capacity.current}/${shelter.capacity.maximum}`);
  console.log(`   Resources: ${JSON.stringify(shelter.resources)}`);
  console.log(`   Urgent Needs: ${shelter.urgentNeeds.join(', ') || 'None'}`);
  console.log('');
});

console.log('📝 GENERATED AI PROMPT:');
console.log('========================');
const prompt = buildResourcePredictionPrompt(testShelters);
console.log(prompt);

console.log('\n📋 EXPECTED OUTPUT FORMAT:');
console.log('===========================');
console.log(`[
  {
    "shelterId": "${testShelters[0].shelterId}",
    "name": "${testShelters[0].name}",
    "priority": "critical|high|medium|low",
    "resourceNeeds": {
      "water": 0-100,
      "food": 0-100, 
      "medical": 0-100,
      "bedding": 0-100
    },
    "reasoning": "AI analysis explanation"
  }
]`);