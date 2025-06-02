
// Disease validation utilities for maize crop analysis

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
export function validateDiseaseName(diseaseName: string): string {
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
export function validateConfidence(confidence: any): number {
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

// Validate affected area
export function validateAffectedArea(affectedArea: string, diseaseName: string): string {
  if (affectedArea === "infinity" || affectedArea === "unknown" || !affectedArea) {
    return diseaseName === "Healthy" ? "0%" : "25%";
  }
  return affectedArea;
}
