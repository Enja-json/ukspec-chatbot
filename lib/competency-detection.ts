import { extractCompetencyData, extractCompetencyCodesFromText } from './competency-extraction';

/**
 * Determines if a message represents a completed competency analysis task
 * Returns true only when the AI has provided actual competency codes with confidence scores
 */
export function isCompetencyAnalysisTask(responseText: string): boolean {
  // First check if there's structured JSON data with demonstrated competencies
  const extractedData = extractCompetencyData(responseText);
  
  if (extractedData.isValid && extractedData.analysis.demonstrated_competencies.length > 0) {
    return true;
  }
  
  // Fallback: check for natural language patterns that indicate analysis
  const analysisPatterns = [
    /\*\*Analysis:\*\*/i,
    /competency\s+[A-E][1-6].*confidence:\s*\d+%/i,
    /\*\*[A-E][1-6]\*\*.*\*\*\(confidence:\s*\d+%\)\*\*/i,
    /demonstrates?\s+competenc(y|ies).*[A-E][1-6]/i
  ];
  
  const hasAnalysisSection = analysisPatterns.some(pattern => pattern.test(responseText));
  
  // Check for clarifying questions sections which indicate NOT a completed analysis
  const clarifyingQuestionPatterns = [
    /\*\*clarifying questions:\*\*/i,
    /clarifying questions?:/i,
    /i need more information/i,
    /could you provide more details/i,
    /additional information.*needed/i
  ];
  
  const hasClarifyingQuestions = clarifyingQuestionPatterns.some(pattern => pattern.test(responseText));
  
  // If it has clarifying questions, it's not a completed analysis
  if (hasClarifyingQuestions) {
    return false;
  }
  
  // Check if there are actual competency codes mentioned with confidence indicators
  const competencyCodes = extractCompetencyCodesFromText(responseText);
  const hasConfidenceScores = /\d+%/.test(responseText);
  
  return hasAnalysisSection && competencyCodes.length > 0 && hasConfidenceScores;
}

/**
 * Extracts the competency analysis data from a response if it contains one
 * Returns null if no valid analysis is found
 */
export function extractCompetencyAnalysis(responseText: string) {
  if (!isCompetencyAnalysisTask(responseText)) {
    return null;
  }
  
  const extractedData = extractCompetencyData(responseText);
  
  if (extractedData.isValid && extractedData.analysis.demonstrated_competencies.length > 0) {
    return extractedData.analysis;
  }
  
  // Fallback: try to extract basic competency information from text
  const competencyCodes = extractCompetencyCodesFromText(responseText);
  
  if (competencyCodes.length === 0) {
    return null;
  }
  
  // Create basic analysis structure from extracted codes
  return {
    demonstrated_competencies: competencyCodes.map(code => ({
      code,
      confidence_percentage: 75, // Default confidence when not specified
      explanation: `Competency ${code} identified from task analysis`
    })),
    development_opportunities: []
  };
}

/**
 * Determines if a response is asking clarifying questions
 */
export function isAskingClarifyingQuestions(responseText: string): boolean {
  const clarifyingPatterns = [
    /\*\*clarifying questions:\*\*/i,
    /clarifying questions?:/i,
    /questions? for clarification/i,
    /i need.*more information/i,
    /could you.*provide.*details/i,
    /additional information.*needed/i,
    /help me understand/i,
    /what.*specifically/i,
    /can you.*elaborate/i
  ];
  
  return clarifyingPatterns.some(pattern => pattern.test(responseText));
}

/**
 * Determines if a response contains development suggestions
 */
export function containsDevelopmentSuggestions(responseText: string): boolean {
  const developmentPatterns = [
    /\*\*development suggestions:\*\*/i,
    /development opportunities?/i,
    /to strengthen.*competenc/i,
    /consider.*expanding/i,
    /you could.*demonstrate/i,
    /additional.*evidence/i
  ];
  
  return developmentPatterns.some(pattern => pattern.test(responseText));
} 