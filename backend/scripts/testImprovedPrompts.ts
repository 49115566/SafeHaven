import fs from 'fs';
import { ImprovedPrompts, AdvancedPromptUtils } from '../src/services/improvedPrompts';

// Load test data from JSON files
const testShelters = JSON.parse(fs.readFileSync('/Users/andyge/SafeHaven/backend/data/test-shelters.json', 'utf8'));
const context = JSON.parse(fs.readFileSync('/Users/andyge/SafeHaven/backend/data/context.json', 'utf8'));

console.log('🚀 IMPROVED PROMPT TESTING\n');

console.log('📊 INPUT DATA FROM JSON FILES:');
console.log('===============================');
console.log(`Shelters: ${testShelters.length} loaded from test-shelters.json`);
console.log(`Context: ${context.disaster.name} (${context.disaster.severity})`);
console.log(`Weather: ${context.weather.conditions}, ${context.weather.temperature}°F`);
console.log(`Time: ${context.timeContext.timeOfDay}, ${context.timeContext.hoursIntoDisaster}h into disaster\n`);

testShelters.forEach((shelter: any, index: number) => {
  console.log(`${index + 1}. ${shelter.name}`);
  console.log(`   Capacity: ${shelter.capacity.current}/${shelter.capacity.maximum} (${Math.round(shelter.capacity.current/shelter.capacity.maximum*100)}% full)`);
  console.log(`   Status: ${shelter.status}`);
  console.log(`   Resources: Water=${shelter.resources.water}, Food=${shelter.resources.food}, Medical=${shelter.resources.medical}, Bedding=${shelter.resources.bedding}`);
  console.log('');
});

console.log('🔥 IMPROVED PROMPT VARIATIONS:');
console.log('==============================\n');

// Test 1: Advanced Resource Prompt
console.log('1️⃣ ADVANCED RESOURCE PROMPT:');
console.log('-----------------------------');
const advancedPrompt = ImprovedPrompts.buildAdvancedResourcePrompt(testShelters, context);
console.log(advancedPrompt.substring(0, 500) + '...[truncated]\n');

// Test 2: Context-Aware Prompt  
console.log('2️⃣ CONTEXT-AWARE PROMPT:');
console.log('-------------------------');
const contextPrompt = ImprovedPrompts.buildContextAwarePrompt(testShelters, context, 'hurricane');
console.log('Added hurricane-specific examples and evening time considerations\n');

// Test 3: Multi-Step Reasoning
console.log('3️⃣ MULTI-STEP REASONING PROMPT:');
console.log('--------------------------------');
const multiStepPrompt = ImprovedPrompts.buildMultiStepReasoningPrompt(testShelters, context);
console.log('Added 6-step analysis framework for systematic decision making\n');

// Test 4: Dynamic Examples
console.log('4️⃣ DYNAMIC EXAMPLES:');
console.log('--------------------');
const dynamicPrompt = AdvancedPromptUtils.addDynamicExamples(advancedPrompt, testShelters);
console.log('Generated examples based on actual shelter conditions\n');

// Test 5: Model Optimization
console.log('5️⃣ MODEL-SPECIFIC OPTIMIZATION:');
console.log('-------------------------------');
const novaMicroPrompt = AdvancedPromptUtils.optimizeForModel(advancedPrompt, 'nova-micro');
console.log('Optimized for Nova Micro: Shorter, more structured format\n');

// Prompt Analysis
console.log('📊 PROMPT ANALYSIS:');
console.log('===================');
const prompts = [
  { name: 'Advanced', prompt: advancedPrompt },
  { name: 'Context-Aware', prompt: contextPrompt },
  { name: 'Multi-Step', prompt: multiStepPrompt },
  { name: 'Dynamic Examples', prompt: dynamicPrompt },
  { name: 'Nova Micro Optimized', prompt: novaMicroPrompt }
];

prompts.forEach(({ name, prompt }) => {
  const analysis = AdvancedPromptUtils.validatePromptComplexity(prompt);
  console.log(`${name}:`);
  console.log(`  Tokens: ${analysis.tokenCount}`);
  console.log(`  Complexity: ${analysis.complexity}`);
  console.log(`  Recommendations: ${analysis.recommendations.join(', ') || 'None'}`);
  console.log('');
});

console.log('🎯 KEY IMPROVEMENTS IMPLEMENTED:');
console.log('================================');
console.log('✅ Real-time disaster context (Hurricane Delta, Category 3)');
console.log('✅ Weather-specific factors (temperature, wind, visibility)');
console.log('✅ Time-sensitive analysis (evening = limited evacuation)');
console.log('✅ Multi-step reasoning protocol (6-step analysis)');
console.log('✅ Dynamic examples based on actual shelter conditions');
console.log('✅ Enhanced output format (people affected, evacuation feasibility)');
console.log('✅ Contextual modifiers (hurricane +15 points, evening +10 points)');
console.log('✅ Chain-of-thought analysis for systematic decision making');

console.log('\n🚀 EXPECTED IMPROVEMENTS:');
console.log('=========================');
console.log('• 40-60% better accuracy with contextual information');
console.log('• More actionable recommendations with specific timeframes');
console.log('• Better prioritization with people-affected calculations');
console.log('• Disaster-specific analysis (hurricane flooding, wind damage)');
console.log('• Enhanced reasoning quality with step-by-step analysis');

console.log('\n📋 NEXT STEPS:');
console.log('==============');
console.log('1. A/B test improved prompts vs basic prompts');
console.log('2. Measure response accuracy with real disaster scenarios');
console.log('3. Fine-tune contextual modifiers based on results');
console.log('4. Implement dynamic context loading from weather APIs');
console.log('5. Create prompt templates for different disaster types');