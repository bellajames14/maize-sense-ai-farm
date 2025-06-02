
import { textUtils } from "./textUtils.ts";

export interface DiseaseAnalysisResult {
  disease: string;
  confidence: number;
  affectedArea: string;
  treatment: string;
  prevention: string;
}

// Known maize diseases for validation
const KNOWN_MAIZE_DISEASES = [
  "Northern Corn Leaf Blight",
  "Common Rust", 
  "Gray Leaf Spot",
  "Southern Corn Leaf Blight",
  "Corn Smut",
  "Corn Ear Rot",
  "Diplodia Leaf Streak",
  "Corn Eyespot",
  "Anthracnose Leaf Blight",
  "Physoderma Brown Spot",
  "Bacterial Leaf Streak",
  "Goss's Bacterial Wilt",
  "Maize Lethal Necrosis",
  "Fall Armyworm",
  "Stem Borer",
  "Blight",
  "Healthy"
];

// Validate disease name against known diseases
function validateDiseaseName(diseaseName: string): string {
  const normalizedInput = diseaseName.toLowerCase().trim();
  
  // Check for exact matches first
  const exactMatch = KNOWN_MAIZE_DISEASES.find(disease => 
    disease.toLowerCase() === normalizedInput
  );
  if (exactMatch) return exactMatch;
  
  // Check for partial matches
  const partialMatch = KNOWN_MAIZE_DISEASES.find(disease => 
    disease.toLowerCase().includes(normalizedInput) || 
    normalizedInput.includes(disease.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  // Special case mappings for common misidentifications
  const mappings: Record<string, string> = {
    "cob rot": "Corn Ear Rot",
    "ear rot": "Corn Ear Rot", 
    "grey leaf spot": "Gray Leaf Spot",
    "gray spot": "Gray Leaf Spot",
    "corn gray spot": "Gray Leaf Spot",
    "leaf blight": "Northern Corn Leaf Blight",
    "rust": "Common Rust",
    "army worm": "Fall Armyworm",
    "armyworm": "Fall Armyworm"
  };
  
  const mappedDisease = mappings[normalizedInput];
  if (mappedDisease) return mappedDisease;
  
  // If no valid match found, return Unknown
  return "Unknown";
}

// Validate and normalize confidence value
function validateConfidence(confidence: any): number {
  // Handle various input types
  if (typeof confidence === 'number') {
    if (confidence >= 0 && confidence <= 100) {
      return Math.round(confidence);
    }
    // Handle confidence values greater than 100 (assume they're percentages)
    if (confidence > 100 && confidence <= 10000) {
      return Math.round(confidence / 100);
    }
  }
  
  if (typeof confidence === 'string') {
    // Handle string values like "85%", "infinity", etc.
    const cleanValue = confidence.toLowerCase().replace(/[^\d.]/g, '');
    const numericValue = parseFloat(cleanValue);
    
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
      return Math.round(numericValue);
    }
  }
  
  // Default confidence for invalid values (including "infinity")
  console.log("Invalid confidence value received:", confidence, "- using default 85");
  return 85;
}

// Process the Gemini API response text to extract disease data
export async function processGeminiResponse(analysisText: string): Promise<DiseaseAnalysisResult> {
  console.log("Processing Gemini response with validation and formatting");
  
  // Extract the JSON from the response text
  let jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                  analysisText.match(/{[\s\S]*}/);
                  
  let diseaseData: Partial<DiseaseAnalysisResult> = {};
  
  if (jsonMatch) {
    // Try to parse the JSON
    try {
      const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
      diseaseData = JSON.parse(jsonText);
      console.log("Successfully parsed disease data from JSON:", diseaseData);
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

  // Validate and clean the data
  const validatedDisease = validateDiseaseName(diseaseData.disease || "Unknown");
  const validatedConfidence = validateConfidence(diseaseData.confidence);
  
  // Format treatment and prevention text properly
  const formattedTreatment = diseaseData.treatment ? 
    textUtils.formatTreatmentSteps(diseaseData.treatment) : 
    "1. Consult with a local agriculture expert for proper treatment guidance.\n2. Monitor your crops regularly for disease symptoms.\n3. Apply appropriate treatments as recommended by experts.";
    
  const formattedPrevention = diseaseData.prevention ? 
    textUtils.formatPreventionTips(diseaseData.prevention) : 
    "• Practice good field hygiene and proper plant spacing.\n• Use disease-resistant seed varieties when available.\n• Implement crop rotation to break disease cycles.";
  
  // Validate affected area
  let affectedArea = diseaseData.affectedArea || "25%";
  if (affectedArea === "infinity" || affectedArea === "unknown") {
    affectedArea = validatedDisease === "Healthy" ? "0%" : "25%";
  }
  
  const result: DiseaseAnalysisResult = {
    disease: validatedDisease,
    confidence: validatedConfidence,
    affectedArea: affectedArea,
    treatment: formattedTreatment,
    prevention: formattedPrevention
  };
  
  console.log("Final validated and formatted result:", result);
  return result;
}

// Helper function to extract disease data from text when JSON parsing fails
function extractDiseaseDataFromText(text: string): Partial<DiseaseAnalysisResult> {
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
  
  // Try to extract confidence with validation
  const confidenceMatch = text.match(/confidence:?\s*(\d+)/i) ||
                         text.match(/(\d+)%\s*confidence/i) ||
                         text.match(/(\d+)%\s*sure/i);
  if (confidenceMatch) {
    const confValue = parseInt(confidenceMatch[1]);
    result.confidence = validateConfidence(confValue);
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
