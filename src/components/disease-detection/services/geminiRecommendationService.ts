import { PredictionResult } from './localPredictionService';

export interface GeminiRecommendation {
  diseaseName: string;
  prevention: string;
  treatment: string;
  recommendations: string;
}

// Get recommendations from Gemini API
export const getGeminiRecommendations = async (
  predictionResult: PredictionResult
): Promise<GeminiRecommendation> => {
  try {
    console.log("Fetching Gemini recommendations for:", predictionResult.diseaseName);
    
    const response = await fetch('/functions/v1/gemini-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        diseaseName: predictionResult.diseaseName,
        confidence: predictionResult.confidence
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      diseaseName: data.diseaseName || predictionResult.diseaseName,
      prevention: data.prevention || "Follow good agricultural practices",
      treatment: data.treatment || "Consult with agricultural extension services",
      recommendations: data.recommendations || "Monitor crop regularly and maintain proper field hygiene"
    };
  } catch (error) {
    console.error("Error fetching Gemini recommendations:", error);
    
    // Return fallback recommendations
    return {
      diseaseName: predictionResult.diseaseName,
      prevention: "Implement crop rotation and use disease-resistant varieties",
      treatment: "Apply appropriate fungicides as recommended by agricultural experts",
      recommendations: "Regular monitoring and early detection are key to managing plant diseases"
    };
  }
};