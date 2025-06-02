
// Re-export all Gemini services from a single entry point
export { validateDiseaseName, validateConfidence, KNOWN_MAIZE_DISEASES } from './diseaseValidator';
export { processGeminiResponse, type ProcessedDiseaseData } from './responseProcessor';
export { getGeminiRecommendations } from './recommendationService';
export { analyzeWithGemini } from './visionAnalysisService';

// Legacy exports for backward compatibility
export const extractDiseaseDataFromText = (text: string) => {
  console.log("Legacy function - use processGeminiResponse instead");
  // This is kept for backward compatibility but redirects to the new processor
  const { processGeminiResponse } = require('./responseProcessor');
  return processGeminiResponse(text);
};
