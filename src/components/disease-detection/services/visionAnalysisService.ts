
import { KNOWN_MAIZE_DISEASES } from './diseaseValidator';
import { processGeminiResponse, ProcessedDiseaseData } from './responseProcessor';

// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Analyze image with Gemini API with improved farmer-friendly formatting
export const analyzeWithGemini = async (base64Image: string, detectedDisease?: string): Promise<ProcessedDiseaseData> => {
  // Prepare the enhanced prompt for Gemini with farmer-friendly formatting
  let prompt = `
    You are an expert agricultural specialist helping farmers analyze maize/corn plant diseases.
    
    CRITICAL VALIDATION REQUIREMENTS:
    1. ONLY identify diseases from this list: ${KNOWN_MAIZE_DISEASES.join(', ')}
    2. If plant appears healthy, respond with "Healthy"
    3. Confidence must be a number between 50-100
    4. Use simple, clear language that farmers and students can easily understand
    5. Format your response to be practical and actionable
    
    ANALYSIS REQUIREMENTS:
    - Examine leaf spots, discoloration, lesions, and growth patterns carefully
    - Look for characteristic symptoms of common maize diseases
    - Consider environmental factors that might affect diagnosis
  `;
  
  if (detectedDisease && detectedDisease !== "Unknown") {
    prompt += `\n\nNote: Initial detection suggested "${detectedDisease}". Please verify or correct this diagnosis based on visual evidence.`;
  }
  
  prompt += `
    Respond in this EXACT JSON format with farmer-friendly content:
    {
      "disease": "exact disease name from the approved list above or 'Healthy'",
      "confidence": number between 50-100,
      "treatment": "Write 3-4 simple treatment steps in plain language. Use numbered format (1., 2., 3.). Focus on practical actions farmers can take immediately. Mention specific fungicide names if relevant (like Ridomil, Score, Ortiva). Keep language simple.",
      "prevention": "Write 3-4 prevention tips in simple language. Use bullet format (•). Focus on practical farming practices like crop rotation, seed selection, field hygiene. Make it actionable for small-scale farmers."
    }
    
    LANGUAGE GUIDELINES:
    - Use simple words that farmers understand
    - Avoid technical jargon
    - Be specific about actions (spray, remove, plant, etc.)
    - Include timing guidance (early morning, after 2 weeks, etc.)
    - Mention where to get supplies (agro store, local dealer)
    
    IMPORTANT: Ensure confidence is a valid number, not "infinity" or any text.
  `;
  
  try {
    // Call Gemini Vision API with enhanced formatting
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
