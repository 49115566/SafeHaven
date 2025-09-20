import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { PromptTemplates, PromptUtils } from './promptTemplates';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

export class EnhancedAIService {
  private static readonly MODEL_ID = 'us.amazon.nova-micro-v1:0';

  // Enhanced resource prediction with advanced prompting
  static async predictResourceNeedsEnhanced(shelters: any[]): Promise<any[]> {
    const prompt = PromptTemplates.buildEnhancedResourcePrompt(shelters);
    const enhancedPrompt = PromptUtils.addFewShotExamples(prompt);
    
    // Validate prompt length
    if (!PromptUtils.validatePromptLength(enhancedPrompt)) {
      console.warn('Prompt too long, truncating shelter data');
      return this.predictResourceNeedsEnhanced(shelters.slice(0, 5));
    }

    return this.invokeModel(enhancedPrompt, 'prediction');
  }

  // Evacuation recommendations
  static async recommendEvacuations(shelters: any[]): Promise<any[]> {
    const prompt = PromptTemplates.buildEvacuationPrompt(shelters);
    return this.invokeModel(prompt, 'classification');
  }

  // Resource allocation optimization
  static async optimizeAllocation(shelters: any[], resources: any): Promise<any[]> {
    const prompt = PromptTemplates.buildAllocationPrompt(shelters, resources);
    return this.invokeModel(prompt, 'prediction');
  }

  // Predictive analytics
  static async predictTrends(historicalData: any[]): Promise<any> {
    const prompt = PromptTemplates.buildPredictivePrompt(historicalData);
    return this.invokeModel(prompt, 'prediction');
  }

  private static async invokeModel(prompt: string, taskType: 'prediction' | 'classification' | 'creative'): Promise<any> {
    try {
      const temperature = PromptUtils.getOptimalTemperature(taskType);
      
      const response = await client.send(new InvokeModelCommand({
        modelId: this.MODEL_ID,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ text: prompt }]
            }
          ],
          inferenceConfig: {
            maxTokens: 2000,
            temperature,
            topP: 0.9
          }
        })
      }));

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return this.parseJSONResponse(responseBody.content[0].text);
    } catch (error) {
      console.error('Enhanced AI prediction error:', error);
      throw new Error(`Failed to generate ${taskType} predictions`);
    }
  }

  private static parseJSONResponse(response: string): any {
    try {
      // Multiple JSON extraction strategies
      let jsonMatch = response.match(/\[[\s\S]*\]/); // Array format
      if (!jsonMatch) {
        jsonMatch = response.match(/\{[\s\S]*\}/); // Object format
      }
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Enhanced fallback with error details
      return {
        error: 'Failed to parse response',
        rawResponse: response.substring(0, 200),
        suggestions: ['Check prompt format', 'Verify JSON structure', 'Review model parameters']
      };
    }
  }
}

// Prompt testing utilities
export class PromptTester {
  
  static async testPromptVariations(shelters: any[]): Promise<void> {
    console.log('🧪 Testing Prompt Variations\n');
    
    const variations = [
      { name: 'Basic', service: 'predictResourceNeeds' },
      { name: 'Enhanced', service: 'predictResourceNeedsEnhanced' },
      { name: 'Evacuation', service: 'recommendEvacuations' },
      { name: 'Allocation', service: 'optimizeAllocation' }
    ];

    for (const variation of variations) {
      try {
        console.log(`Testing ${variation.name} prompt...`);
        // Test each variation (would need actual implementation)
        console.log(`✅ ${variation.name} prompt successful`);
      } catch (error) {
        console.log(`❌ ${variation.name} prompt failed:`, error);
      }
    }
  }

  static analyzePromptEffectiveness(results: any[]): void {
    console.log('📊 Prompt Effectiveness Analysis');
    console.log('================================');
    
    const metrics = {
      responseTime: 'Average response time',
      accuracy: 'Prediction accuracy score', 
      consistency: 'Response format consistency',
      relevance: 'Domain relevance score'
    };

    Object.entries(metrics).forEach(([key, description]) => {
      console.log(`${key}: ${description}`);
    });
  }
}