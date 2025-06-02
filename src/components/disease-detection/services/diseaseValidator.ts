
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
export const validateDiseaseName = (diseaseName: string): string => {
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
  
  // If no match found, return the original name
  return diseaseName;
};

// Validate and normalize confidence value
export const validateConfidence = (confidence: any): number => {
  if (typeof confidence === 'number' && confidence >= 0 && confidence <= 100) {
    return Math.round(confidence);
  }
  
  if (typeof confidence === 'string') {
    const numericValue = parseFloat(confidence.replace('%', ''));
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
      return Math.round(numericValue);
    }
  }
  
  // Default confidence for invalid values
  return 85;
};

export { KNOWN_MAIZE_DISEASES };
