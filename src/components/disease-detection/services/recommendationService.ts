// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Get default recommendations for known diseases with farmer-friendly formatting
const getDefaultRecommendations = (diseaseName: string) => {
  const recommendations: Record<string, {treatment: string, prevention: string}> = {
    "Gray Leaf Spot": {
      treatment: "1. Remove infected leaves immediately and burn them\n2. Apply copper-based fungicide every 7-14 days (ask for Copper Oxychloride at agro store)\n3. Improve air circulation by proper plant spacing\n4. Spray early morning or late evening for best results",
      prevention: "• Plant resistant varieties when buying seeds\n• Rotate crops every 2-3 years (maize-cassava-beans)\n• Avoid overhead watering - water at soil level\n• Maintain proper plant spacing (75cm between rows)"
    },
    "Common Rust": {
      treatment: "1. Apply fungicide containing propiconazole or tebuconazole (ask for Score or Tilt at agro store)\n2. Remove infected leaves and burn them\n3. Ensure good field drainage to reduce moisture\n4. Spray when you first see orange spots on leaves",
      prevention: "• Use resistant seed varieties from certified dealers\n• Avoid late planting (plant at start of rains)\n• Maintain balanced fertilization with adequate potassium\n• Remove crop residue after harvest"
    },
    "Northern Corn Leaf Blight": {
      treatment: "1. Apply fungicide at first sign of gray-brown spots (use Ridomil or Metalaxyl)\n2. Remove infected leaves immediately\n3. Improve field drainage to reduce leaf wetness\n4. Spray every 2 weeks if disease continues spreading",
      prevention: "• Use resistant hybrid seeds from trusted suppliers\n• Practice crop rotation (don't plant maize same place 2 years)\n• Manage irrigation to avoid leaf wetness\n• Clear all old maize stalks after harvest"
    },
    "Healthy": {
      treatment: "1. Continue current good practices\n2. Monitor regularly for any signs of disease or pests\n3. Maintain proper fertilization schedule\n4. Keep field clean and well-maintained",
      prevention: "• Maintain proper fertilization with NPK\n• Keep fields clean of weeds and debris\n• Use quality seeds from certified dealers\n• Practice crop rotation every season"
    }
  };
  
  return recommendations[diseaseName] || {
    treatment: "1. Consult with your local agricultural extension officer\n2. Take leaf samples to nearest agricultural office\n3. Apply general fungicide as temporary measure\n4. Monitor crops daily for changes",
    prevention: "• Practice good field hygiene and crop rotation\n• Use disease-resistant varieties when available\n• Maintain proper plant spacing and drainage\n• Remove and burn infected plant material"
  };
};

// Ask Gemini for recommendations with farmer-friendly formatting
export const getGeminiRecommendations = async (diseaseName: string, confidence: number): Promise<{
  treatment: string;
  prevention: string;
}> => {
  try {
    // Prepare the enhanced prompt for farmer-friendly advice
    const prompt = `
      You are a maize disease expert helping farmers. A farmer has detected ${diseaseName} in their maize crop with ${confidence}% confidence.
      
      IMPORTANT FORMATTING REQUIREMENTS:
      1. Use simple, clear language that rural farmers can understand
      2. Focus on practical, affordable solutions available locally
      3. Format treatment as numbered steps (1., 2., 3., 4.)
      4. Format prevention as bullet points (•)
      5. Mention specific product names when helpful (like Ridomil, Score, Copper Oxychloride)
      6. Include timing guidance (early morning, after 2 weeks, etc.)
      7. Mention where to get supplies (agro store, local dealer, agricultural office)
      
      CONTENT GUIDELINES:
      - Keep language simple and avoid technical jargon
      - Suggest both organic and chemical options when appropriate
      - Focus on what farmers can do immediately
      - Include cost-effective solutions for small-scale farmers
      
      Please provide:
      
      Treatment: [4 specific, actionable numbered steps in simple language. Include timing, application methods, and where to get materials.]
      
      Prevention: [4 prevention strategies as bullet points focusing on good farming practices, seed selection, and field management.]
      
      Remember: Write for farmers who may have limited technical knowledge but need practical solutions.
    `;
    
    // Call Gemini API with enhanced farmer-focused prompt
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
    
    // Extract and format treatment and prevention with better parsing
    const treatmentMatch = recommendationsText.match(/Treatment:?\s*([^]*?)(?=Prevention|$)/i);
    const preventionMatch = recommendationsText.match(/Prevention:?\s*([^]*?)(?=$)/i);
    
    // Format the extracted text properly
    const formatTreatmentText = (text: string): string => {
      if (!text) return getDefaultRecommendations(diseaseName).treatment;
      
      const cleaned = text.replace(/\*\*/g, '').trim();
      const lines = cleaned.split('\n').filter(line => line.trim());
      
      // If already numbered, return as is
      if (lines.some(line => /^\d+\./.test(line.trim()))) {
        return lines.join('\n');
      }
      
      // Otherwise format as numbered list
      const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 4);
      return sentences.map((sentence, index) => `${index + 1}. ${sentence.trim()}.`).join('\n');
    };
    
    const formatPreventionText = (text: string): string => {
      if (!text) return getDefaultRecommendations(diseaseName).prevention;
      
      const cleaned = text.replace(/\*\*/g, '').trim();
      const lines = cleaned.split('\n').filter(line => line.trim());
      
      // If already bulleted, return as is
      if (lines.some(line => /^[•-]/.test(line.trim()))) {
        return lines.join('\n');
      }
      
      // Otherwise format as bullet list
      const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 4);
      return sentences.map(sentence => `• ${sentence.trim()}.`).join('\n');
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
