
import { DiseaseAnalysisResult } from "./geminiResponseProcessor.ts";

// Helper function to extract disease data from text when JSON parsing fails
export function extractDiseaseDataFromText(text: string): Partial<DiseaseAnalysisResult> {
  console.log("Extracting disease data from text");
  
  const result: Partial<DiseaseAnalysisResult> = {
    disease: "Unknown",
    confidence: 85,
    affectedArea: "25%",
    treatment: "Consult with a local agriculture expert for treatment advice.",
    prevention: "Practice good field hygiene and proper plant spacing."
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
    result.treatment = "No treatment needed. Your plant looks healthy.";
    result.prevention = "Continue with good farming practices to maintain plant health.";
  }
  
  // Try to extract confidence
  const confidenceMatch = text.match(/confidence:?\s*(\d+)/i) ||
                         text.match(/(\d+)%\s*confidence/i) ||
                         text.match(/(\d+)%\s*sure/i);
  if (confidenceMatch) {
    const confValue = parseInt(confidenceMatch[1]);
    result.confidence = confValue;
  }
  
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

// Extract JSON from response text
export function extractJsonFromResponse(analysisText: string): any | null {
  const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                    analysisText.match(/{[\s\S]*}/);
  
  if (!jsonMatch) return null;
  
  try {
    const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse JSON from response:", e);
    return null;
  }
}
