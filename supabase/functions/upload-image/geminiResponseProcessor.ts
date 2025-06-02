
import { textUtils } from "./textUtils.ts";
import { validateDiseaseName, validateConfidence, validateAffectedArea } from "./diseaseValidator.ts";
import { extractDiseaseDataFromText, extractJsonFromResponse } from "./responseExtractor.ts";

export interface DiseaseAnalysisResult {
  disease: string;
  confidence: number;
  affectedArea: string;
  treatment: string;
  prevention: string;
}

// Process the Gemini API response text to extract disease data
export async function processGeminiResponse(analysisText: string): Promise<DiseaseAnalysisResult> {
  console.log("Processing Gemini response with validation and formatting");
  
  // Try to extract JSON from the response
  let diseaseData: Partial<DiseaseAnalysisResult> = {};
  const jsonData = extractJsonFromResponse(analysisText);
  
  if (jsonData) {
    diseaseData = jsonData;
    console.log("Successfully parsed disease data from JSON:", diseaseData);
  } else {
    console.log("No valid JSON found, falling back to text extraction");
    diseaseData = extractDiseaseDataFromText(analysisText);
  }

  // Validate and clean the data
  const validatedDisease = validateDiseaseName(diseaseData.disease || "Unknown");
  const validatedConfidence = validateConfidence(diseaseData.confidence);
  const validatedAffectedArea = validateAffectedArea(diseaseData.affectedArea || "", validatedDisease);
  
  // Format treatment and prevention text properly
  const formattedTreatment = diseaseData.treatment ? 
    textUtils.formatTreatmentSteps(diseaseData.treatment) : 
    "1. Consult with a local agriculture expert for proper treatment guidance.\n2. Monitor your crops regularly for disease symptoms.\n3. Apply appropriate treatments as recommended by experts.";
    
  const formattedPrevention = diseaseData.prevention ? 
    textUtils.formatPreventionTips(diseaseData.prevention) : 
    "• Practice good field hygiene and proper plant spacing.\n• Use disease-resistant seed varieties when available.\n• Implement crop rotation to break disease cycles.";
  
  const result: DiseaseAnalysisResult = {
    disease: validatedDisease,
    confidence: validatedConfidence,
    affectedArea: validatedAffectedArea,
    treatment: formattedTreatment,
    prevention: formattedPrevention
  };
  
  console.log("Final validated and formatted result:", result);
  return result;
}
