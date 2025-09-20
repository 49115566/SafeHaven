import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import fs from 'fs';
import path from 'path';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

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
  location?: { address: string };
  status?: string;
}

interface ResourcePrediction {
  shelterId: string;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  resourceNeeds: {
    water: number;
    food: number;
    medical: number;
    bedding: number;
  };
  reasoning: string;
  estimatedTimeframe?: 'immediate' | '2-6hours' | '6-24hours' | '24-48hours';
  riskLevel?: 'life-threatening' | 'health-risk' | 'comfort-degradation' | 'stable';
  peopleAffected?: number;
  recommendedActions?: string[];
  evacuationFeasibility?: 'immediate' | 'weather-dependent' | 'not-recommended';
  resourcePriority?: number;
}

interface DisasterContext {
  disaster: {
    type: string;
    name: string;
    severity: string;
    primaryThreats: string[];
  };
  weather: {
    temperature: number;
    conditions: string;
    windSpeed: number;
  };
  timeContext: {
    timeOfDay: string;
    hoursIntoDisaster: number;
  };
  resources: {
    availableSupplies: {
      water: number;
      food: number;
      medical: number;
      bedding: number;
    };
    transportCapacity: {
      ambulances: number;
      buses: number;
    };
  };
}

export class AIService {
  private static readonly MODEL_ID = 'us.amazon.nova-micro-v1:0';

  // Main prediction method with context
  static async predictResourceNeeds(shelters: ShelterResourceData[], context?: DisasterContext): Promise<ResourcePrediction[]> {
    const prompt = context 
      ? this.buildAdvancedPrompt(shelters, context)
      : this.buildBasicPrompt(shelters);
    
    try {
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
            temperature: 0.1
          }
        })
      }));

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return this.parseResourcePredictions(responseBody.content[0].text);
    } catch (error) {
      console.error('AI prediction error:', error);
      throw new Error('Failed to generate resource predictions');
    }
  }

  // Load context from file
  static loadContext(): DisasterContext | null {
    try {
      const contextPath = path.join(__dirname, '../../data/context.json');
      if (fs.existsSync(contextPath)) {
        return JSON.parse(fs.readFileSync(contextPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load context file, using basic prompt');
    }
    return null;
  }

  // Advanced prompt with disaster context
  private static buildAdvancedPrompt(shelters: ShelterResourceData[], context: DisasterContext): string {
    const shelterData = shelters.map(s => 
      `Shelter: ${s.name} (ID: ${s.shelterId})
${s.location ? `Location: ${s.location.address}` : ''}
Capacity: ${s.capacity.current}/${s.capacity.maximum} (${Math.round(s.capacity.current/s.capacity.maximum*100)}% full)
${s.status ? `Status: ${s.status}` : ''}
Resources: Water=${s.resources.water}, Food=${s.resources.food}, Medical=${s.resources.medical}, Bedding=${s.resources.bedding}
Urgent Needs: ${s.urgentNeeds.join(', ') || 'None'}
Last Updated: ${s.lastUpdated}`
    ).join('\n\n');

    return `You are FEMA's lead AI emergency coordinator with specialized training in ${context.disaster.type} response. You have real-time access to FirstNet priority communications and 15+ years of disaster response data.

MISSION: Optimize life-saving resource allocation during ${context.disaster.name} (${context.disaster.severity}) in Dallas, TX.

CURRENT SITUATION:
- Disaster: ${context.disaster.name} (${context.disaster.severity})
- Duration: ${context.timeContext.hoursIntoDisaster} hours into event
- Weather: ${context.weather.conditions}, ${context.weather.temperature}°F, winds ${context.weather.windSpeed}mph
- Time: ${context.timeContext.timeOfDay} (affects evacuation/transport options)
- Primary Threats: ${context.disaster.primaryThreats.join(', ')}

AVAILABLE RESOURCES:
- Water: ${context.resources.availableSupplies.water} units
- Food: ${context.resources.availableSupplies.food} units  
- Medical: ${context.resources.availableSupplies.medical} units
- Bedding: ${context.resources.availableSupplies.bedding} units
- Transport: ${context.resources.transportCapacity.ambulances} ambulances, ${context.resources.transportCapacity.buses} buses

SHELTER STATUS:
${shelterData}

ANALYSIS PROTOCOL:
Step 1 - IMMEDIATE LIFE THREATS (Priority: CRITICAL):
- Water unavailable + any occupancy = 72-hour survival limit
- Medical critical + vulnerable populations = immediate mortality risk
- Multiple critical resources + >80% capacity = system collapse imminent

Step 2 - URGENT INTERVENTION (Priority: HIGH):
- Single critical resource + >70% capacity utilization
- Multiple low resources + >85% capacity (resource cascade failure)
- Operator-reported urgent needs + high occupancy

Step 3 - PREVENTIVE MEASURES (Priority: MEDIUM):
- Trending degradation (adequate→low→critical pattern detection)
- High capacity + adequate resources (proactive restocking before crisis)

Step 4 - MONITORING STATUS (Priority: LOW):
- Adequate resources + <60% capacity utilization
- Recent confirmed resupply + stable conditions

CONTEXTUAL MODIFIERS:
- Evening hours: +10 points (limited transport/evacuation options)
- ${context.disaster.type} conditions: +15 points water/medical (contamination + injury risk)
- High winds: +5 points all resources (supply chain disruption)
- 12+ hours into disaster: +10 points (fatigue factor)

REQUIRED OUTPUT (JSON only):
[
  {
    "shelterId": "shelter-id",
    "name": "shelter-name",
    "priority": "critical|high|medium|low",
    "resourceNeeds": {
      "water": 0-100,
      "food": 0-100,
      "medical": 0-100,
      "bedding": 0-100
    },
    "reasoning": "step-by-step threat analysis with specific numbers and timeframes",
    "estimatedTimeframe": "immediate|2-6hours|6-24hours|24-48hours",
    "riskLevel": "life-threatening|health-risk|comfort-degradation|stable",
    "peopleAffected": number,
    "recommendedActions": ["action1", "action2"],
    "evacuationFeasibility": "immediate|weather-dependent|not-recommended",
    "resourcePriority": 1-4
  }
]

Respond with JSON only. No explanations outside JSON.`;
  }

  // Basic prompt fallback
  private static buildBasicPrompt(shelters: ShelterResourceData[]): string {
    const shelterData = shelters.map(s => 
      `Shelter: ${s.name} (ID: ${s.shelterId})
Capacity: ${s.capacity.current}/${s.capacity.maximum} (${Math.round(s.capacity.current/s.capacity.maximum*100)}% full)
Resources: Water=${s.resources.water}, Food=${s.resources.food}, Medical=${s.resources.medical}, Bedding=${s.resources.bedding}
Urgent Needs: ${s.urgentNeeds.join(', ') || 'None'}
Last Updated: ${s.lastUpdated}`
    ).join('\n\n');

    return `You are an expert emergency resource allocation AI with 10+ years of disaster response experience. Your mission is to save lives by optimizing resource distribution.

CONTEXT: Dallas emergency response during active disaster scenario. Time-critical decisions required.

SHELTER DATA:
${shelterData}

ANALYSIS FRAMEWORK:
1. IMMEDIATE THREATS (Critical Priority):
   - Water unavailable + high capacity = life-threatening dehydration risk
   - Medical unavailable + any occupancy = potential deaths
   - Multiple critical resources = system failure

2. URGENT NEEDS (High Priority):
   - Single critical resource + >70% capacity
   - Multiple low resources + >80% capacity
   - Urgent needs reported by operators

3. PREVENTIVE ACTION (Medium Priority):
   - Trending toward critical (adequate→low→critical pattern)
   - High capacity with adequate resources (proactive restocking)

4. STABLE MONITORING (Low Priority):
   - Adequate resources + <60% capacity
   - Recent restocking confirmed

REQUIRED OUTPUT (JSON only):
[
  {
    "shelterId": "shelter-id",
    "name": "shelter-name",
    "priority": "critical|high|medium|low",
    "resourceNeeds": {
      "water": 0-100,
      "food": 0-100,
      "medical": 0-100,
      "bedding": 0-100
    },
    "reasoning": "specific threat assessment and recommended action",
    "estimatedTimeframe": "immediate|hours|days",
    "riskLevel": "life-threatening|health-risk|comfort|stable"
  }
]

Respond with JSON only. No explanations outside JSON.`;
  }

  private static parseResourcePredictions(response: string): ResourcePrediction[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }

  // Test method with mock data
  static async testWithMockData(): Promise<ResourcePrediction[]> {
    try {
      const testSheltersPath = path.join(__dirname, '../../data/test-shelters.json');
      const shelters = JSON.parse(fs.readFileSync(testSheltersPath, 'utf8'));
      const context = this.loadContext();
      
      return await this.predictResourceNeeds(shelters, context || undefined);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  }
}