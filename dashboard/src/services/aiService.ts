import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
}

interface PredictionResponse {
  predictions: ResourcePrediction[];
  totalShelters: number;
  timestamp: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const aiService = {
  async predictResourceNeeds(token: string): Promise<PredictionResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/ai/predict-resources`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data;
  }
};