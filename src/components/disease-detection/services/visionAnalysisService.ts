
import { KNOWN_MAIZE_DISEASES } from './diseaseValidator';
import { processGeminiResponse, ProcessedDiseaseData } from './responseProcessor';

// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Analyze image with Gemini API with improved validation
export const analyzeWithGemini = async (base64Image: string, detectedDisease?: string): Promise<ProcessedDiseaseData> => {
  // Prepare the prompt for Gemini with strict validation rules
  let prompt = `
    You are an expert agricultural specialist analyzing a maize/corn plant image for diseases.
    
    CRITICAL VALIDATION REQUIREMENTS:
    1. ONLY identify diseases from this list: ${KNOWN_MAIZE_DISEASES.join(', ')}
    2. If plant appears healthy, respond with "Healthy"
    3. Confidence must be a number between 50-100 (never use "infinity" or invalid values)
    4. Use simple language for farmers
    5. Provide specific, actionable advice
    
    ANALYSIS REQUIREMENTS:
    - Examine leaf spots, discoloration, lesions, and growth patterns
    - Look for characteristic symptoms of common maize diseases
    - Consider environmental factors that might affect diagnosis
  `;
  
  if (detectedDisease && detectedDisease !== "Unknown") {
    prompt += `\n\nNote: Initial detection suggested "${detectedDisease}". Please verify or correct this diagnosis based on visual evidence.`;
  }
  
  prompt += `
    Respond in this EXACT JSON format:
    {
      "disease": "exact disease name from the approved list above or 'Healthy'",
      "confidence": number between 50-100,
      "treatment": "2-3 specific treatment steps in simple language",
      "prevention": "2-3 prevention tips for future crops"
    }
    
    IMPORTANT: Ensure confidence is a valid number, not "infinity" or any text.
  `;
  
  try {
    // Call Gemini Vision API with validation
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
    
    // Process the response with validation
    const result = processGeminiResponse(analysisText);
    
    console.log("Validated analysis result:", result);
    return result;
    
  } catch (error) {
    console.error("Error analyzing with Gemini:", error);
    return {
      disease: "Analysis Error",
      confidence: 50,
      treatment: "Unable to analyze image. Please ensure good lighting and clear view of plant symptoms.",
      prevention: "Take photos during daylight with symptoms clearly visible for better analysis."
    };
  }
};
