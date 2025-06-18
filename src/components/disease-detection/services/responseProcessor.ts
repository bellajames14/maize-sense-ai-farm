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
  console.log("Raw analysis text:", analysisText);
  
  const result: Partial<ProcessedDiseaseData> = {
    disease: "Unknown",
    confidence: 85,
    treatment: "",
    prevention: "",
    explanation: ""
  };
  
  // Extract disease name from the "What is" section - more flexible regex
  const whatIsMatches = [
    analysisText.match(/🌿\s*What is ([^?]+)\?/i),
    analysisText.match(/What is ([^?]+)\?/i),
    analysisText.match(/Disease:\s*([^\n]+)/i)
  ];
  
  const whatIsMatch = whatIsMatches.find(match => match !== null);
  if (whatIsMatch) {
    result.disease = whatIsMatch[1].trim();
    console.log("Extracted disease:", result.disease);
  }
  
  // Extract explanation from the "What is" section - more flexible
  const explanationMatches = [
    analysisText.match(/🌿\s*What is[^?]+\?\s*\n([^💊🧑\n]+)/i),
    analysisText.match(/What is[^?]+\?\s*\n([^💊🧑\n]+)/i),
    analysisText.match(/🌿[^?]+\?\s*([^💊🧑]+?)(?=💊|🧑|$)/s)
  ];
  
  const explanationMatch = explanationMatches.find(match => match !== null);
  if (explanationMatch) {
    result.explanation = explanationMatch[1].trim().replace(/^\(|\)$/g, '');
    console.log("Extracted explanation:", result.explanation);
  }
  
  // Extract treatment - multiple patterns to catch variations
  const treatmentMatches = [
    analysisText.match(/💊\s*How to Treat[^💊🧑]*?\n((?:\d+\..*?(?:\n|$))+)/si),
    analysisText.match(/How to Treat[^💊🧑]*?\n((?:\d+\..*?(?:\n|$))+)/si),
    analysisText.match(/💊[^💊🧑]*?\n((?:\d+\..*?(?:\n|$))+)/si),
    analysisText.match(/Treatment[^💊🧑]*?:\s*((?:\d+\..*?(?:\n|$))+)/si)
  ];
  
  const treatmentMatch = treatmentMatches.find(match => match !== null);
  if (treatmentMatch) {
    result.treatment = treatmentMatch[1].trim();
    console.log("Extracted treatment:", result.treatment);
  }
  
  // Extract prevention - multiple patterns to catch variations
  const preventionMatches = [
    analysisText.match(/🧑🏾‍🌾\s*Tips for Farmers[^🧑]*?\n((?:•.*?(?:\n|$))+)/si),
    analysisText.match(/Tips for Farmers[^🧑]*?\n((?:•.*?(?:\n|$))+)/si),
    analysisText.match(/🧑🏾‍🌾[^🧑]*?\n((?:•.*?(?:\n|$))+)/si),
    analysisText.match(/Prevention[^🧑]*?:\s*((?:•.*?(?:\n|$))+)/si)
  ];
  
  const preventionMatch = preventionMatches.find(match => match !== null);
  if (preventionMatch) {
    result.prevention = preventionMatch[1].trim();
    console.log("Extracted prevention:", result.prevention);
  }
  
  // If structured extraction fails, try fallback extraction
  if (!result.treatment || !result.prevention) {
    console.log("Structured extraction incomplete, using fallback");
    const fallbackData = extractFallbackData(analysisText);
    result.treatment = result.treatment || fallbackData.treatment || "";
    result.prevention = result.prevention || fallbackData.prevention || "";
  }
  
  console.log("Final extracted structured data:", result);
  return result;
};

// Enhanced fallback extraction for non-structured responses
const extractFallbackData = (text: string): Partial<ProcessedDiseaseData> => {
  console.log("Using enhanced fallback extraction");
  
  const result: Partial<ProcessedDiseaseData> = {
    disease: "Unknown",
    confidence: 85,
    treatment: "",
    prevention: "",
    explanation: ""
  };
  
  // Try to extract disease name from various patterns
  const diseaseMatches = [
    text.match(/Disease:?\s*([^,.]*)/i),
    text.match(/disease name:?\s*([^,.]*)/i),
    text.match(/problem:?\s*([^,.]*)/i),
    text.match(/diagnosed as:?\s*([^,.]*)/i)
  ];
  
  const diseaseMatch = diseaseMatches.find(match => match !== null);
  if (diseaseMatch) result.disease = diseaseMatch[1].trim();
  
  // If "healthy" is mentioned, set as healthy
  if (text.toLowerCase().includes("healthy")) {
    result.disease = "Healthy";
    result.confidence = 95;
    result.treatment = "1. No treatment needed - your plant looks healthy\n2. Continue with current good practices\n3. Keep monitoring regularly for any changes";
    result.prevention = "• Continue with good farming practices\n• Maintain proper fertilization schedule\n• Keep fields clean and well-drained\n• Monitor plants regularly for any changes";
    result.explanation = "Your maize plant appears to be in good health with no signs of disease.";
  } else {
    // Extract any numbered lists for treatment
    const numberedItems = text.match(/\d+\.\s*[^.]+\./g);
    if (numberedItems && numberedItems.length > 0) {
      result.treatment = numberedItems.slice(0, 3).join('\n');
    } else {
      result.treatment = "1. Consult with a local agriculture expert for proper treatment guidance\n2. Monitor your crops regularly for disease symptoms\n3. Apply appropriate treatments as recommended by experts";
    }
    
    // Extract any bullet points for prevention
    const bulletItems = text.match(/[•-]\s*[^.]+\./g);
    if (bulletItems && bulletItems.length > 0) {
      result.prevention = bulletItems.slice(0, 4).join('\n');
    } else {
      result.prevention = "• Maintain good field hygiene and proper plant spacing\n• Use disease-resistant seed varieties when available\n• Practice crop rotation to prevent disease spread\n• Keep fields clean and well-drained";
    }
    
    result.explanation = "A common maize disease that affects plant health and productivity.";
  }
  
  console.log("Fallback extraction result:", result);
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
    console.log("Processing Gemini response, length:", analysisText.length);
    
    // Try structured extraction first
    let diseaseData = extractStructuredSections(analysisText);
    
    // Clean and validate the extracted data
    const rawDisease = diseaseData.disease || "Unknown";
    const validatedDisease = validateDiseaseName(rawDisease);
    const validatedConfidence = validateConfidence(diseaseData.confidence);
    
    // Ensure we have treatment and prevention data
    const finalTreatment = diseaseData.treatment || 
      "1. We couldn't extract specific treatment advice from the analysis\n2. Please consult with a local agriculture expert\n3. Monitor your crops regularly for disease symptoms";
      
    const finalPrevention = diseaseData.prevention || 
      "• Maintain good field hygiene and proper plant spacing\n• Use disease-resistant seed varieties when available\n• Practice crop rotation to prevent disease spread\n• Keep fields clean and well-drained";
    
    const result = {
      disease: validatedDisease,
      confidence: validatedConfidence,
      treatment: formatTreatment(finalTreatment),
      prevention: formatPrevention(finalPrevention),
      explanation: diseaseData.explanation || "Disease information analysis completed."
    };
    
    console.log("Final processed result:", result);
    return result;
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
