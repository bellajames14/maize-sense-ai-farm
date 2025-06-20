
import { validateDiseaseName, validateConfidence } from './diseaseValidator';
import { extractStructuredData } from './dataExtractor';
import { handleSpecialCases } from './specialCaseHandlers';

export interface ProcessedDiseaseData {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  explanation?: string;
}

// Main function to process Gemini response
export const processGeminiResponse = (analysisText: string): ProcessedDiseaseData => {
  try {
    console.log("Processing Gemini response, length:", analysisText.length);
    
    // Extract structured data
    let result = extractStructuredData(analysisText);
    
    // Handle cases where extraction didn't work well
    if (!result.treatment || !result.prevention) {
      console.log("Extraction incomplete, using special case handling");
      result = handleSpecialCases(result.disease);
    } else {
      // Validate and clean extracted data
      result.disease = validateDiseaseName(result.disease);
      result.confidence = validateConfidence(result.confidence);
      
      // Set explanation based on disease type
      if (result.disease === "Healthy") {
        result.explanation = "Great news! Your maize plant appears healthy with no signs of disease.";
      } else if (result.disease === "Unrecognized Plant") {
        result.explanation = "We cannot clearly identify this plant. Please try a clearer photo or ask our AI assistant.";
      } else {
        result.explanation = `This appears to be ${result.disease}, a condition that can affect maize plant health.`;
      }
    }
    
    console.log("Final processed result:", result);
    return result;
    
  } catch (error) {
    console.error("Error processing response:", error);
    return handleSpecialCases("Analysis Error");
  }
};
