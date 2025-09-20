// Improved prompt templates with advanced techniques

export class ImprovedPrompts {
  
  static buildAdvancedResourcePrompt(shelters: any[], context: any): string {
    const shelterData = shelters.map(s => 
      `Shelter: ${s.name} (ID: ${s.shelterId})
Location: ${s.location.address}
Capacity: ${s.capacity.current}/${s.capacity.maximum} (${Math.round(s.capacity.current/s.capacity.maximum*100)}% full)
Status: ${s.status}
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
- Hurricane-specific: Flooding risk + ground-level shelters

Step 2 - URGENT INTERVENTION (Priority: HIGH):
- Single critical resource + >70% capacity utilization
- Multiple low resources + >85% capacity (resource cascade failure)
- Operator-reported urgent needs + high occupancy
- Weather deterioration affecting supply routes

Step 3 - PREVENTIVE MEASURES (Priority: MEDIUM):
- Trending degradation (adequate→low→critical pattern detection)
- High capacity + adequate resources (proactive restocking before crisis)
- Geographic isolation during storm conditions
- Anticipated resource depletion within 24 hours

Step 4 - MONITORING STATUS (Priority: LOW):
- Adequate resources + <60% capacity utilization
- Recent confirmed resupply + stable conditions
- Low occupancy + multiple resource buffers

SCORING ALGORITHM:
- Water: Hurricane flooding = contamination risk + 3-day survival limit (Weight: 1.0)
- Medical: Chronic conditions + storm stress + limited evacuation (Weight: 0.9)
- Food: Morale + energy for evacuation + 7-day concern (Weight: 0.6)
- Bedding: Hypothermia risk + comfort + sleep deprivation (Weight: 0.4)

CONTEXTUAL MODIFIERS:
- Evening hours: +10 points (limited transport/evacuation options)
- Hurricane conditions: +15 points water/medical (contamination + injury risk)
- High winds: +5 points all resources (supply chain disruption)
- 12+ hours into disaster: +10 points (fatigue factor)

CHAIN-OF-THOUGHT ANALYSIS:
For each shelter, analyze:
1. Immediate threat assessment (life-threatening conditions?)
2. Capacity utilization impact (how many people affected?)
3. Resource cascade risk (will other resources fail soon?)
4. Weather/disaster-specific factors (hurricane flooding, wind damage)
5. Transport/evacuation feasibility (current conditions)
6. Resource allocation priority (maximum lives saved)

EXAMPLE REASONING:
Input: "Shelter B: 180/200 (90% full), Water=critical, Medical=adequate, evening, hurricane conditions"
Analysis: "Step 1: Water critical + high occupancy = immediate dehydration risk. Step 2: Hurricane = contamination risk. Step 3: Evening = limited evacuation options. Step 4: 90% capacity = 180 people at risk."
Output: {"priority": "critical", "water": 95, "reasoning": "180 people face dehydration within 72 hours, hurricane contamination risk, limited evening evacuation options"}

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
    "recommendedActions": ["action1", "action2", "action3"],
    "evacuationFeasibility": "immediate|weather-dependent|not-recommended",
    "resourcePriority": 1-4
  }
]

CRITICAL: Respond with JSON only. No explanations outside JSON. Lives depend on accurate analysis.`;
  }

  static buildContextAwarePrompt(shelters: any[], context: any, promptType: string): string {
    const basePrompt = this.buildAdvancedResourcePrompt(shelters, context);
    
    // Add dynamic examples based on context
    const contextExamples = this.generateContextualExamples(context);
    
    return basePrompt.replace('EXAMPLE REASONING:', `${contextExamples}\n\nEXAMPLE REASONING:`);
  }

  private static generateContextualExamples(context: any): string {
    const disasterType = context.disaster.type;
    const timeOfDay = context.timeContext.timeOfDay;
    
    if (disasterType === 'hurricane' && timeOfDay === 'evening') {
      return `HURRICANE EVENING EXAMPLES:
Example 1: High-rise shelter + flooding risk = immediate evacuation priority
Example 2: Medical critical + storm surge warning = helicopter evacuation needed
Example 3: Multiple shelters + limited transport = triage by occupancy numbers`;
    }
    
    return `GENERAL EXAMPLES:
Example 1: Critical resources + high capacity = maximum impact intervention
Example 2: Adequate resources + low capacity = monitoring status
Example 3: Mixed conditions = balanced resource allocation`;
  }

  static buildMultiStepReasoningPrompt(shelters: any[], context: any): string {
    return `You are an expert emergency AI. Analyze each shelter using this exact process:

STEP 1: Assess immediate threats
STEP 2: Calculate people at risk  
STEP 3: Evaluate resource cascade risk
STEP 4: Consider weather/disaster factors
STEP 5: Determine intervention priority
STEP 6: Recommend specific actions

For each shelter, show your reasoning for each step, then provide final recommendation.

${this.buildAdvancedResourcePrompt(shelters, context)}`;
  }
}

// Advanced prompt utilities
export class AdvancedPromptUtils {
  
  static addDynamicExamples(prompt: string, shelters: any[]): string {
    // Generate examples based on actual shelter conditions
    const examples = shelters.slice(0, 2).map((shelter, index) => {
      const capacity = Math.round((shelter.capacity.current / shelter.capacity.maximum) * 100);
      const criticalResources = Object.values(shelter.resources).filter(r => r === 'critical').length;
      
      let priority = 'medium';
      if (criticalResources >= 2 || (criticalResources >= 1 && capacity > 80)) {
        priority = 'critical';
      } else if (criticalResources >= 1 || capacity > 85) {
        priority = 'high';
      }
      
      return `EXAMPLE ${index + 1}:
Input: "${shelter.name}: ${capacity}% full, ${criticalResources} critical resources"
Output: {"priority": "${priority}", "reasoning": "Analysis based on capacity and resource status"}`;
    }).join('\n\n');
    
    return prompt.replace('EXAMPLE REASONING:', `${examples}\n\nEXAMPLE REASONING:`);
  }

  static optimizeForModel(prompt: string, modelType: 'nova-micro' | 'claude' | 'gpt'): string {
    switch (modelType) {
      case 'nova-micro':
        // Shorter, more structured for Nova Micro
        return prompt.replace(/ANALYSIS PROTOCOL:[\s\S]*?SCORING ALGORITHM:/g, 
          'ANALYSIS: Assess threat level, capacity impact, resource needs.\n\nSCORING ALGORITHM:');
      
      case 'claude':
        // Add more reasoning steps for Claude
        return prompt.replace('CHAIN-OF-THOUGHT ANALYSIS:', 
          'DETAILED REASONING REQUIRED:\nThink through each decision step-by-step.\n\nCHAIN-OF-THOUGHT ANALYSIS:');
      
      default:
        return prompt;
    }
  }

  static validatePromptComplexity(prompt: string): { 
    tokenCount: number, 
    complexity: 'simple' | 'moderate' | 'complex',
    recommendations: string[]
  } {
    const tokenCount = Math.round(prompt.length / 4);
    const complexity = tokenCount < 500 ? 'simple' : tokenCount < 1500 ? 'moderate' : 'complex';
    
    const recommendations = [];
    if (tokenCount > 3000) recommendations.push('Consider splitting into multiple prompts');
    if (prompt.includes('Step 1') && prompt.includes('Step 6')) recommendations.push('Multi-step reasoning detected - good for accuracy');
    if (!prompt.includes('JSON only')) recommendations.push('Add strict output format enforcement');
    
    return { tokenCount, complexity, recommendations };
  }
}