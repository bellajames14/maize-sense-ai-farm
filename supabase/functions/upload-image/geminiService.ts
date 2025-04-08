
// Service for interacting with the Gemini Vision API
export async function analyzeImageWithGemini(base64Image: string, apiKey: string): Promise<string> {
  // Prepare the prompt for Gemini with special focus on crop diseases
  const prompt = `
    Analyze this crop image for diseases. You are a farming expert helping farmers who may not have much formal education.
    
    IMPORTANT:
    1. Identify if there's any disease visible in the crop (focus on common crop diseases)
    2. Use very simple language - avoid technical terms completely
    3. Be very specific about what you see - "brown spots on leaves" instead of "leaf spot disease"
    4. Give practical treatment options using basic tools and locally available items
    5. Do NOT use asterisks (*) or any special formatting in your response
    
    Please format your response as plain JSON with these fields:
    {
      "disease": "Simple name of the problem or 'Healthy' if no disease found",
      "confidence": number between 50-100,
      "affectedArea": "Which part of plant is affected and how much (like 25%)",
      "treatment": "Simple step-by-step treatment instructions",
      "prevention": "Basic prevention tips"
    }
    
    Keep all explanations brief and use very simple language suitable for farmers with minimal education.
  `;
  
  console.log("Sending request to Gemini API");
  
  try {
    // Call Gemini Vision API with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
            temperature: 0.2,
            topK: 32,
            topP: 1,
          }
        }),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    console.log("Received response from Gemini API, status:", geminiResponse.status);
    
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini Vision API error response:", errorText);
      throw new Error(`Gemini Vision API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
    }
    
    const responseData = await geminiResponse.json();
    console.log("Gemini Vision response parsed successfully");
    
    // Extract the text from the response
    if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
      console.error("Unexpected response format:", JSON.stringify(responseData));
      throw new Error("Unexpected response format from Gemini Vision API");
    }
    
    const analysisText = responseData.candidates[0].content.parts[0].text;
    console.log("Analysis text extracted:", analysisText.substring(0, 100) + "...");
    
    return analysisText;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Request to Gemini API timed out after 30 seconds");
    }
    console.error("Error calling Gemini API:", error);
    throw new Error(`Gemini API error: ${error.message || "Unknown error"}`);
  }
}
