// Service for interacting with the Gemini Vision API
export async function analyzeImageWithGemini(base64Image: string, apiKey: string): Promise<string> {
  // Prepare the prompt for Gemini with special focus on maize/corn diseases
  const prompt = `
    Analyze this maize/corn plant image for diseases. You are a maize farming expert helping farmers identify crop diseases.
    
    IMPORTANT:
    1. Focus ONLY on maize/corn diseases such as:
       - Northern Corn Leaf Blight
       - Common Rust
       - Gray Leaf Spot
       - Southern Corn Leaf Blight
       - Corn Smut
       - Corn Ear Rot
       - Diplodia Leaf Streak
       - Corn Eyespot
       - Anthracnose Leaf Blight
       - Physoderma Brown Spot
       - Bacterial Leaf Streak
       - Goss's Bacterial Wilt
       - Maize Lethal Necrosis
    2. If the maize appears healthy, confidently state it's healthy
    3. Use very simple language suitable for farmers with limited technical knowledge
    4. Be specific about visual symptoms - describe what you see
    5. Provide practical treatment options using locally available solutions when possible
    6. Include prevention tips that are realistic for small-scale farmers
    
    Please format your response as plain JSON with these fields:
    {
      "disease": "Simple name of the disease or 'Healthy' if no disease found",
      "confidence": number between 50-100,
      "affectedArea": "Which part of plant is affected and approximate percentage",
      "treatment": "Simple step-by-step treatment instructions",
      "prevention": "Basic prevention tips for future crops"
    }
    
    Keep all explanations brief and practical, focusing on actionable advice for farmers.
  `;
  
  console.log("Sending request to Gemini API for maize disease analysis");
  
  try {
    // Call Gemini Vision API with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
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
            temperature: 0.1, // Lower temperature for more deterministic/factual responses
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048
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
      throw new Error("Request to Gemini API timed out after 60 seconds");
    }
    console.error("Error calling Gemini API:", error);
    throw new Error(`Gemini API error: ${error.message || "Unknown error"}`);
  }
}



