
// Gemini API service for disease detection recommendations

// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
const validateDiseaseName = (diseaseName: string): string => {
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
};

// Validate and normalize confidence value
const validateConfidence = (confidence: any): number => {
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
};

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
    
    // Clean and validate the extracted data
    const rawDisease = diseaseData.disease || "Unknown";
    const validatedDisease = validateDiseaseName(rawDisease);
    const validatedConfidence = validateConfidence(diseaseData.confidence);
    
    // Clean text fields
    const cleanText = (text: string) => text.replace(/\*/g, '').trim();
    
    return {
      disease: validatedDisease,
      confidence: validatedConfidence,
      treatment: cleanText(diseaseData.treatment || "Consult with a local agriculture expert for proper treatment guidance."),
      prevention: cleanText(diseaseData.prevention || "Maintain good field hygiene and proper plant spacing to prevent disease spread.")
    };
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    return {
      disease: "Analysis Error",
      confidence: 50,
      treatment: "We couldn't analyze your image properly. Please try again with a clearer photo.",
      prevention: "Take photos in good light showing clear symptoms on the plant."
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
    treatment: "Consult with a local agriculture expert for proper treatment guidance.",
    prevention: "Maintain good field hygiene and proper plant spacing to prevent disease spread."
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
    result.treatment = "No treatment needed. Your plant looks healthy.";
    result.prevention = "Continue with good farming practices to maintain plant health.";
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

// Ask Gemini for recommendations with improved validation
export const getGeminiRecommendations = async (diseaseName: string, confidence: number): Promise<{
  treatment: string;
  prevention: string;
}> => {
  try {
    // Prepare the prompt for Gemini with validation instructions
    const prompt = `
      You are a maize disease expert. A farmer has detected ${diseaseName} in their maize crop with ${confidence}% confidence.
      
      IMPORTANT VALIDATION RULES:
      1. Only provide advice for confirmed maize diseases
      2. Use simple, clear language that farmers can understand
      3. Focus on practical, affordable solutions
      4. Suggest locally available treatments when possible
      
      Please provide:
      1. Immediate treatment recommendations (what to do now)
      2. Prevention tips for future crops
      
      Format your response as:
      
      Treatment: [Provide 2-3 specific, actionable steps using simple language. Include organic and chemical options if appropriate.]
      
      Prevention: [Provide 2-3 prevention strategies focusing on good farming practices.]
      
      Keep language simple and practical for rural farmers.
    `;
    
    // Call Gemini API with validation
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
    
    // Extract treatment and prevention with validation
    const treatmentMatch = recommendationsText.match(/Treatment:?\s*([^]*?)(?=Prevention|$)/i);
    const preventionMatch = recommendationsText.match(/Prevention:?\s*([^]*?)(?=$)/i);
    
    return {
      treatment: treatmentMatch ? treatmentMatch[1].trim() : getDefaultRecommendations(diseaseName).treatment,
      prevention: preventionMatch ? preventionMatch[1].trim() : getDefaultRecommendations(diseaseName).prevention
    };
  } catch (error) {
    console.error("Error getting Gemini recommendations:", error);
    return getDefaultRecommendations(diseaseName);
  }
};

// Get default recommendations for known diseases
const getDefaultRecommendations = (diseaseName: string) => {
  const recommendations: Record<string, {treatment: string, prevention: string}> = {
    "Gray Leaf Spot": {
      treatment: "Remove infected leaves immediately. Apply copper-based fungicide every 7-14 days. Improve air circulation between plants.",
      prevention: "Plant resistant varieties. Rotate crops every 2-3 years. Avoid overhead watering. Maintain proper plant spacing."
    },
    "Common Rust": {
      treatment: "Apply fungicide containing propiconazole or tebuconazole. Remove infected leaves. Ensure good field drainage.",
      prevention: "Use resistant seed varieties. Avoid late planting. Maintain balanced fertilization with adequate potassium."
    },
    "Northern Corn Leaf Blight": {
      treatment: "Apply fungicide at first sign of disease. Remove crop residue after harvest. Improve field drainage.",
      prevention: "Use resistant hybrids. Practice crop rotation. Manage irrigation to avoid leaf wetness."
    },
    "Healthy": {
      treatment: "Continue current good practices. Monitor regularly for any signs of disease or pests.",
      prevention: "Maintain proper fertilization. Keep fields clean. Use quality seeds. Practice crop rotation."
    }
  };
  
  return recommendations[diseaseName] || {
    treatment: "Consult with your local agricultural extension officer for specific treatment recommendations for this disease.",
    prevention: "Practice good field hygiene, crop rotation, and use disease-resistant varieties when available."
  };
};

// Analyze image with Gemini API with improved validation
export const analyzeWithGemini = async (base64Image: string, detectedDisease?: string): Promise<{
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
}> => {
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
