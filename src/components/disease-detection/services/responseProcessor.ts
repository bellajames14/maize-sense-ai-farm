
import { validateDiseaseName, validateConfidence } from './diseaseValidator';

export interface ProcessedDiseaseData {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
}

// Extract JSON from response text
const extractJsonFromResponse = (analysisText: string): any | null => {
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
};

// Helper function to extract disease data from text when JSON parsing fails
const extractDiseaseDataFromText = (text: string): Partial<ProcessedDiseaseData> => {
  console.log("Extracting disease data from text");
  
  const result: Partial<ProcessedDiseaseData> = {
    disease: "Unknown",
    confidence: 85,
    treatment: "Consult with a local agriculture expert for proper treatment guidance.",
    prevention: "Maintain good field hygiene and proper plant spacing to prevent disease spread."
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
    result.treatment = "No treatment needed. Your plant looks healthy.";
    result.prevention = "Continue with good farming practices to maintain plant health.";
  }
  
  // Try to extract confidence
  const confidenceMatch = text.match(/confidence:?\s*(\d+)/i) ||
                         text.match(/(\d+)%\s*confidence/i) ||
                         text.match(/(\d+)%\s*sure/i);
  if (confidenceMatch) result.confidence = parseInt(confidenceMatch[1]);
  
  // Try to extract treatment
  const treatmentMatch = text.match(/[Tt]reatment:?\s*([^.]*\.)/);
  if (treatmentMatch) result.treatment = treatmentMatch[1].trim();
  
  // Try to extract prevention
  const preventionMatch = text.match(/[Pp]revention:?\s*([^.]*\.)/);
  if (preventionMatch) result.prevention = preventionMatch[1].trim();
  
  console.log("Extracted disease data:", result);
  return result;
};

// Format treatment text as numbered steps
const formatTreatment = (text: string): string => {
  if (!text) return "Consult with a local agriculture expert for proper treatment guidance.";
  
  // Clean and format as numbered steps
  const cleaned = text.replace(/\*/g, '').trim();
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length <= 1) return cleaned;
  
  return sentences.map((sentence, index) => 
    `${index + 1}. ${sentence.trim()}.`
  ).join('\n');
};

// Format prevention text as bullet points
const formatPrevention = (text: string): string => {
  if (!text) return "Maintain good field hygiene and proper plant spacing to prevent disease spread.";
  
  // Clean and format as bullet points
  const cleaned = text.replace(/\*/g, '').trim();
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length <= 1) return cleaned;
  
  return sentences.map(sentence => 
    `• ${sentence.trim()}.`
  ).join('\n');
};

// Process the Gemini API response to extract disease data
export const processGeminiResponse = (analysisText: string): ProcessedDiseaseData => {
  try {
    // Try to extract JSON
    let diseaseData: Partial<ProcessedDiseaseData> = {};
    const jsonData = extractJsonFromResponse(analysisText);
    
    if (jsonData) {
      diseaseData = jsonData;
      console.log("Successfully parsed disease data from JSON");
    } else {
      console.log("No JSON found, falling back to text extraction");
      diseaseData = extractDiseaseDataFromText(analysisText);
    }
    
    // Clean and validate the extracted data
    const rawDisease = diseaseData.disease || "Unknown";
    const validatedDisease = validateDiseaseName(rawDisease);
    const validatedConfidence = validateConfidence(diseaseData.confidence);
    
    return {
      disease: validatedDisease,
      confidence: validatedConfidence,
      treatment: formatTreatment(diseaseData.treatment || ""),
      prevention: formatPrevention(diseaseData.prevention || "")
    };
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    return {
      disease: "Analysis Error",
      confidence: 50,
      treatment: "We couldn't analyze your image properly. Please try again with a clearer photo.",
      prevention: "Take photos in good light showing clear symptoms on the plant."
    };
  }
};
