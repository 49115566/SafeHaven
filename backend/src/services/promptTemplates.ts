// Advanced prompt templates for different AI scenarios

export class PromptTemplates {
  
  // Enhanced resource prediction with few-shot examples
  static buildEnhancedResourcePrompt(shelters: any[]): string {
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

SCORING METHODOLOGY:
- Water: Dehydration risk (3-day survival limit)
- Medical: Life-threatening emergencies (immediate need)
- Food: Nutrition/morale (7-day concern)
- Bedding: Comfort/health (weather dependent)

EXAMPLE ANALYSIS:
Input: "Shelter A: 180/200 (90% full), Water=critical, Food=adequate, Medical=low, Bedding=adequate"
Output: {"priority": "critical", "water": 95, "reasoning": "Near capacity with critical water shortage poses immediate dehydration risk"}

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

  // Evacuation recommendation prompt
  static buildEvacuationPrompt(shelters: any[]): string {
    const shelterData = shelters.map(s => 
      `${s.name}: ${s.capacity.current}/${s.capacity.maximum} occupants, Status: ${s.status}, Resources: ${JSON.stringify(s.resources)}`
    ).join('\n');

    return `You are a FirstNet emergency evacuation coordinator AI. Analyze shelter conditions and recommend evacuation priorities.

SHELTER STATUS:
${shelterData}

EVACUATION CRITERIA:
- IMMEDIATE: Life-threatening conditions (water unavailable + medical critical)
- URGENT: Multiple critical resources + high occupancy
- PLANNED: Preventive evacuation before conditions worsen
- MONITOR: Stable but watch for changes

OUTPUT (JSON only):
[
  {
    "shelterId": "id",
    "evacuationPriority": "immediate|urgent|planned|monitor",
    "occupantsToMove": number,
    "destinationSuggestions": ["shelter-ids"],
    "reasoning": "specific safety concerns"
  }
]`;
  }

  // Resource allocation optimization
  static buildAllocationPrompt(shelters: any[], availableResources: any): string {
    return `You are a supply chain optimization AI for emergency response. Allocate limited resources for maximum life-saving impact.

AVAILABLE RESOURCES:
- Water: ${availableResources.water} units
- Food: ${availableResources.food} units  
- Medical: ${availableResources.medical} units
- Bedding: ${availableResources.bedding} units

ALLOCATION STRATEGY:
1. Life-threatening situations first (water/medical critical)
2. High-occupancy shelters second (maximum people helped)
3. Preventive allocation third (avoid future crises)

OUTPUT (JSON only):
[
  {
    "shelterId": "id",
    "allocation": {
      "water": number,
      "food": number,
      "medical": number,
      "bedding": number
    },
    "justification": "impact reasoning"
  }
]`;
  }

  // Predictive analytics prompt
  static buildPredictivePrompt(historicalData: any[]): string {
    return `You are a predictive analytics AI for disaster response. Forecast resource consumption and capacity trends.

HISTORICAL PATTERNS:
${JSON.stringify(historicalData, null, 2)}

PREDICT:
1. Resource depletion rates
2. Capacity utilization trends
3. Critical shortage timing
4. Recommended preemptive actions

OUTPUT (JSON only):
{
  "predictions": [
    {
      "shelterId": "id",
      "forecasts": {
        "waterDepletionHours": number,
        "capacityFullHours": number,
        "criticalResourceHours": number
      },
      "recommendations": ["action1", "action2"]
    }
  ]
}`;
  }
}

// Prompt engineering utilities
export class PromptUtils {
  
  // Add few-shot examples for better performance
  static addFewShotExamples(basePrompt: string): string {
    const examples = `
EXAMPLE 1:
Input: Shelter at 95% capacity, water=critical, medical=low
Output: {"priority": "critical", "water": 100, "medical": 60, "reasoning": "Overcrowded with water crisis"}

EXAMPLE 2:  
Input: Shelter at 30% capacity, all resources adequate
Output: {"priority": "low", "water": 15, "food": 15, "reasoning": "Stable conditions, routine monitoring"}

EXAMPLE 3:
Input: Shelter at 85% capacity, food=critical, water=low
Output: {"priority": "high", "food": 90, "water": 70, "reasoning": "High occupancy with nutrition crisis"}

`;
    return basePrompt.replace('REQUIRED OUTPUT', `${examples}REQUIRED OUTPUT`);
  }

  // Adjust temperature based on task type
  static getOptimalTemperature(taskType: 'prediction' | 'classification' | 'creative'): number {
    switch (taskType) {
      case 'prediction': return 0.1; // Very deterministic
      case 'classification': return 0.2; // Mostly deterministic  
      case 'creative': return 0.7; // More creative
      default: return 0.3;
    }
  }

  // Validate prompt length for token limits
  static validatePromptLength(prompt: string, maxTokens: number = 4000): boolean {
    // Rough estimate: 1 token ≈ 4 characters
    const estimatedTokens = prompt.length / 4;
    return estimatedTokens < maxTokens * 0.8; // Leave 20% buffer for response
  }
}