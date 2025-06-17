
// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Get default recommendations for known diseases with Nigerian farmer-friendly formatting
const getDefaultRecommendations = (diseaseName: string) => {
  const recommendations: Record<string, {treatment: string, prevention: string}> = {
    "Gray Leaf Spot": {
      treatment: "1. Remove infected leaves immediately and burn them\n2. Apply copper-based fungicide every 7-14 days (ask for Copper Oxychloride at agro store)\n3. Improve air circulation by proper plant spacing",
      prevention: "• Plant resistant varieties when buying seeds\n• Rotate crops every 2-3 years (maize-cassava-beans)\n• Avoid overhead watering - water at soil level\n• Maintain proper plant spacing (75cm between rows)"
    },
    "Common Rust": {
      treatment: "1. Apply fungicide containing propiconazole or tebuconazole (ask for Score or Tilt at agro store)\n2. Remove infected leaves and burn them\n3. Ensure good field drainage to reduce moisture",
      prevention: "• Use resistant seed varieties from certified dealers\n• Avoid late planting (plant at start of rains)\n• Maintain balanced fertilization with adequate potassium\n• Remove crop residue after harvest"
    },
    "Northern Corn Leaf Blight": {
      treatment: "1. Apply fungicide at first sign of gray-brown spots (use Ridomil or Metalaxyl)\n2. Remove infected leaves immediately\n3. Improve field drainage to reduce leaf wetness",
      prevention: "• Use resistant hybrid seeds from trusted suppliers\n• Practice crop rotation (don't plant maize same place 2 years)\n• Manage irrigation to avoid leaf wetness\n• Clear all old maize stalks after harvest"
    },
    "Healthy": {
      treatment: "1. Continue current good practices\n2. Monitor regularly for any signs of disease or pests\n3. Maintain proper fertilization schedule",
      prevention: "• Maintain proper fertilization with NPK\n• Keep fields clean of weeds and debris\n• Use quality seeds from certified dealers\n• Practice crop rotation every season"
    }
  };
  
  return recommendations[diseaseName] || {
    treatment: "1. Consult with your local agricultural extension officer\n2. Take leaf samples to nearest agricultural office\n3. Apply general fungicide as temporary measure",
    prevention: "• Practice good field hygiene and crop rotation\n• Use disease-resistant varieties when available\n• Maintain proper plant spacing and drainage\n• Remove and burn infected plant material"
  };
};

// Ask Gemini for recommendations with Nigerian farmer-friendly formatting
export const getGeminiRecommendations = async (diseaseName: string, confidence: number): Promise<{
  treatment: string;
  prevention: string;
}> => {
  try {
    // Enhanced prompt for Nigerian farmer-focused advice with structured format
    const prompt = `
      You are an agricultural assistant for Nigerian maize farmers and agriculture students.
      
      A farmer has detected ${diseaseName} in their maize crop with ${confidence}% confidence.
      
      Provide advice in this EXACT structured format:

      💊 How to Treat It (Easy Steps)
      1. [First practical treatment step with local product names available in Nigeria]
      2. [Second treatment step with timing guidance]
      3. [Third step mentioning where to get supplies in Nigeria]

      🧑🏾‍🌾 Tips for Farmers or Students
      • [First prevention tip using Nigerian farming practices]
      • [Second tip about crop rotation or field management]
      • [Third tip about seeds or monitoring]
      • [Fourth tip about timing or weather considerations]

      IMPORTANT GUIDELINES:
      - Use simple English suitable for rural Nigerian farmers
      - Mention specific product names available in Nigeria (like Ridomil, Score, Copper Oxychloride)
      - Include timing guidance (early morning, after 2 weeks, during rainy season)
      - Mention where to get supplies (agro store, local dealer, agricultural office)
      - Be specific about actions relevant to Nigerian farming
      - Focus on affordable, locally available solutions
      - Consider Nigerian climate and farming seasons
      
      Keep the advice practical and culturally relevant for Nigerian farmers.
    `;
    
    // Call Gemini API with Nigerian farmer-focused prompt
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
    
    // Extract treatment from the structured format
    const treatmentMatch = recommendationsText.match(/💊\s*How to Treat[^💊🧑]*?\n((?:\d+\..*?\n?)+)/i);
    const preventionMatch = recommendationsText.match(/🧑🏾‍🌾\s*Tips for Farmers[^🧑]*?\n((?:•.*?\n?)+)/i);
    
    // Format the extracted text properly
    const formatTreatmentText = (text: string): string => {
      if (!text) return getDefaultRecommendations(diseaseName).treatment;
      return text.trim();
    };
    
    const formatPreventionText = (text: string): string => {
      if (!text) return getDefaultRecommendations(diseaseName).prevention;
      return text.trim();
    };
    
    return {
      treatment: treatmentMatch ? formatTreatmentText(treatmentMatch[1]) : getDefaultRecommendations(diseaseName).treatment,
      prevention: preventionMatch ? formatPreventionText(preventionMatch[1]) : getDefaultRecommendations(diseaseName).prevention
    };
  } catch (error) {
    console.error("Error getting Gemini recommendations:", error);
    return getDefaultRecommendations(diseaseName);
  }
};
