// import { getAllCompetencyCodes } from './db/queries';

export interface DemonstratedCompetency {
  code: string;
  confidence_percentage: number;
  explanation: string;
}

export interface DevelopmentOpportunity {
  code: string;
  suggestion: string;
}

export interface CompetencyAnalysis {
  demonstrated_competencies: DemonstratedCompetency[];
  development_opportunities: DevelopmentOpportunity[];
}

export interface ExtractedCompetencyData {
  analysis: CompetencyAnalysis;
  isValid: boolean;
  errors: string[];
}

// Valid UK-SPEC competency codes
const VALID_COMPETENCY_CODES = [
  'A1', 'A2',
  'B1', 'B2', 'B3', 
  'C1', 'C2', 'C3', 'C4',
  'D1', 'D2', 'D3',
  'E1', 'E2', 'E3', 'E4', 'E5'
];

/**
 * Extracts competency data from AI response text
 * Looks for JSON blocks and parses competency information
 */
export function extractCompetencyData(responseText: string): ExtractedCompetencyData {
  const errors: string[] = [];
  let analysis: CompetencyAnalysis = {
    demonstrated_competencies: [],
    development_opportunities: []
  };

  try {
    // Look for JSON code blocks in the response
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (!jsonMatch) {
      errors.push('No JSON structure found in response');
      return { analysis, isValid: false, errors };
    }

    const jsonString = jsonMatch[1];
    const parsedData = JSON.parse(jsonString);

    // Validate the structure
    if (!parsedData.analysis) {
      errors.push('Missing analysis object in JSON');
      return { analysis, isValid: false, errors };
    }

    const { demonstrated_competencies = [], development_opportunities = [] } = parsedData.analysis;

    // Validate and process demonstrated competencies
    const validDemonstratedCompetencies: DemonstratedCompetency[] = [];
    const seenCodes = new Set<string>();

    for (const comp of demonstrated_competencies) {
      const validationErrors = validateDemonstratedCompetency(comp);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        continue;
      }

      // Check for duplicates
      if (seenCodes.has(comp.code)) {
        errors.push(`Duplicate competency code: ${comp.code}`);
        continue;
      }

      seenCodes.add(comp.code);
      validDemonstratedCompetencies.push(comp);
    }

    // Validate development opportunities
    const validDevelopmentOpportunities: DevelopmentOpportunity[] = [];
    for (const opp of development_opportunities) {
      const validationErrors = validateDevelopmentOpportunity(opp);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        continue;
      }

      validDevelopmentOpportunities.push(opp);
    }

    analysis = {
      demonstrated_competencies: validDemonstratedCompetencies,
      development_opportunities: validDevelopmentOpportunities
    };

    return {
      analysis,
      isValid: errors.length === 0,
      errors
    };

  } catch (parseError) {
    errors.push(`JSON parsing error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    return { analysis, isValid: false, errors };
  }
}

/**
 * Validates a single demonstrated competency object
 */
function validateDemonstratedCompetency(comp: any): string[] {
  const errors: string[] = [];

  if (!comp.code || typeof comp.code !== 'string') {
    errors.push('Competency code is required and must be a string');
  } else if (!VALID_COMPETENCY_CODES.includes(comp.code)) {
    errors.push(`Invalid competency code: ${comp.code}`);
  }

  if (typeof comp.confidence_percentage !== 'number') {
    errors.push('Confidence percentage must be a number');
  } else if (comp.confidence_percentage < 1 || comp.confidence_percentage > 100) {
    errors.push('Confidence percentage must be between 1 and 100');
  }

  if (!comp.explanation || typeof comp.explanation !== 'string') {
    errors.push('Explanation is required and must be a string');
  } else if (comp.explanation.trim().length < 10) {
    errors.push('Explanation must be at least 10 characters long');
  }

  return errors;
}

/**
 * Validates a single development opportunity object
 */
function validateDevelopmentOpportunity(opp: any): string[] {
  const errors: string[] = [];

  if (!opp.code || typeof opp.code !== 'string') {
    errors.push('Development opportunity code is required and must be a string');
  } else if (!VALID_COMPETENCY_CODES.includes(opp.code)) {
    errors.push(`Invalid competency code in development opportunity: ${opp.code}`);
  }

  if (!opp.suggestion || typeof opp.suggestion !== 'string') {
    errors.push('Development suggestion is required and must be a string');
  } else if (opp.suggestion.trim().length < 10) {
    errors.push('Development suggestion must be at least 10 characters long');
  }

  return errors;
}

/**
 * Filters out development opportunity codes from demonstrated competencies
 * This helps prevent accidentally saving development suggestions as actual competencies
 */
export function getUniqueCompetencyCodes(demonstratedCompetencies: DemonstratedCompetency[]): string[] {
  const uniqueCodes = new Set<string>();
  
  for (const comp of demonstratedCompetencies) {
    if (VALID_COMPETENCY_CODES.includes(comp.code)) {
      uniqueCodes.add(comp.code);
    }
  }
  
  return Array.from(uniqueCodes);
}

/**
 * Converts demonstrated competencies to the format expected by database functions
 */
export function convertToTaskCompetencies(demonstratedCompetencies: DemonstratedCompetency[]) {
  return demonstratedCompetencies.map(comp => ({
    competencyCodeId: comp.code,
    confidenceScore: comp.confidence_percentage,
    notes: comp.explanation
  }));
}

/**
 * Validates that all competency codes exist in the database
 * Note: This function requires server-side access and is commented out for client compatibility
 */
/*
export async function validateCompetencyCodesExist(codes: string[]): Promise<{
  valid: string[];
  invalid: string[];
}> {
  try {
    const allCodes = await getAllCompetencyCodes();
    const validCodes = new Set(allCodes.map(code => code.id));
    
    const valid: string[] = [];
    const invalid: string[] = [];
    
    for (const code of codes) {
      if (validCodes.has(code)) {
        valid.push(code);
      } else {
        invalid.push(code);
      }
    }
    
    return { valid, invalid };
  } catch (error) {
    // If database query fails, fall back to static validation
    const valid = codes.filter(code => VALID_COMPETENCY_CODES.includes(code));
    const invalid = codes.filter(code => !VALID_COMPETENCY_CODES.includes(code));
    
    return { valid, invalid };
  }
}
*/

/**
 * Extracts competency codes from natural language text (fallback method)
 * This is used when JSON parsing fails
 */
export function extractCompetencyCodesFromText(text: string): string[] {
  const codes: string[] = [];
  const codeRegex = /\b([A-E][1-6])\b/g;
  
  let match;
  while ((match = codeRegex.exec(text)) !== null) {
    const code = match[1];
    if (VALID_COMPETENCY_CODES.includes(code) && !codes.includes(code)) {
      codes.push(code);
    }
  }
  
  return codes;
} 