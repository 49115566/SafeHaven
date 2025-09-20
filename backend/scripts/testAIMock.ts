import fs from 'fs';

// Load real shelter data
const sheltersData = JSON.parse(fs.readFileSync('/Users/andyge/SafeHaven/backend/data/shelters.json', 'utf8'));
const testShelters = sheltersData.slice(0, 5); // Test with 5 shelters

console.log('🤖 AI Resource Prediction - Mock Response\n');

console.log('📊 INPUT SHELTERS:');
console.log('==================');
testShelters.forEach((shelter: any, index: number) => {
  const capacityPercent = Math.round((shelter.capacity.current / shelter.capacity.maximum) * 100);
  console.log(`${index + 1}. ${shelter.name}`);
  console.log(`   Capacity: ${shelter.capacity.current}/${shelter.capacity.maximum} (${capacityPercent}% full)`);
  console.log(`   Resources: Water=${shelter.resources.water}, Food=${shelter.resources.food}, Medical=${shelter.resources.medical}, Bedding=${shelter.resources.bedding}`);
  console.log(`   Status: ${shelter.status}`);
  console.log(`   Urgent Needs: ${shelter.urgentNeeds.join(', ') || 'None'}`);
  console.log('');
});

// Mock AI response based on actual shelter conditions
function generateMockPredictions(shelters: any[]) {
  return shelters.map(shelter => {
    const capacityPercent = (shelter.capacity.current / shelter.capacity.maximum) * 100;
    
    // Determine priority based on resource status and capacity
    let priority = 'low';
    let reasoning = '';
    
    const criticalResources = Object.values(shelter.resources).filter(r => r === 'critical' || r === 'unavailable').length;
    const lowResources = Object.values(shelter.resources).filter(r => r === 'low').length;
    
    if (criticalResources >= 2 || (criticalResources >= 1 && capacityPercent > 80)) {
      priority = 'critical';
      reasoning = `${criticalResources} critical resource shortages with ${Math.round(capacityPercent)}% capacity utilization`;
    } else if (criticalResources >= 1 || (lowResources >= 2 && capacityPercent > 70)) {
      priority = 'high';
      reasoning = `Critical resource shortages or high capacity with multiple low resources`;
    } else if (lowResources >= 1 || capacityPercent > 85) {
      priority = 'medium';
      reasoning = `Resource constraints or near capacity`;
    } else {
      priority = 'low';
      reasoning = `Stable resources with adequate capacity`;
    }
    
    // Calculate resource need scores (0-100)
    const getResourceScore = (status: string) => {
      switch (status) {
        case 'unavailable': return 100;
        case 'critical': return 90;
        case 'low': return 70;
        case 'adequate': return 20;
        default: return 0;
      }
    };
    
    return {
      shelterId: shelter.shelterId,
      name: shelter.name,
      priority,
      resourceNeeds: {
        water: getResourceScore(shelter.resources.water),
        food: getResourceScore(shelter.resources.food),
        medical: getResourceScore(shelter.resources.medical),
        bedding: getResourceScore(shelter.resources.bedding)
      },
      reasoning
    };
  }).sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
  });
}

const mockPredictions = generateMockPredictions(testShelters);

console.log('🎯 AI PREDICTIONS (MOCK):');
console.log('=========================');
mockPredictions.forEach((prediction, index) => {
  const priorityEmoji = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: '✅'
  };
  
  console.log(`${priorityEmoji[prediction.priority as keyof typeof priorityEmoji]} ${index + 1}. ${prediction.name}`);
  console.log(`   Priority: ${prediction.priority.toUpperCase()}`);
  console.log(`   Resource Needs (0-100 scale):`);
  console.log(`     💧 Water: ${prediction.resourceNeeds.water}`);
  console.log(`     🍽️  Food: ${prediction.resourceNeeds.food}`);
  console.log(`     🏥 Medical: ${prediction.resourceNeeds.medical}`);
  console.log(`     🛏️  Bedding: ${prediction.resourceNeeds.bedding}`);
  console.log(`   📝 Reasoning: ${prediction.reasoning}`);
  console.log('');
});

console.log('📋 JSON OUTPUT:');
console.log('===============');
console.log(JSON.stringify(mockPredictions, null, 2));