
import { validateDiseaseName, validateConfidence } from './diseaseValidator';

export interface ProcessedDiseaseData {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  explanation?: string; // New field for disease explanation
}

// Extract structured sections from Nigerian farmer-focused response
const extractStructuredSections = (analysisText: string): Partial<ProcessedDiseaseData> => {
  console.log("Extracting structured sections from farmer-focused response");
  
  const result: Partial<ProcessedDiseaseData> = {
    disease: "Unknown",
    confidence: 85,
    treatment: "",
    prevention: "",
    explanation: ""
  };
  
  // Extract disease name from the "What is" section
  const whatIsMatch = analysisText.match(/🌿\s*What is ([^?]+)\?/i);
  if (whatIsMatch) {
    result.disease = whatIsMatch[1].trim();
  }
  
  // Extract explanation from the "What is" section
  const explanationMatch = analysisText.match(/🌿\s*What is[^?]+\?\s*([^💊🧑]+)/i);
  if (explanationMatch) {
    result.explanation = explanationMatch[1].trim().replace(/^\(|\)$/g, '');
  }
  
  // Extract treatment from the "How to Treat" section
  const treatmentMatch = analysisText.match(/💊\s*How to Treat[^💊🧑]*?\n((?:\d+\..*?\n?)+)/i);
  if (treatmentMatch) {
    result.treatment = treatmentMatch[1].trim();
  }
  
  // Extract prevention from the "Tips for Farmers" section
  const preventionMatch = analysisText.match(/🧑🏾‍🌾\s*Tips for Farmers[^🧑]*?\n((?:•.*?\n?)+)/i);
  if (preventionMatch) {
    result.prevention = preventionMatch[1].trim();
  }
  
  // If structured extraction fails, try fallback extraction
  if (!result.treatment || !result.prevention) {
    console.log("Structured extraction failed, using fallback");
    return extractFallbackData(analysisText);
  }
  
  console.log("Extracted structured data:", result);
  return result;
};

// Fallback extraction for non-structured responses
const extractFallbackData = (text: string): Partial<ProcessedDiseaseData> => {
  console.log("Using fallback extraction");
  
  const result: Partial<ProcessedDiseaseData> = {
    disease: "Unknown",
    confidence: 85,
    treatment: "1. Consult with a local agriculture expert for proper treatment guidance\n2. Monitor your crops regularly for disease symptoms\n3. Apply appropriate treatments as recommended by experts",
    prevention: "• Maintain good field hygiene and proper plant spacing\n• Use disease-resistant seed varieties when available\n• Practice crop rotation to prevent disease spread",
    explanation: "A common maize disease that affects plant health and productivity."
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
    result.explanation = "Your maize plant appears to be in good health with no signs of disease.";
  }
  
  return result;
};

// Format treatment text as clear numbered steps
const formatTreatment = (text: string): string => {
  if (!text) return "1. Consult with a local agriculture expert for proper treatment guidance\n2. Monitor your crops regularly for disease symptoms\n3. Apply appropriate treatments as recommended by experts";
  
  // If already well formatted, return as is
  if (/^\d+\.\s/.test(text.trim())) {
    return text.trim();
  }
  
  // Clean and format as numbered steps
  const sentences = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15)
    .slice(0, 3);
  
  return sentences
    .map((sentence, index) => `${index + 1}. ${sentence}${sentence.endsWith('.') ? '' : '.'}`)
    .join('\n');
};

// Format prevention text as clear bullet points
const formatPrevention = (text: string): string => {
  if (!text) return "• Maintain good field hygiene and proper plant spacing\n• Use disease-resistant seed varieties when available\n• Practice crop rotation to prevent disease spread";
  
  // If already well formatted, return as is
  if (/^•\s/.test(text.trim())) {
    return text.trim();
  }
  
  // Clean and format as bullet points
  const sentences = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15)
    .slice(0, 4);
  
  return sentences
    .map(sentence => `• ${sentence}${sentence.endsWith('.') ? '' : '.'}`)
    .join('\n');
};

// Process the Gemini API response to extract and format disease data
export const processGeminiResponse = (analysisText: string): ProcessedDiseaseData => {
  try {
    // Try structured extraction first
    let diseaseData = extractStructuredSections(analysisText);
    
    // Clean and validate the extracted data
    const rawDisease = diseaseData.disease || "Unknown";
    const validatedDisease = validateDiseaseName(rawDisease);
    const validatedConfidence = validateConfidence(diseaseData.confidence);
    
    return {
      disease: validatedDisease,
      confidence: validatedConfidence,
      treatment: formatTreatment(diseaseData.treatment || ""),
      prevention: formatPrevention(diseaseData.prevention || ""),
      explanation: diseaseData.explanation || "Disease information not available."
    };
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    return {
      disease: "Analysis Error",
      confidence: 50,
      treatment: "1. We couldn't analyze your image properly\n2. Please try again with a clearer photo\n3. Make sure the plant symptoms are clearly visible",
      prevention: "• Take photos in good light showing clear symptoms\n• Make sure the plant fills most of the image\n• Avoid blurry or dark photos for better analysis",
      explanation: "Unable to analyze the uploaded image. Please try again with a clearer photo."
    };
  }
};
