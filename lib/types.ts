export type DataPart = { type: 'append-message'; message: string };

export interface AICompetencyAnalysisData {
  taskTitle: string;
  taskDescription: string;
  demonstratedCompetencies: Array<{
    code: string;
    confidence_percentage: number;
    explanation: string;
  }>;
}

export interface CreateTaskFromAIRequest {
  chatId: string;
  messageId: string;
  aiModel: string;
  analysisData: AICompetencyAnalysisData;
  rawAIResponse: any;
}

export interface TaskCompetencyWithAI {
  taskId: string;
  competencyCodeId: string;
  confidenceScore?: number;
  notes?: string;
  aiExplanation?: string;
  sourceType: 'ai_suggested' | 'manual_added' | 'ai_modified';
  createdAt: Date;
}

export interface CompetencyAnalytics {
  totalTasks: number;
  totalEvidence: number;
  categoryDistribution: Array<{
    category: string;
    count: number;
    averageConfidence: number;
  }>;
  competencyCodeDistribution: Array<{
    competencyCodeId: string;
    category: string;
    title: string;
    count: number;
    averageConfidence: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    taskCount: number;
  }>;
  sourceDistribution: Array<{
    source: string;
    count: number;
  }>;
  topCompetencies: Array<{
    competencyCodeId: string;
    category: string;
    title: string;
    count: number;
  }>;
}
