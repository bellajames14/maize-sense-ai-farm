
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://sfsdfdcdethqjwtjrwpz.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc2RmZGNkZXRocWp3dGpyd3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzU1NDAsImV4cCI6MjA1OTI1MTU0MH0.o-LLkQhEW7QJhVPyrZKoNYOMHKNIGH_5NWMTnMILqKs";
const UPLOADTHING_SECRET = Deno.env.get("UPLOADTHING_SECRET") || "sk_live_96f3f998cb1e07b7bb75b58cb03e04059830b4012f74999e7c3465da4a7bac75";
const UPLOADTHING_APP_ID = Deno.env.get("UPLOADTHING_APP_ID") || "12wli5d86w";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyCySmGu1aMdenR6_EwhN4tJMCnJhLhHKkw";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName, fileType, userId } = await req.json();
    
    if (!fileUrl || !fileName || !fileType) {
      throw new Error("Missing required file information");
    }
    
    console.log("Processing image upload:", fileName);
    
    // Create a proxy to UploadThing API
    const response = await fetch("https://uploadthing.com/api/uploadFiles", {
      method: "POST",
      headers: {
        "X-UploadThing-API-Key": UPLOADTHING_SECRET,
        "X-UploadThing-App-Id": UPLOADTHING_APP_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: [
          {
            name: fileName,
            type: fileType,
            url: fileUrl
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`UploadThing API error: ${errorData?.error || response.status}`);
    }
    
    const data = await response.json();
    console.log("Image uploaded successfully:", data.data[0].url);

    // Use Gemini Vision to analyze the crop disease
    const diseaseResults = await analyzeCropDiseaseWithGemini(data.data[0].url);
    
    // Create Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Store the scan result in the database if userId is provided
    if (userId) {
      try {
        await supabaseClient.from('scans').insert({
          user_id: userId,
          image_url: data.data[0].url,
          disease_name: diseaseResults.disease,
          confidence: diseaseResults.confidence,
          affected_area_estimate: diseaseResults.affectedArea,
          treatment_tips: diseaseResults.treatment,
          prevention_tips: diseaseResults.prevention
        });
        console.log("Scan results saved to database for user:", userId);
      } catch (dbError) {
        console.error("Error saving scan to database:", dbError);
      }
    }
    
    return new Response(JSON.stringify({
      uploadResult: data,
      diseaseAnalysis: diseaseResults
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Analyze crop disease using Gemini Vision API
async function analyzeCropDiseaseWithGemini(imageUrl) {
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
function extractDiseaseDataFromText(text) {
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
function cleanTextForFarmers(text) {
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
