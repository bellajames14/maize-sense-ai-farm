
// Service for interacting with the Gemini Vision API with enhanced validation

// Known maize diseases for validation
const KNOWN_MAIZE_DISEASES = [
  "Northern Corn Leaf Blight",
  "Common Rust", 
  "Gray Leaf Spot",
  "Southern Corn Leaf Blight",
  "Corn Smut",
  "Corn Ear Rot",
  "Diplodia Leaf Streak",
  "Corn Eyespot",
  "Anthracnose Leaf Blight",
  "Physoderma Brown Spot",
  "Bacterial Leaf Streak",
  "Goss's Bacterial Wilt",
  "Maize Lethal Necrosis",
  "Fall Armyworm",
  "Stem Borer",
  "Blight",
  "Healthy"
];

// Validate disease name against known diseases
function validateDiseaseName(diseaseName: string): string {
  const normalizedInput = diseaseName.toLowerCase().trim();
  
  // Check for exact matches first
  const exactMatch = KNOWN_MAIZE_DISEASES.find(disease => 
    disease.toLowerCase() === normalizedInput
  );
  if (exactMatch) return exactMatch;
  
  // Check for partial matches
  const partialMatch = KNOWN_MAIZE_DISEASES.find(disease => 
    disease.toLowerCase().includes(normalizedInput) || 
    normalizedInput.includes(disease.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  // Special case mappings for common misidentifications
  const mappings: Record<string, string> = {
    "cob rot": "Corn Ear Rot",
    "ear rot": "Corn Ear Rot",
    "grey leaf spot": "Gray Leaf Spot",
    "gray spot": "Gray Leaf Spot",
    "corn gray spot": "Gray Leaf Spot",
    "leaf blight": "Northern Corn Leaf Blight",
    "rust": "Common Rust",
    "army worm": "Fall Armyworm",
    "armyworm": "Fall Armyworm"
  };
  
  const mappedDisease = mappings[normalizedInput];
  if (mappedDisease) return mappedDisease;
  
  // If no match found, return the original name
  return diseaseName;
}

// Validate and normalize confidence value
function validateConfidence(confidence: any): number {
  if (typeof confidence === 'number' && confidence >= 0 && confidence <= 100) {
    return Math.round(confidence);
  }
  
  if (typeof confidence === 'string') {
    const numericValue = parseFloat(confidence.replace('%', ''));
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
      return Math.round(numericValue);
    }
  }
  
  // Default confidence for invalid values
  return 85;
}

export async function analyzeImageWithGemini(base64Image: string, apiKey: string): Promise<string> {
  // Prepare enhanced prompt with validation requirements
  const prompt = `
    You are an expert agricultural specialist analyzing a maize/corn plant image for diseases.
    
    CRITICAL VALIDATION REQUIREMENTS:
    1. ONLY identify diseases from this approved list: ${KNOWN_MAIZE_DISEASES.join(', ')}
    2. If plant appears healthy, respond with "Healthy"  
    3. Confidence MUST be a number between 50-100 (NEVER use "infinity", "unknown", or invalid values)
    4. Use simple language suitable for farmers
    5. Provide specific, actionable treatment advice
    
    ANALYSIS GUIDELINES:
    - Examine leaf spots, discoloration, lesions, and growth patterns carefully
    - Look for characteristic symptoms of common maize diseases
    - Consider plant health indicators and environmental factors
    - If symptoms are unclear, choose the most likely disease with appropriate confidence
    
    Respond in this EXACT JSON format:
    {
      "disease": "exact disease name from approved list or 'Healthy'",
      "confidence": valid_number_between_50_and_100,
      "affectedArea": "percentage like '25%' or '0%' for healthy",
      "treatment": "2-3 specific treatment steps in simple farmer language",
      "prevention": "2-3 prevention tips for future crops in simple language"
    }
    
    CRITICAL: Ensure all values are valid - confidence must be a number, not text or infinity.
  `;
  
  console.log("Sending validated request to Gemini API for maize disease analysis");
  
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
            temperature: 0.1, // Lower temperature for more deterministic responses
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024
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
    console.log("Raw analysis text:", analysisText.substring(0, 200) + "...");
    
    // Validate the response before returning
    try {
      // Try to parse the JSON to validate structure
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        analysisText.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(jsonText);
        
        // Validate and correct the parsed data
        parsedData.disease = validateDiseaseName(parsedData.disease || "Unknown");
        parsedData.confidence = validateConfidence(parsedData.confidence);
        
        // Ensure affectedArea is valid
        if (!parsedData.affectedArea || parsedData.affectedArea === "infinity") {
          parsedData.affectedArea = parsedData.disease === "Healthy" ? "0%" : "25%";
        }
        
        console.log("Validated analysis data:", parsedData);
        return JSON.stringify(parsedData);
      }
    } catch (parseError) {
      console.error("Error parsing/validating JSON:", parseError);
    }
    
    return analysisText;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Request to Gemini API timed out after 60 seconds");
    }
    console.error("Error calling Gemini API:", error);
    throw new Error(`Gemini API error: ${error.message || "Unknown error"}`);
  }
}
