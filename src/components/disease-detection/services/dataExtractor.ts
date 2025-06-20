
import { ProcessedDiseaseData } from './responseProcessor';

// Extract data from the structured Gemini response
export const extractStructuredData = (analysisText: string): ProcessedDiseaseData => {
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
