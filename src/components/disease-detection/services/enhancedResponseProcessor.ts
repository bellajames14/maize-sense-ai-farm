
import { validateDiseaseName, validateConfidence } from './diseaseValidator';
import { parseGeminiResponse } from './geminiResponseParser';
import { handleSpecialCases } from './specialCaseHandlers';

export interface ProcessedDiseaseData {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  explanation?: string;
}

// Enhanced processor that prioritizes TensorFlow results and uses Gemini for recommendations
export const processEnhancedGeminiResponse = (
  analysisText: string,
  tensorflowResult?: { diseaseName: string; confidence: number }
): ProcessedDiseaseData => {
  try {
    console.log("Processing enhanced response with TensorFlow result:", tensorflowResult);
    console.log("Gemini analysis text length:", analysisText.length);
    
    // Parse the Gemini response for treatment and prevention
    const geminiParsed = parseGeminiResponse(analysisText);
    
    // Use TensorFlow result if available, otherwise use Gemini result
    let result: ProcessedDiseaseData;
    
    if (tensorflowResult) {
      // Prioritize TensorFlow model results for disease identification
      result = {
        disease: validateDiseaseName(tensorflowResult.diseaseName),
        confidence: validateConfidence(tensorflowResult.confidence),
        treatment: geminiParsed.treatment,
        prevention: geminiParsed.prevention
      };
      
      console.log("Using TensorFlow disease detection with Gemini recommendations");
    } else {
      // Fallback to full Gemini analysis
      result = {
        disease: validateDiseaseName(geminiParsed.disease),
        confidence: validateConfidence(geminiParsed.confidence),
        treatment: geminiParsed.treatment,
        prevention: geminiParsed.prevention
      };
      
      console.log("Using full Gemini analysis");
    }

    // Handle special cases if treatment or prevention is still generic
    if (result.treatment.length < 50 || result.prevention.length < 50) {
      console.log("Treatment/prevention too short, using special case handling");
      const specialCase = handleSpecialCases(result.disease);
      
      if (result.treatment.length < 50) {
        result.treatment = specialCase.treatment;
      }
      if (result.prevention.length < 50) {
        result.prevention = specialCase.prevention;
      }
    }

    // Set explanation based on disease type
    if (result.disease === "Healthy") {
      result.explanation = "Great news! Your maize plant appears healthy with no signs of disease.";
    } else if (result.disease === "Unrecognized Plant") {
      result.explanation = "We cannot clearly identify this plant. Please try a clearer photo or ask our AI assistant.";
    } else {
      result.explanation = `This appears to be ${result.disease}, a condition that can affect maize plant health.`;
    }
    
    console.log("Final enhanced processed result:", result);
    return result;
    
  } catch (error) {
    console.error("Error in enhanced processing:", error);
    return handleSpecialCases("Analysis Error");
  }
};
