
// Map API disease names to farmer-friendly names
export const diseaseNameMapping: Record<string, string> = {
  "Blight": "Leaf Blight",
  "Common_Rust": "Rust Spots", 
  "Gray_Leaf_Spot": "Grey Leaf Disease",
  "Healthy": "Healthy Plant",
  "maize ear rot": "Cob Rot",
  "maize fall armyworm": "Army Worm",
  "maize stem borer": "Stem Drill Worm"
};

// List of known diseases - must match MobileNetV2 model output order exactly
export const knownDiseases = [
  "Blight",
  "Common_Rust",
  "Gray_Leaf_Spot", 
  "Healthy",
  "maize ear rot",
  "maize fall armyworm",
  "maize stem borer"
];

// Get the farmer-friendly name for a disease
export const getFarmerFriendlyName = (diseaseName: string): string => {
  return diseaseNameMapping[diseaseName] || diseaseName;
};

// Check if a disease is known
export const isKnownDisease = (diseaseName: string): boolean => {
  return knownDiseases.includes(diseaseName);
};

// Format confidence percentage
export const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence)}%`;
};
