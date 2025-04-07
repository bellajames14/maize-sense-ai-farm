
import { textUtils } from "./textUtils.ts";

export interface DiseaseAnalysisResult {
  disease: string;
  confidence: number;
  affectedArea: string;
  treatment: string;
  prevention: string;
}

// Process the Gemini API response text to extract disease data
export async function processGeminiResponse(analysisText: string): Promise<DiseaseAnalysisResult> {
  // Extract the JSON from the response text
  let jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                  analysisText.match(/{[\s\S]*}/);
                  
  let diseaseData: Partial<DiseaseAnalysisResult> = {};
  
  if (jsonMatch) {
    // Try to parse the JSON
    try {
      const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
      diseaseData = JSON.parse(jsonText);
      console.log("Successfully parsed disease data from JSON");
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", e);
      // Fall back to extraction from text
      console.log("Falling back to text extraction");
      diseaseData = extractDiseaseDataFromText(analysisText);
    }
  } else {
    // Fall back to extraction from text
    console.log("No JSON found, falling back to text extraction");
    diseaseData = extractDiseaseDataFromText(analysisText);
  }

  // Clean any asterisks or special formatting from the text fields
  if (diseaseData.treatment) {
    diseaseData.treatment = textUtils.cleanTextForFarmers(diseaseData.treatment);
  }
  
  if (diseaseData.prevention) {
    diseaseData.prevention = textUtils.cleanTextForFarmers(diseaseData.prevention);
  }
  
  if (diseaseData.disease) {
    diseaseData.disease = textUtils.cleanTextForFarmers(diseaseData.disease);
  }
  
  const result: DiseaseAnalysisResult = {
    disease: diseaseData.disease || "Unknown",
    confidence: parseFloat(diseaseData.confidence?.toString() || "") || 85,
    affectedArea: diseaseData.affectedArea || "25%",
    treatment: diseaseData.treatment || "Consult with a local agriculture helper.",
    prevention: diseaseData.prevention || "Keep plants spaced well and water at the base, not on leaves."
  };
  
  return result;
}

// Helper function to extract disease data from text when JSON parsing fails
function extractDiseaseDataFromText(text: string): Partial<DiseaseAnalysisResult> {
  console.log("Extracting disease data from text");
  
  const result: Partial<DiseaseAnalysisResult> = {
    disease: "Unknown",
    confidence: 85,
    affectedArea: "25%",
    treatment: "Consult with a local agriculture helper.",
    prevention: "Keep plants spaced well and water at the base, not on leaves."
  };
  
  // Try to extract disease name
  const diseaseMatch = text.match(/Disease:?\s*([^,.]*)/i) || 
                       text.match(/disease name:?\s*([^,.]*)/i) ||
                       text.match(/problem:?\s*([^,.]*)/i);
  if (diseaseMatch) result.disease = diseaseMatch[1].trim();
  
  // If "healthy" is mentioned, set as healthy
  if (text.toLowerCase().includes("healthy")) {
    result.disease = "Healthy";
    result.confidence = 95;
    result.affectedArea = "0%";
    result.treatment = "No treatment needed. Your plant looks good.";
    result.prevention = "Keep taking good care of your plants as you have been.";
  }
  
  // Try to extract confidence
  const confidenceMatch = text.match(/confidence:?\s*(\d+)/i) ||
                         text.match(/(\d+)%\s*confidence/i) ||
                         text.match(/(\d+)%\s*sure/i);
  if (confidenceMatch) result.confidence = parseInt(confidenceMatch[1]);
  
  // Try to extract affected area
  const areaMatch = text.match(/affected area:?\s*(\d+%)/i) ||
                    text.match(/(\d+)%\s*of the plant/i) ||
                    text.match(/about (\d+)%/i);
  if (areaMatch) result.affectedArea = areaMatch[1];
  
  // Try to extract treatment
  const treatmentMatch = text.match(/[Tt]reatment:?\s*([^.]*\.)/);
  if (treatmentMatch) result.treatment = treatmentMatch[1].trim();
  
  // Try to extract prevention
  const preventionMatch = text.match(/[Pp]revention:?\s*([^.]*\.)/);
  if (preventionMatch) result.prevention = preventionMatch[1].trim();
  
  console.log("Extracted disease data:", result);
  return result;
}
