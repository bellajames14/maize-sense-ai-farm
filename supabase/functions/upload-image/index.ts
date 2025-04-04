
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://sfsdfdcdethqjwtjrwpz.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc2RmZGNkZXRocWp3dGpyd3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzU1NDAsImV4cCI6MjA1OTI1MTU0MH0.o-LLkQhEW7QJhVPyrZKoNYOMHKNIGH_5NWMTnMILqKs";
const UPLOADTHING_SECRET = Deno.env.get("UPLOADTHING_SECRET") || "sk_live_96f3f998cb1e07b7bb75b58cb03e04059830b4012f74999e7c3465da4a7bac75";
const UPLOADTHING_APP_ID = Deno.env.get("UPLOADTHING_APP_ID") || "12wli5d86w";

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

    // Create Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Mock disease analysis based on the uploaded image
    // In a real app, this would use TensorFlow.js to analyze the image with the model
    const diseaseResults = analyzeMaizeDisease(data.data[0].url);
    
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

// Mock function to analyze maize disease from image
// In a production app, this would use TensorFlow.js to run inference using the mobilenetv2.h5 model
function analyzeMaizeDisease(imageUrl) {
  // Mock diseases with probabilities (would be replaced with actual model inference)
  const possibleDiseases = [
    {
      disease: "Northern Corn Leaf Blight",
      confidence: 92.5,
      affectedArea: "35%",
      treatment: "Apply fungicide containing azoxystrobin, pyraclostrobin, or propiconazole. Remove and destroy infected leaves if possible.",
      prevention: "Plant resistant varieties, rotate crops, and ensure proper spacing for airflow."
    },
    {
      disease: "Common Rust",
      confidence: 87.3,
      affectedArea: "25%",
      treatment: "Apply fungicides containing mancozeb, azoxystrobin, or pyraclostrobin at first sign of infection.",
      prevention: "Plant resistant hybrids, apply preventative fungicides when conditions favor rust, and maintain crop rotation."
    },
    {
      disease: "Gray Leaf Spot",
      confidence: 89.1,
      affectedArea: "30%",
      treatment: "Apply triazole or strobilurin fungicides. Remove crop debris from field after harvest.",
      prevention: "Plant resistant varieties, maintain crop rotation with non-host crops, and improve field drainage."
    },
    {
      disease: "Healthy",
      confidence: 96.2,
      affectedArea: "0%",
      treatment: "No treatment necessary. Continue regular maintenance.",
      prevention: "Maintain regular fertilization, proper irrigation, and pest monitoring."
    }
  ];
  
  // Select a random disease to simulate model prediction
  // In a real app, would use TensorFlow.js to analyze image
  const randomIndex = Math.floor(Math.random() * possibleDiseases.length);
  return possibleDiseases[randomIndex];
}
