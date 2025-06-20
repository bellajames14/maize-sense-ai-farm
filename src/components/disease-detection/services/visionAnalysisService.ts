
import { KNOWN_MAIZE_DISEASES } from './diseaseValidator';
import { processGeminiResponse, ProcessedDiseaseData } from './responseProcessor';

// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Simple and direct prompt for Nigerian farmers
const createAnalysisPrompt = (detectedDisease?: string) => {
  let prompt = `You are an agriculture expert helping Nigerian maize farmers and students.

A farmer uploaded a photo of a maize plant. Analyze it and respond in this EXACT format:

🌿 **What is this?**
[Write the disease name OR "Healthy" if plant looks good]

📊 **How sure are we?**
[Write confidence percentage like "85%"]

💊 **How to Treat It (Easy Steps)**
1. [First treatment step with local Nigerian products]
2. [Second treatment step with timing]
3. [Third step about where to get supplies]

🧑🏾‍🌾 **Tips for Farmers**
• [First prevention tip]
• [Second tip about crop management]
• [Third tip about monitoring]
• [Fourth tip about farming practices]

IMPORTANT RULES:
- Only use these disease names: ${KNOWN_MAIZE_DISEASES.join(', ')}
- If plant looks healthy, write "Healthy" as disease name
- If you can't identify it clearly, write "Unrecognized Plant"
- Use simple English for Nigerian farmers
- Mention local products available in Nigeria
- Be specific about timing and locations to buy supplies`;

  if (detectedDisease && detectedDisease !== "Unknown") {
    prompt += `\n\nNote: Our AI model detected "${detectedDisease}". Please verify and provide advice for this condition.`;
  }

  return prompt;
};

// Analyze image with Gemini API
export const analyzeWithGemini = async (base64Image: string, detectedDisease?: string): Promise<ProcessedDiseaseData> => {
  const prompt = createAnalysisPrompt(detectedDisease);
  
  try {
    console.log("Sending analysis request to Gemini...");
    
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
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generation_config: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Gemini API failed: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
      throw new Error("Invalid response from Gemini API");
    }
    
    const analysisText = responseData.candidates[0].content.parts[0].text;
    console.log("Raw Gemini response:", analysisText);
    
    // Process the structured response
    const result = processGeminiResponse(analysisText);
    
    console.log("Final processed result:", result);
    return result;
    
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return {
      disease: "Analysis Error",
      confidence: 50,
      treatment: "1. We couldn't analyze your image properly\n2. Please try again with a clearer photo in good lighting\n3. Make sure the plant symptoms are clearly visible",
      prevention: "• Take photos during daylight with clear view of leaves\n• Ensure the plant fills most of the image frame\n• Avoid blurry or dark photos for better results\n• You can also ask our AI chat assistant for help",
      explanation: "Unable to analyze the uploaded image. Please try again with a clearer photo or use our AI chat assistant for help."
    };
  }
};
