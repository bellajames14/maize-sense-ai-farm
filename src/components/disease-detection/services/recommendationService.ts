
// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Get default recommendations for known diseases
const getDefaultRecommendations = (diseaseName: string) => {
  const recommendations: Record<string, {treatment: string, prevention: string}> = {
    "Gray Leaf Spot": {
      treatment: "Remove infected leaves immediately. Apply copper-based fungicide every 7-14 days. Improve air circulation between plants.",
      prevention: "Plant resistant varieties. Rotate crops every 2-3 years. Avoid overhead watering. Maintain proper plant spacing."
    },
    "Common Rust": {
      treatment: "Apply fungicide containing propiconazole or tebuconazole. Remove infected leaves. Ensure good field drainage.",
      prevention: "Use resistant seed varieties. Avoid late planting. Maintain balanced fertilization with adequate potassium."
    },
    "Northern Corn Leaf Blight": {
      treatment: "Apply fungicide at first sign of disease. Remove crop residue after harvest. Improve field drainage.",
      prevention: "Use resistant hybrids. Practice crop rotation. Manage irrigation to avoid leaf wetness."
    },
    "Healthy": {
      treatment: "Continue current good practices. Monitor regularly for any signs of disease or pests.",
      prevention: "Maintain proper fertilization. Keep fields clean. Use quality seeds. Practice crop rotation."
    }
  };
  
  return recommendations[diseaseName] || {
    treatment: "Consult with your local agricultural extension officer for specific treatment recommendations for this disease.",
    prevention: "Practice good field hygiene, crop rotation, and use disease-resistant varieties when available."
  };
};

// Ask Gemini for recommendations with improved validation
export const getGeminiRecommendations = async (diseaseName: string, confidence: number): Promise<{
  treatment: string;
  prevention: string;
}> => {
  try {
    // Prepare the prompt for Gemini with validation instructions
    const prompt = `
      You are a maize disease expert. A farmer has detected ${diseaseName} in their maize crop with ${confidence}% confidence.
      
      IMPORTANT VALIDATION RULES:
      1. Only provide advice for confirmed maize diseases
      2. Use simple, clear language that farmers can understand
      3. Focus on practical, affordable solutions
      4. Suggest locally available treatments when possible
      
      Please provide:
      1. Immediate treatment recommendations (what to do now)
      2. Prevention tips for future crops
      
      Format your response as:
      
      Treatment: [Provide 2-3 specific, actionable steps using simple language. Include organic and chemical options if appropriate.]
      
      Prevention: [Provide 2-3 prevention strategies focusing on good farming practices.]
      
      Keep language simple and practical for rural farmers.
    `;
    
    // Call Gemini API with validation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generation_config: {
            temperature: 0.2,
            topK: 32,
            topP: 1,
            maxOutputTokens: 800
          }
        })
      }
    );
    
    if (!response.ok) {
      console.error("Gemini API error:", await response.text());
      return getDefaultRecommendations(diseaseName);
    }
    
    const responseData = await response.json();
    
    // Extract the text from the response
    if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
      throw new Error("Unexpected response format from Gemini API");
    }
    
    const recommendationsText = responseData.candidates[0].content.parts[0].text;
    
    // Extract treatment and prevention with validation
    const treatmentMatch = recommendationsText.match(/Treatment:?\s*([^]*?)(?=Prevention|$)/i);
    const preventionMatch = recommendationsText.match(/Prevention:?\s*([^]*?)(?=$)/i);
    
    return {
      treatment: treatmentMatch ? treatmentMatch[1].trim() : getDefaultRecommendations(diseaseName).treatment,
      prevention: preventionMatch ? preventionMatch[1].trim() : getDefaultRecommendations(diseaseName).prevention
    };
  } catch (error) {
    console.error("Error getting Gemini recommendations:", error);
    return getDefaultRecommendations(diseaseName);
  }
};
