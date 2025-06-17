
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
    treatment: "1. Consult with a local agriculture expert for proper treatment guidance\n2. Monitor your crops regularly for disease symptoms\n3. Apply appropriate treatments as recommended by experts",
    prevention: "• Maintain good field hygiene and proper plant spacing\n• Use disease-resistant seed varieties when available\n• Practice crop rotation to prevent disease spread"
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
    result.treatment = "1. No treatment needed - your plant looks healthy\n2. Continue with current good practices\n3. Keep monitoring regularly for any changes";
    result.prevention = "• Continue with good farming practices\n• Maintain proper fertilization schedule\n• Keep fields clean and well-drained";
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

// Format treatment text as clear numbered steps for farmers
const formatTreatment = (text: string): string => {
  if (!text) return "1. Consult with a local agriculture expert for proper treatment guidance\n2. Monitor your crops regularly for disease symptoms\n3. Apply appropriate treatments as recommended by experts";
  
  // Clean the text first - remove markdown and excess formatting
  let cleaned = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^\d+\.\s*/gm, '')
    .trim();
  
  // Split into sentences and filter meaningful content
  const sentences = cleaned
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15)
    .slice(0, 4); // Limit to 4 steps max
  
  if (sentences.length <= 1) {
    return cleaned.startsWith('1.') ? cleaned : `1. ${cleaned}`;
  }
  
  // Format as numbered steps with proper spacing
  return sentences
    .map((sentence, index) => {
      const step = sentence.replace(/^[-•]\s*/, '').trim();
      return `${index + 1}. ${step}${step.endsWith('.') ? '' : '.'}`;
    })
    .join('\n');
};

// Format prevention text as clear bullet points for farmers
const formatPrevention = (text: string): string => {
  if (!text) return "• Maintain good field hygiene and proper plant spacing\n• Use disease-resistant seed varieties when available\n• Practice crop rotation to prevent disease spread";
  
  // Clean the text first - remove markdown and excess formatting
  let cleaned = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^[•-]\s*/gm, '')
    .trim();
  
  // Split into sentences and filter meaningful content
  const sentences = cleaned
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15)
    .slice(0, 4); // Limit to 4 tips max
  
  if (sentences.length <= 1) {
    return cleaned.startsWith('•') ? cleaned : `• ${cleaned}`;
  }
  
  // Format as bullet points with proper spacing
  return sentences
    .map(sentence => {
      const tip = sentence.replace(/^\d+\.\s*/, '').trim();
      return `• ${tip}${tip.endsWith('.') ? '' : '.'}`;
    })
    .join('\n');
};

// Process the Gemini API response to extract and format disease data
export const processGeminiResponse = (analysisText: string): ProcessedDiseaseData => {
  try {
    // Try to extract JSON first
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
      treatment: "1. We couldn't analyze your image properly\n2. Please try again with a clearer photo\n3. Make sure the plant symptoms are clearly visible",
      prevention: "• Take photos in good light showing clear symptoms\n• Make sure the plant fills most of the image\n• Avoid blurry or dark photos for better analysis"
    };
  }
};
