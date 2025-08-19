
// Map API disease names to farmer-friendly names
export const diseaseNameMapping: Record<string, string> = {
  "Maize Ear Rot": "Cob Rot",
  "Fall Armyworm": "Army Worm",
  "Stem Borer": "Stem Drill Worm",
  "Common Rust": "Rust Spots",
  "Gray Leaf Spot": "Grey Leaf Disease",
  "Blight": "Leaf Blight",
  "Healthy": "Healthy Plant"
};

// List of known diseases - must match model output order exactly
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
