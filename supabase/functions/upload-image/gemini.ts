
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyCySmGu1aMdenR6_EwhN4tJMCnJhLhHKkw";

// Analyze crop disease using Gemini Vision API
export async function analyzeCropDiseaseWithGemini(imageUrl: string) {
  try {
    console.log("Analyzing crop image with Gemini Vision:", imageUrl);
    
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    
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
    
    // Call Gemini Vision API
    const geminiResponse = await fetch(
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
            temperature: 0.2,
            topK: 32,
            topP: 1,
          }
        }),
      }
    );
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("Gemini Vision API error response:", errorData);
      throw new Error(`Gemini Vision API error: ${errorData?.error?.message || geminiResponse.statusText}`);
    }
    
    const responseData = await geminiResponse.json();
    console.log("Gemini Vision response received");
    
    // Extract the text from the response
    if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
      console.error("Unexpected response format:", JSON.stringify(responseData));
      throw new Error("Unexpected response format from Gemini Vision API");
    }
    
    const analysisText = responseData.candidates[0].content.parts[0].text;
    
    // Extract the JSON from the response text
    let jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                    analysisText.match(/{[\s\S]*}/);
                    
    let diseaseData;
    
    if (jsonMatch) {
      // Try to parse the JSON
      try {
        const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
        diseaseData = JSON.parse(jsonText);
        console.log("Successfully parsed disease data:", diseaseData);
      } catch (e) {
        console.error("Failed to parse JSON from Gemini:", e);
        // Fall back to extraction from text
        diseaseData = extractDiseaseDataFromText(analysisText);
      }
    } else {
      // Fall back to extraction from text
      diseaseData = extractDiseaseDataFromText(analysisText);
    }

    // Clean any asterisks or special formatting from the text fields
    if (diseaseData.treatment) {
      diseaseData.treatment = cleanTextForFarmers(diseaseData.treatment);
    }
    
    if (diseaseData.prevention) {
      diseaseData.prevention = cleanTextForFarmers(diseaseData.prevention);
    }
    
    if (diseaseData.disease) {
      diseaseData.disease = cleanTextForFarmers(diseaseData.disease);
    }
    
    return {
      disease: diseaseData.disease || "Unknown",
      confidence: parseFloat(diseaseData.confidence) || 85,
      affectedArea: diseaseData.affectedArea || "25%",
      treatment: diseaseData.treatment || "Consult with a local agriculture helper.",
      prevention: diseaseData.prevention || "Keep plants spaced well and water at the base, not on leaves."
    };
    
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return {
      disease: "Analysis Error",
      confidence: 0,
      affectedArea: "Unknown",
      treatment: "We couldn't analyze your image. Please try again with a clearer photo.",
      prevention: "Take photos in good light and make sure the plant is clearly visible."
    };
  }
}

// Helper function to extract disease data from text when JSON parsing fails
function extractDiseaseDataFromText(text: string) {
  console.log("Extracting disease data from text:", text);
  
  const result = {
    disease: "Unknown",
    confidence: 85,
    affectedArea: "25%",
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
    result.affectedArea = "0%";
    result.treatment = "No treatment needed. Your plant looks good.";
    result.prevention = "Keep taking good care of your plants as you have been.";
  }
  
  // Try to extract confidence
  const confidenceMatch = text.match(/confidence:?\s*(\d+)/i) ||
                         text.match(/(\d+)%\s*confidence/i) ||
                         text.match(/(\d+)%\s*sure/i);
  if (confidenceMatch) result.confidence = parseInt(confidenceMatch[1]);
  
  // Try to extract affected area
  const areaMatch = text.match(/affected area:?\s*(\d+%)/i) ||
                    text.match(/(\d+)%\s*of the plant/i) ||
                    text.match(/about (\d+)%/i);
  if (areaMatch) result.affectedArea = areaMatch[1];
  
  // Try to extract treatment
  const treatmentMatch = text.match(/[Tt]reatment:?\s*([^.]*\.)/);
  if (treatmentMatch) result.treatment = treatmentMatch[1].trim();
  
  // Try to extract prevention
  const preventionMatch = text.match(/[Pp]revention:?\s*([^.]*\.)/);
  if (preventionMatch) result.prevention = preventionMatch[1].trim();
  
  console.log("Extracted disease data:", result);
  return result;
}

// Clean text by removing asterisks and markdown formatting
function cleanTextForFarmers(text: string) {
  if (!text) return text;
  
  // Remove asterisks used for emphasis
  let cleanedText = text.replace(/\*\*?(.*?)\*\*?/g, "$1");
  
  // Replace markdown bullet points with simple dashes
  cleanedText = cleanedText.replace(/\* /g, "- ");
  
  // Replace complex words with simpler alternatives
  const simpleWordReplacements = {
    "fertilizer": "plant food",
    "pesticide": "bug spray",
    "herbicide": "weed killer",
    "fungicide": "plant medicine",
    "irrigation": "watering",
    "cultivation": "growing",
    "precipitation": "rain",
    "utilize": "use",
    "implement": "use",
    "appropriate": "right",
    "sufficient": "enough",
    "immediately": "now",
    "subsequently": "after that",
    "approximately": "about",
    "significantly": "a lot",
    "initiate": "start",
    "terminate": "end",
    "commence": "begin",
    "nitrogen": "plant food",
    "nutrient deficiency": "not enough food for plants",
    "dormant": "sleeping",
    "propagation": "growing new plants",
    "germination": "seed starting"
  };
  
  // Apply word replacements
  Object.keys(simpleWordReplacements).forEach(complexWord => {
    const regex = new RegExp(`\\b${complexWord}\\b`, "gi");
    cleanedText = cleanedText.replace(regex, simpleWordReplacements[complexWord]);
  });
  
  return cleanedText;
}
