import fs from 'fs';
import { PromptTemplates } from '../src/services/promptTemplates';

// Load real shelter data
const sheltersData = JSON.parse(fs.readFileSync('/Users/andyge/SafeHaven/backend/data/shelters.json', 'utf8'));
const testShelters = sheltersData.slice(0, 3);

console.log('🔥 ENHANCED PROMPT DEMONSTRATION\n');

console.log('📊 INPUT DATA:');
console.log('==============');
testShelters.forEach((shelter: any, index: number) => {
  console.log(`${index + 1}. ${shelter.name} (${shelter.shelterId})`);
  console.log(`   Capacity: ${shelter.capacity.current}/${shelter.capacity.maximum} (${Math.round(shelter.capacity.current/shelter.capacity.maximum*100)}% full)`);
  console.log(`   Resources: Water=${shelter.resources.water}, Food=${shelter.resources.food}, Medical=${shelter.resources.medical}, Bedding=${shelter.resources.bedding}`);
  console.log(`   Urgent Needs: ${shelter.urgentNeeds.join(', ') || 'None'}`);
  console.log('');
});

console.log('🚀 ENHANCED PROMPT:');
console.log('===================');
const enhancedPrompt = PromptTemplates.buildEnhancedResourcePrompt(testShelters);
console.log(enhancedPrompt);

console.log('\n📏 PROMPT COMPARISON:');
console.log('====================');

const basicPrompt = `Analyze these shelters and return JSON priorities:
${testShelters.map((s: any) => `${s.name}: ${s.capacity.current}/${s.capacity.maximum}`).join('\n')}`;

console.log(`Basic Prompt Length: ${basicPrompt.length} characters`);
console.log(`Enhanced Prompt Length: ${enhancedPrompt.length} characters`);
console.log(`Enhancement Factor: ${Math.round(enhancedPrompt.length / basicPrompt.length)}x longer`);

console.log('\n🎯 KEY ENHANCEMENTS:');
console.log('===================');
console.log('✅ Expert role definition ("10+ years disaster response experience")');
console.log('✅ Specific context ("Dallas emergency response during active disaster")');
console.log('✅ Detailed analysis framework (4-tier priority system)');
console.log('✅ Scoring methodology (survival timelines for each resource)');
console.log('✅ Few-shot example (input→output demonstration)');
console.log('✅ Enhanced output format (reasoning, timeframe, risk level)');
console.log('✅ Strict JSON enforcement ("Respond with JSON only")');

console.log('\n🔍 WHAT MAKES IT BETTER:');
console.log('========================');
console.log('• Domain expertise context improves decision quality');
console.log('• Structured framework ensures consistent analysis');
console.log('• Examples show AI exactly what format to follow');
console.log('• Risk-based scoring aligns with emergency priorities');
console.log('• Enhanced output provides actionable insights');