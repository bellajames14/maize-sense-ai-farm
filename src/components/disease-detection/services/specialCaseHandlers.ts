
import { validateDiseaseName } from './diseaseValidator';
import { ProcessedDiseaseData } from './responseProcessor';

// Handle special cases based on disease type
export const handleSpecialCases = (disease: string): ProcessedDiseaseData => {
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
