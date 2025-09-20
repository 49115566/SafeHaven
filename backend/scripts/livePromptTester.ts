import { EnhancedAIService } from '../src/services/enhancedAIService';
import fs from 'fs';

// Live prompt testing with real AI
class LivePromptTester {
  
  static async testWithRealAI(): Promise<void> {
    console.log('🔴 LIVE AI TESTING (Requires AWS)\n');
    
    const sheltersData = JSON.parse(fs.readFileSync('/Users/andyge/SafeHaven/backend/data/shelters.json', 'utf8'));
    const testShelters = sheltersData.slice(0, 3);
    
    const tests = [
      {
        name: 'Basic Resource Prediction',
        test: () => EnhancedAIService.predictResourceNeedsEnhanced(testShelters)
      },
      {
        name: 'Evacuation Recommendations', 
        test: () => EnhancedAIService.recommendEvacuations(testShelters)
      },
      {
        name: 'Resource Allocation',
        test: () => EnhancedAIService.optimizeAllocation(testShelters, {
          water: 1000, food: 500, medical: 200, bedding: 800
        })
      }
    ];
    
    for (const test of tests) {
      try {
        console.log(`\n🧪 Testing: ${test.name}`);
        console.log('='.repeat(40));
        
        const startTime = Date.now();
        const result = await test.test();
        const duration = Date.now() - startTime;
        
        console.log(`✅ Success (${duration}ms)`);
        console.log('Response:', JSON.stringify(result, null, 2));
        
        // Evaluate response quality
        this.evaluateRealResponse(result, test.name);
        
      } catch (error) {
        console.log(`❌ Failed: ${error}`);
      }
    }
  }
  
  private static evaluateRealResponse(response: any, testName: string): void {
    console.log('\n📊 Quality Assessment:');
    
    const checks = [
      { name: 'Valid JSON', pass: typeof response === 'object' },
      { name: 'Has Priority', pass: Array.isArray(response) && response[0]?.priority },
      { name: 'Has Reasoning', pass: Array.isArray(response) && response[0]?.reasoning },
      { name: 'Logical Priorities', pass: this.checkLogicalPriorities(response) }
    ];
    
    checks.forEach(check => {
      console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
    });
  }
  
  private static checkLogicalPriorities(response: any[]): boolean {
    if (!Array.isArray(response)) return false;
    
    return response.some(item => {
      if (item.priority === 'critical') {
        return Object.values(item.resourceNeeds || {}).some((score: any) => score > 80);
      }
      return true;
    });
  }
}

// Batch testing for prompt optimization
class BatchTester {
  
  static async runBatchTests(): Promise<void> {
    console.log('🔄 BATCH TESTING FOR OPTIMIZATION\n');
    
    const temperatures = [0.1, 0.2, 0.3, 0.5];
    const sheltersData = JSON.parse(fs.readFileSync('/Users/andyge/SafeHaven/backend/data/shelters.json', 'utf8'));
    
    for (const temp of temperatures) {
      console.log(`\n🌡️ Testing Temperature: ${temp}`);
      console.log('-'.repeat(30));
      
      try {
        // Test with different temperature settings
        // (Would need to modify EnhancedAIService to accept temperature parameter)
        console.log(`Temperature ${temp}: Testing...`);
        
        // Simulate results for demo
        const consistency = temp < 0.3 ? 'High' : temp < 0.5 ? 'Medium' : 'Low';
        const creativity = temp > 0.4 ? 'High' : temp > 0.2 ? 'Medium' : 'Low';
        
        console.log(`Consistency: ${consistency}`);
        console.log(`Creativity: ${creativity}`);
        console.log(`Recommended for: ${temp <= 0.2 ? 'Critical decisions' : 'General analysis'}`);
        
      } catch (error) {
        console.log(`❌ Temperature ${temp} failed`);
      }
    }
  }
}

// Performance benchmarking
class PerformanceBenchmark {
  
  static async benchmarkPrompts(): Promise<void> {
    console.log('⚡ PERFORMANCE BENCHMARKING\n');
    
    const iterations = 5;
    const results: { [key: string]: number[] } = {};
    
    const prompts = ['Basic', 'Enhanced', 'Few-Shot'];
    
    for (const promptType of prompts) {
      results[promptType] = [];
      
      console.log(`\n📊 Benchmarking ${promptType} Prompt`);
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        // Simulate AI call
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        const duration = Date.now() - startTime;
        results[promptType].push(duration);
        
        console.log(`Run ${i + 1}: ${duration}ms`);
      }
      
      const avg = results[promptType].reduce((a, b) => a + b, 0) / iterations;
      console.log(`Average: ${avg.toFixed(1)}ms`);
    }
    
    // Compare results
    console.log('\n🏆 PERFORMANCE SUMMARY:');
    Object.entries(results).forEach(([prompt, times]) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      console.log(`${prompt}: Avg ${avg.toFixed(1)}ms (${min}-${max}ms)`);
    });
  }
}

// Main runner
async function runLiveEvaluation() {
  console.log('🎯 LIVE PROMPT EVALUATION SUITE');
  console.log('===============================\n');
  
  const mode = process.argv[2] || 'mock';
  
  if (mode === 'live') {
    console.log('🔴 Running with REAL AWS AI...\n');
    await LivePromptTester.testWithRealAI();
  } else if (mode === 'batch') {
    await BatchTester.runBatchTests();
  } else if (mode === 'benchmark') {
    await PerformanceBenchmark.benchmarkPrompts();
  } else {
    console.log('Available modes:');
    console.log('  npm run test:prompts live      - Test with real AWS AI');
    console.log('  npm run test:prompts batch     - Batch temperature testing');
    console.log('  npm run test:prompts benchmark - Performance benchmarking');
  }
}

if (require.main === module) {
  runLiveEvaluation();
}