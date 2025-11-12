export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface AIModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface FinancialAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
  categoryBreakdown: {
    category: string;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  savingsPotential: number;
}

export interface SpendingPrediction {
  nextMonth: number;
  confidence: number;
  factors: string[];
}

export interface PersonalizedRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  potentialSavings?: number;
}

