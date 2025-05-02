
// Gemini API service for disease detection recommendations

// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Process the Gemini API response to extract disease data
export const processGeminiResponse = (analysisText: string): {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
} => {
  try {
    // Try to extract JSON
    let jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                    analysisText.match(/{[\s\S]*}/);
                    
    let diseaseData: Partial<{
      disease: string;
      confidence: number;
      treatment: string;
      prevention: string;
    }> = {};
    
    if (jsonMatch) {
      // Try to parse the JSON
      try {
        const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
        diseaseData = JSON.parse(jsonText);
        console.log("Successfully parsed disease data from JSON");
      } catch (e) {
        console.error("Failed to parse JSON from Gemini:", e);
        diseaseData = extractDiseaseDataFromText(analysisText);
      }
    } else {
      // Fall back to extraction from text
      console.log("No JSON found, falling back to text extraction");
      diseaseData = extractDiseaseDataFromText(analysisText);
    }
    
    // Clean text fields
    Object.keys(diseaseData).forEach(key => {
      if (typeof diseaseData[key] === 'string') {
        diseaseData[key] = (diseaseData[key] as string).replace(/\*/g, '');
      }
    });
    
    return {
      disease: diseaseData.disease || "Unknown",
      confidence: typeof diseaseData.confidence === 'number' ? diseaseData.confidence : 85,
      treatment: diseaseData.treatment || "Consult with a local agriculture helper.",
      prevention: diseaseData.prevention || "Keep plants spaced well and water at the base, not on leaves."
    };
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    return {
      disease: "Analysis Error",
      confidence: 50,
      treatment: "We couldn't analyze your image. Please try again with a clearer photo.",
      prevention: "Take photos in good light and make sure the plant is clearly visible."
    };
  }
};

// Helper function to extract disease data from text when JSON parsing fails
export const extractDiseaseDataFromText = (text: string): Partial<{
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
}> => {
  console.log("Extracting disease data from text");
  
  const result: Partial<{
    disease: string;
    confidence: number;
    treatment: string;
    prevention: string;
  }> = {
    disease: "Unknown",
    confidence: 85,
    treatment: "Consult with a local agriculture helper.",
    prevention: "Keep plants spaced well and water at the base, not on leaves."
  };
  
  // Try to extract disease name
  const diseaseMatch = text.match(/Disease:?\s*([^,.]*)/i) || 
                       text.match(/disease name:?\s*([^,.]*)/i) ||
                       text.match(/problem:?\s*([^,.]*)/i);
  if (diseaseMatch) result.disease = diseaseMatch[1].trim();
  
  // If "healthy" is mentioned, set as healthy
  if (text.toLowerCase().includes("healthy")) {
    result.disease = "Healthy";
    result.confidence = 95;
    result.treatment = "No treatment needed. Your plant looks good.";
    result.prevention = "Keep taking good care of your plants as you have been.";
  }
  
  // Try to extract confidence
  const confidenceMatch = text.match(/confidence:?\s*(\d+)/i) ||
                         text.match(/(\d+)%\s*confidence/i) ||
                         text.match(/(\d+)%\s*sure/i);
  if (confidenceMatch) result.confidence = parseInt(confidenceMatch[1]);
  
  // Try to extract treatment
  const treatmentMatch = text.match(/[Tt]reatment:?\s*([^.]*\.)/);
  if (treatmentMatch) result.treatment = treatmentMatch[1].trim();
  
  // Try to extract prevention
  const preventionMatch = text.match(/[Pp]revention:?\s*([^.]*\.)/);
  if (preventionMatch) result.prevention = preventionMatch[1].trim();
  
  console.log("Extracted disease data:", result);
  return result;
};

// Ask Gemini for recommendations
export const getGeminiRecommendations = async (diseaseName: string, confidence: number): Promise<{
  treatment: string;
  prevention: string;
}> => {
  try {
    // Prepare the prompt for Gemini
    const prompt = `
      I'm a farmer who has detected ${diseaseName} in my maize crop with ${confidence}% confidence. 
      
      Please provide:
      1. A very simple recommendation for what I should do (in very basic English any farmer can understand)
      2. Simple treatment tips that are practical and actionable for a rural farmer

      Keep your language extremely simple, practical and actionable. Write for someone who may have limited education.
      Focus on affordable solutions and locally available materials.
      Make sure treatments are safe and environmentally friendly.
      
      Format your response as:
      
      Recommendation: [simple recommendation]
      
      Treatment Tips: [simple actionable tips]
    `;
    
    // Call Gemini Vision API directly
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
      return {
        treatment: "Please consult with your local agricultural expert for advice on this disease.",
        prevention: "Keep your fields clean and plants well-spaced to reduce disease spread."
      };
    }
    
    const responseData = await response.json();
    
    // Extract the text from the response
    if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
      throw new Error("Unexpected response format from Gemini API");
    }
    
    const recommendationsText = responseData.candidates[0].content.parts[0].text;
    
    // Extract recommendation and treatment tips
    const recommendationMatch = recommendationsText.match(/Recommendation:?\s*([^]*?)(?=Treatment|$)/i);
    const treatmentMatch = recommendationsText.match(/Treatment Tips:?\s*([^]*?)(?=$)/i);
    
    return {
      treatment: recommendationMatch ? recommendationMatch[1].trim() : 
                "Please consult with your local agricultural expert for advice on this disease.",
      prevention: treatmentMatch ? treatmentMatch[1].trim() : 
                "Keep your fields clean and plants well-spaced to reduce disease spread."
    };
  } catch (error) {
    console.error("Error getting Gemini recommendations:", error);
    return {
      treatment: "Please consult with your local agricultural expert for advice on this disease.",
      prevention: "Keep your fields clean and plants well-spaced to reduce disease spread."
    };
  }
};

// Analyze image with Gemini API for unknown diseases or low confidence
export const analyzeWithGemini = async (base64Image: string, detectedDisease?: string): Promise<{
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
}> => {
  // Prepare the prompt for Gemini
  let prompt = `
    Analyze this maize/corn plant image for diseases. You are a maize farming expert helping farmers identify crop diseases.
    
    IMPORTANT:
    1. Focus ONLY on maize/corn diseases
    2. If the maize appears healthy, confidently state it's healthy
    3. Use very simple language suitable for farmers with limited technical knowledge
    4. Be specific about symptoms - describe what you see
    5. Provide practical treatment options using locally available solutions
    6. Include prevention tips that are realistic for small-scale farmers
  `;
  
  if (detectedDisease) {
    prompt += `\n\nNote: Our system detected "${detectedDisease}" with low confidence. Please confirm or suggest a more accurate diagnosis.`;
  } else {
    prompt += `\n\nNote: Our system couldn't identify the disease with high confidence. Please provide your expert analysis.`;
  }
  
  prompt += `
    Please format your response as plain JSON with these fields:
    {
      "disease": "Simple name of the disease or 'Healthy' if no disease found",
      "confidence": number between 50-100,
      "treatment": "Simple step-by-step treatment instructions that any farmer can understand",
      "prevention": "Basic prevention tips for future crops in simple language"
    }
    
    Keep all explanations brief and practical, focusing on actionable advice for farmers with limited resources.
  `;
  
  // Call Gemini Vision API
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
          maxOutputTokens: 2048
        }
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText || "Error calling Gemini API"}`);
  }
  
  const responseData = await response.json();
  
  // Extract the text from the response
  if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
    throw new Error("Unexpected response format from Gemini Vision API");
  }
  
  const analysisText = responseData.candidates[0].content.parts[0].text;
  
  // Process the response
  return processGeminiResponse(analysisText);
};
