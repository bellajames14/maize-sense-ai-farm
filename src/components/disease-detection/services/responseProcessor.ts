
import { validateDiseaseName, validateConfidence } from './diseaseValidator';

export interface ProcessedDiseaseData {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  explanation?: string;
}

// Extract data from the structured Gemini response
const extractStructuredData = (analysisText: string): ProcessedDiseaseData => {
  console.log("Processing structured Gemini response");
  
  const result: ProcessedDiseaseData = {
    disease: "Unknown",
    confidence: 85,
    treatment: "",
    prevention: "",
    explanation: ""
  };
  
  // Extract disease name from "What is this?" section
  const diseaseMatches = [
    analysisText.match(/🌿\s*\*\*What is this\?\*\*\s*\n([^\n]+)/i),
    analysisText.match(/What is this\?\s*\n([^\n]+)/i),
    analysisText.match(/🌿[^*]*\*\*\s*\n([^\n]+)/i)
  ];
  
  const diseaseMatch = diseaseMatches.find(match => match !== null);
  if (diseaseMatch) {
    result.disease = diseaseMatch[1].trim().replace(/[\[\]]/g, '');
    console.log("Extracted disease:", result.disease);
  }
  
  // Extract confidence from "How sure are we?" section
  const confidenceMatches = [
    analysisText.match(/📊\s*\*\*How sure are we\?\*\*\s*\n([^\n]+)/i),
    analysisText.match(/How sure are we\?\s*\n([^\n]+)/i),
    analysisText.match(/(\d+)%/i)
  ];
  
  const confidenceMatch = confidenceMatches.find(match => match !== null);
  if (confidenceMatch) {
    const confText = confidenceMatch[1] || confidenceMatch[0];
    const confNumber = parseInt(confText.match(/\d+/)?.[0] || "85");
    result.confidence = confNumber;
    console.log("Extracted confidence:", result.confidence);
  }
  
  // Extract treatment from "How to Treat It" section
  const treatmentMatches = [
    analysisText.match(/💊\s*\*\*How to Treat It[^*]*\*\*\s*\n((?:\d+\..*?(?:\n|$))+)/si),
    analysisText.match(/How to Treat It[^💊🧑]*?\n((?:\d+\..*?(?:\n|$))+)/si)
  ];
  
  const treatmentMatch = treatmentMatches.find(match => match !== null);
  if (treatmentMatch) {
    result.treatment = treatmentMatch[1].trim();
    console.log("Extracted treatment:", result.treatment);
  }
  
  // Extract prevention from "Tips for Farmers" section
  const preventionMatches = [
    analysisText.match(/🧑🏾‍🌾\s*\*\*Tips for Farmers\*\*\s*\n((?:•.*?(?:\n|$))+)/si),
    analysisText.match(/Tips for Farmers[^🧑]*?\n((?:•.*?(?:\n|$))+)/si)
  ];
  
  const preventionMatch = preventionMatches.find(match => match !== null);
  if (preventionMatch) {
    result.prevention = preventionMatch[1].trim();
    console.log("Extracted prevention:", result.prevention);
  }
  
  return result;
};

// Handle special cases based on disease type
const handleSpecialCases = (disease: string): ProcessedDiseaseData => {
  const normalizedDisease = disease.toLowerCase().trim();
  
  // Case 1: Healthy plant
  if (normalizedDisease === "healthy" || normalizedDisease.includes("healthy")) {
    return {
      disease: "Healthy",
      confidence: 95,
      treatment: "1. No treatment needed - your maize plant looks healthy!\n2. Continue with your current good farming practices\n3. Keep monitoring your plants regularly for any changes",
      prevention: "• Maintain proper fertilization with NPK as needed\n• Keep your field clean and free from weeds\n• Use quality seeds from certified dealers\n• Practice crop rotation to maintain soil health",
      explanation: "Great news! Your maize plant appears to be in excellent health with no signs of disease."
    };
  }
  
  // Case 2: Unrecognized plant
  if (normalizedDisease === "unrecognized plant" || normalizedDisease.includes("unrecognized") || normalizedDisease.includes("cannot identify")) {
    return {
      disease: "Unrecognized Plant",
      confidence: 50,
      treatment: "1. This plant cannot be clearly identified from the photo\n2. Try taking a clearer photo in good daylight\n3. Ask our AI chat assistant for help with plant identification",
      prevention: "• Take photos during daylight with symptoms clearly visible\n• Make sure the plant fills most of the image\n• Use our AI chat assistant for detailed plant questions\n• Consult with local agricultural extension officers",
      explanation: "We cannot clearly identify this plant from the uploaded image. Please try a clearer photo or use our AI chat assistant for help."
    };
  }
  
  // Case 3: Analysis error
  if (normalizedDisease === "analysis error" || normalizedDisease.includes("error")) {
    return {
      disease: "Analysis Error",
      confidence: 50,
      treatment: "1. There was an error analyzing your image\n2. Please try uploading a clearer photo\n3. You can ask our AI chat assistant for help",
      prevention: "• Ensure good lighting when taking photos\n• Make sure plant symptoms are clearly visible\n• Try again with a different angle or closer view\n• Use our AI chat assistant for additional support",
      explanation: "We encountered an error while analyzing your image. Please try again or use our AI chat assistant."
    };
  }
  
  return {
    disease: validateDiseaseName(disease),
    confidence: 85,
    treatment: "1. Consult with local agricultural extension officers\n2. Show them the affected plant parts\n3. Apply recommended treatments as advised",
    prevention: "• Practice good field hygiene and plant spacing\n• Use certified disease-resistant seed varieties\n• Implement proper crop rotation practices\n• Monitor plants regularly for early detection",
    explanation: `This appears to be ${validateDiseaseName(disease)}, a condition that affects maize plants.`
  };
};

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
