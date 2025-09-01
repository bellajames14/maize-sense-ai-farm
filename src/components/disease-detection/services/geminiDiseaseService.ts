export interface DiseaseDetectionResult {
  disease: string;
  confidence: number;
  prevention: string;
  treatment: string;
  recommendations: string;
}

const MAIZE_DISEASES = [
  "Blight",
  "Common_Rust", 
  "Gray_Leaf_Spot",
  "Healthy",
  "maize ear rot",
  "maize fall armyworm", 
  "maize stem borer"
];

export const analyzeImageWithGemini = async (imageFile: File): Promise<DiseaseDetectionResult> => {
  try {
    console.log("Analyzing image with Gemini API");
    
    // Convert file to base64
    const base64Image = await fileToBase64(imageFile);
    
    const response = await fetch('https://sfsdfdcdethqjwtjrwpz.supabase.co/functions/v1/gemini-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        diseases: MAIZE_DISEASES
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      disease: data.disease || "Unknown",
      confidence: data.confidence || 0,
      prevention: data.prevention || "Follow good agricultural practices",
      treatment: data.treatment || "Consult with agricultural extension services", 
      recommendations: data.recommendations || "Monitor crop regularly and maintain proper field hygiene"
    };
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    
    return {
      disease: "Analysis Error",
      confidence: 0,
      prevention: "Take photos in good light and make sure the plant is clearly visible",
      treatment: "We couldn't analyze your image. Please try again with a clearer photo",
      recommendations: "Ensure image shows maize plant clearly"
    };
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};