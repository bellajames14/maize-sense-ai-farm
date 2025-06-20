
// Enhanced Gemini response parser for better treatment and prevention extraction
export interface ParsedGeminiResponse {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  explanation?: string;
}

export const parseGeminiResponse = (responseText: string): ParsedGeminiResponse => {
  console.log("Parsing Gemini response:", responseText);
  
  // Initialize with default values
  let result: ParsedGeminiResponse = {
    disease: "Unknown Disease",
    confidence: 0.5,
    treatment: "Consult with an agricultural expert for proper treatment recommendations.",
    prevention: "Follow good agricultural practices including proper spacing, regular monitoring, and appropriate fertilization."
  };

  try {
    // Try to extract structured data from the response
    const diseaseMatch = responseText.match(/(?:Disease|Condition|Problem):\s*([^\n]+)/i);
    const confidenceMatch = responseText.match(/(?:Confidence|Probability|Certainty):\s*(\d+(?:\.\d+)?)/i);
    const treatmentMatch = responseText.match(/(?:Treatment|Remedy|Solution|Action):\s*([\s\S]*?)(?=(?:Prevention|Tips|$))/i);
    const preventionMatch = responseText.match(/(?:Prevention|Tips|Recommendations|Future):\s*([\s\S]*?)$/i);

    // Extract disease name
    if (diseaseMatch) {
      result.disease = diseaseMatch[1].trim();
    }

    // Extract confidence
    if (confidenceMatch) {
      result.confidence = Math.min(parseFloat(confidenceMatch[1]), 1.0);
    }

    // Extract treatment with better cleaning
    if (treatmentMatch) {
      result.treatment = cleanText(treatmentMatch[1]);
    }

    // Extract prevention with better cleaning
    if (preventionMatch) {
      result.prevention = cleanText(preventionMatch[1]);
    }

    // Add explanation based on disease type
    if (result.disease.toLowerCase().includes('healthy')) {
      result.explanation = "Great news! Your maize plant appears healthy with no signs of disease.";
    } else if (result.disease.toLowerCase().includes('unknown') || result.disease.toLowerCase().includes('unrecognized')) {
      result.explanation = "We cannot clearly identify this plant. Please try a clearer photo or ask our AI assistant.";
    } else {
      result.explanation = `This appears to be ${result.disease}, a condition that can affect maize plant health.`;
    }

    console.log("Parsed Gemini result:", result);
    return result;

  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return result; // Return default values
  }
};

// Helper function to clean extracted text
const cleanText = (text: string): string => {
  return text
    .replace(/^\*+\s*/, '') // Remove leading asterisks
    .replace(/\*+$/, '') // Remove trailing asterisks
    .replace(/^\d+\.\s*/, '') // Remove leading numbers
    .replace(/^[-•]\s*/, '') // Remove bullet points
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
};
