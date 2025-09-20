import fs from 'fs';
import { PromptTemplates, PromptUtils } from '../src/services/promptTemplates';

// Load test data
const sheltersData = JSON.parse(fs.readFileSync('/Users/andyge/SafeHaven/backend/data/shelters.json', 'utf8'));

console.log('🧪 Prompt Engineering Test Suite\n');

// Test 1: Basic vs Enhanced Prompts
console.log('1️⃣ BASIC PROMPT:');
console.log('================');
const basicPrompt = `Analyze these shelters and prioritize them:
${sheltersData.slice(0, 2).map((s: any) => `${s.name}: ${s.capacity.current}/${s.capacity.maximum}`).join('\n')}

Return JSON with priorities.`;

console.log(basicPrompt);
console.log(`\nLength: ${basicPrompt.length} chars\nEstimated tokens: ${Math.round(basicPrompt.length / 4)}\n`);

console.log('2️⃣ ENHANCED PROMPT:');
console.log('===================');
const enhancedPrompt = PromptTemplates.buildEnhancedResourcePrompt(sheltersData.slice(0, 2));
console.log(enhancedPrompt.substring(0, 500) + '...[truncated]');
console.log(`\nLength: ${enhancedPrompt.length} chars\nEstimated tokens: ${Math.round(enhancedPrompt.length / 4)}\n`);

// Test 2: Few-Shot Examples
console.log('3️⃣ FEW-SHOT ENHANCEMENT:');
console.log('========================');
const fewShotPrompt = PromptUtils.addFewShotExamples(basicPrompt);
console.log('Added examples for better AI understanding\n');

// Test 3: Temperature Analysis
console.log('4️⃣ TEMPERATURE OPTIMIZATION:');
console.log('============================');
console.log(`Prediction tasks: ${PromptUtils.getOptimalTemperature('prediction')} (deterministic)`);
console.log(`Classification tasks: ${PromptUtils.getOptimalTemperature('classification')} (balanced)`);
console.log(`Creative tasks: ${PromptUtils.getOptimalTemperature('creative')} (creative)\n`);

// Test 4: Prompt Length Validation
console.log('5️⃣ PROMPT LENGTH VALIDATION:');
console.log('============================');
const testPrompts = [basicPrompt, enhancedPrompt, fewShotPrompt];
testPrompts.forEach((prompt, index) => {
  const isValid = PromptUtils.validatePromptLength(prompt);
  console.log(`Prompt ${index + 1}: ${isValid ? '✅ Valid' : '❌ Too long'} (${prompt.length} chars)`);
});

// Test 5: Edge Case Scenarios
console.log('\n6️⃣ EDGE CASE SCENARIOS:');
console.log('=======================');

const edgeCases = [
  {
    name: 'All Critical Resources',
    shelter: {
      name: 'Crisis Shelter',
      capacity: { current: 200, maximum: 200 },
      resources: { water: 'unavailable', food: 'critical', medical: 'unavailable', bedding: 'critical' },
      urgentNeeds: ['immediate evacuation']
    }
  },
  {
    name: 'Empty Shelter',
    shelter: {
      name: 'Empty Shelter', 
      capacity: { current: 0, maximum: 500 },
      resources: { water: 'adequate', food: 'adequate', medical: 'adequate', bedding: 'adequate' },
      urgentNeeds: []
    }
  }
];

edgeCases.forEach(testCase => {
  console.log(`\n${testCase.name}:`);
  console.log(`Expected AI Response: ${testCase.name === 'All Critical Resources' ? 'CRITICAL priority, immediate evacuation' : 'LOW priority, available for intake'}`);
});

console.log('\n7️⃣ PROMPT IMPROVEMENT RECOMMENDATIONS:');
console.log('=====================================');
console.log('✅ Use domain-specific terminology (FirstNet, FEMA, etc.)');
console.log('✅ Include few-shot examples for consistency');
console.log('✅ Set appropriate temperature for task type');
console.log('✅ Validate prompt length before sending');
console.log('✅ Test with edge cases and extreme scenarios');
console.log('✅ Monitor response quality and adjust accordingly');

console.log('\n🎯 NEXT STEPS:');
console.log('==============');
console.log('1. A/B test basic vs enhanced prompts');
console.log('2. Measure response accuracy and consistency');
console.log('3. Optimize temperature settings per use case');
console.log('4. Create prompt templates for different scenarios');
console.log('5. Implement automated prompt testing pipeline');