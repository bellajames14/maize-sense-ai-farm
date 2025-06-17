
import { KNOWN_MAIZE_DISEASES } from './diseaseValidator';
import { processGeminiResponse, ProcessedDiseaseData } from './responseProcessor';

// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Analyze image with Gemini API using Nigerian farmer-focused prompt
export const analyzeWithGemini = async (base64Image: string, detectedDisease?: string): Promise<ProcessedDiseaseData> => {
  // Prepare the enhanced prompt for Nigerian farmers with structured format
  let prompt = `
    You are an agricultural assistant for a web app helping Nigerian maize farmers and agriculture students.

    A user uploaded a photo of a maize leaf, and it was classified by an AI model as:
    **Disease Name**: ${detectedDisease || "Unknown"}
    **Confidence Score**: 85%

    CRITICAL VALIDATION REQUIREMENTS:
    1. ONLY identify diseases from this approved list: ${KNOWN_MAIZE_DISEASES.join(', ')}
    2. If plant appears healthy, respond with "Healthy"
    3. Use simple, clear English suitable for rural farmers or students in Nigeria
    4. Be practical and culturally relevant to Nigerian farming practices
    
    Structure your response EXACTLY like this format:

    🌿 What is [DISEASE_NAME]?
    (Briefly explain what the disease is and what symptoms it shows on maize leaves in 1-2 simple sentences.)

    💊 How to Treat It (Easy Steps)
    1. [First practical treatment step with local product names]
    2. [Second treatment step with timing guidance]
    3. [Third step if needed, mentioning where to get supplies]

    🧑🏾‍🌾 Tips for Farmers or Students
    • [First prevention tip using local farming practices]
    • [Second tip about crop rotation or field management]
    • [Third tip about seeds or monitoring]
    • [Fourth tip about timing or weather considerations]

    LANGUAGE GUIDELINES:
    - Use simple words that Nigerian farmers understand
    - Mention specific fungicide names available in Nigeria (like Ridomil, Score, Ortiva)
    - Include timing guidance (early morning, after 2 weeks, during rainy season)
    - Mention where to get supplies (agro store, local dealer, agricultural office)
    - Be specific about actions (spray, remove, plant, rotate crops)
    - Avoid technical jargon and use practical language
    
    Do not repeat the confidence score or restate the disease name too many times. Keep the tone natural and helpful for Nigerian farmers.
  `;
  
  if (detectedDisease && detectedDisease !== "Unknown") {
    prompt += `\n\nNote: The AI model detected "${detectedDisease}". Please provide advice specifically for this disease.`;
  }
  
  try {
    // Call Gemini Vision API with Nigerian farmer-focused formatting
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
      throw new Error(`Analysis failed: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // Extract the text from the response
    if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
      throw new Error("Invalid response format from Gemini Vision API");
    }
    
    const analysisText = responseData.candidates[0].content.parts[0].text;
    console.log("Raw Gemini response:", analysisText);
    
    // Process the response with enhanced formatting
    const result = processGeminiResponse(analysisText);
    
    console.log("Validated analysis result:", result);
    return result;
    
  } catch (error) {
    console.error("Error analyzing with Gemini:", error);
    return {
      disease: "Analysis Error",
      confidence: 50,
      treatment: "1. Unable to analyze image properly\n2. Please ensure good lighting and clear view of plant symptoms\n3. Try taking another photo during daylight hours",
      prevention: "• Take photos during daylight with symptoms clearly visible\n• Make sure the plant fills most of the image\n• Avoid blurry or dark photos for better analysis"
    };
  }
};
