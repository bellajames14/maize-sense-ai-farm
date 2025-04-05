
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

    // Use Gemini Vision to analyze the maize disease
    const diseaseResults = await analyzeMaizeDiseaseWithGemini(data.data[0].url);
    
    // Create Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Store the scan result in the database if userId is provided
    if (userId) {
      await supabaseClient.from('scans').insert({
        user_id: userId,
        image_url: data.data[0].url,
        disease_name: diseaseResults.disease,
        confidence: diseaseResults.confidence,
        affected_area_estimate: diseaseResults.affectedArea,
        treatment_tips: diseaseResults.treatment,
        prevention_tips: diseaseResults.prevention
      });
    }
    
    return new Response(JSON.stringify({
      uploadResult: data,
      diseaseAnalysis: diseaseResults
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Analyze maize disease using Gemini Vision API
async function analyzeMaizeDiseaseWithGemini(imageUrl) {
  try {
    console.log("Analyzing image with Gemini Vision:", imageUrl);
    
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    
    // Prepare the prompt for Gemini
    const prompt = `
      Analyze this maize plant image for diseases. 
      If you see any disease, provide the following information:
      1. Disease name
      2. Confidence level (as a percentage)
      3. Estimated affected area (as a percentage)
      4. Treatment recommendations
      5. Prevention tips
      
      If the plant appears healthy, say so.
      
      Format your response as JSON with the following fields:
      {
        "disease": "Disease name or Healthy",
        "confidence": 95,
        "affectedArea": "30%",
        "treatment": "Treatment recommendations",
        "prevention": "Prevention tips"
      }
    `;
    
    // Call Gemini Vision API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`,
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
            temperature: 0.4,
            topK: 32,
            topP: 1,
          }
        }),
      }
    );
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("Gemini Vision API error:", errorData);
      throw new Error(`Gemini Vision API error: ${JSON.stringify(errorData)}`);
    }
    
    const responseData = await geminiResponse.json();
    console.log("Gemini Vision response received");
    
    // Extract the text from the response
    if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
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
      } catch (e) {
        console.error("Failed to parse JSON from Gemini:", e);
        // Fall back to extraction from text
        diseaseData = extractDiseaseDataFromText(analysisText);
      }
    } else {
      // Fall back to extraction from text
      diseaseData = extractDiseaseDataFromText(analysisText);
    }
    
    return {
      disease: diseaseData.disease || "Unknown",
      confidence: parseFloat(diseaseData.confidence) || 85,
      affectedArea: diseaseData.affectedArea || "25%",
      treatment: diseaseData.treatment || "Consult with a local agricultural extension officer.",
      prevention: diseaseData.prevention || "Implement crop rotation and ensure proper plant spacing."
    };
    
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return {
      disease: "Analysis Error",
      confidence: 0,
      affectedArea: "Unknown",
      treatment: "Unable to analyze the image. Please try again with a clearer photo.",
      prevention: "Ensure good lighting and focus when taking photos of plants for diagnosis."
    };
  }
}

// Helper function to extract disease data from text when JSON parsing fails
function extractDiseaseDataFromText(text) {
  const result = {
    disease: "Unknown",
    confidence: 85,
    affectedArea: "25%",
    treatment: "Consult with a local agricultural extension officer.",
    prevention: "Implement crop rotation and ensure proper plant spacing."
  };
  
  // Try to extract disease name
  const diseaseMatch = text.match(/Disease:?\s*([^,.]*)/i) || 
                       text.match(/disease name:?\s*([^,.]*)/i);
  if (diseaseMatch) result.disease = diseaseMatch[1].trim();
  
  // If "healthy" is mentioned, set as healthy
  if (text.toLowerCase().includes("healthy")) {
    result.disease = "Healthy";
    result.confidence = 95;
    result.affectedArea = "0%";
    result.treatment = "No treatment necessary. Continue regular maintenance.";
    result.prevention = "Maintain regular fertilization, proper irrigation, and pest monitoring.";
  }
  
  // Try to extract confidence
  const confidenceMatch = text.match(/confidence:?\s*(\d+)/i) ||
                         text.match(/(\d+)%\s*confidence/i);
  if (confidenceMatch) result.confidence = parseInt(confidenceMatch[1]);
  
  // Try to extract affected area
  const areaMatch = text.match(/affected area:?\s*(\d+%)/i) ||
                    text.match(/(\d+)%\s*of the plant/i);
  if (areaMatch) result.affectedArea = areaMatch[1];
  
  // Try to extract treatment
  const treatmentMatch = text.match(/[Tt]reatment:?\s*([^.]*\.)/);
  if (treatmentMatch) result.treatment = treatmentMatch[1].trim();
  
  // Try to extract prevention
  const preventionMatch = text.match(/[Pp]revention:?\s*([^.]*\.)/);
  if (preventionMatch) result.prevention = preventionMatch[1].trim();
  
  return result;
}
