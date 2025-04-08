
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { uploadImageToStorage } from "./storage.ts";
import { analyzeCropDiseaseWithGemini } from "./gemini.ts";
import { saveScanResult } from "./database.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to analyze image");
    
    const { fileData, fileName, fileType, userId } = await req.json();
    
    if (!fileData || !fileName || !fileType) {
      console.error("Missing required file information");
      throw new Error("Missing required file information");
    }
    
    console.log("Processing image upload:", fileName);
    
    try {
      // Upload to Supabase Storage and get public URL
      const { publicUrl, uniqueFilePath } = await uploadImageToStorage(fileData, fileName, fileType, userId);
      
      console.log("Image uploaded successfully to Supabase Storage at:", publicUrl);
      
      // Use Gemini Vision to analyze the crop disease with the public URL
      const diseaseResults = await analyzeCropDiseaseWithGemini(publicUrl);
      console.log("Analysis completed successfully:", diseaseResults);
      
      // Store the scan result in the database if userId is provided
      if (userId) {
        await saveScanResult(userId, publicUrl, diseaseResults);
        console.log("Scan results saved to database for user:", userId);
      }
      
      return new Response(JSON.stringify({
        imageUrl: publicUrl,
        diseaseAnalysis: diseaseResults
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    } catch (innerError) {
      console.error("Error in processing:", innerError);
      
      // Return a more detailed error response
      return new Response(JSON.stringify({ 
        error: innerError.message || "An unknown error occurred during processing",
        details: {
          errorType: innerError.name,
          errorStack: innerError.stack
        }
      }), {
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  } catch (error) {
    console.error("Error processing image:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred during image analysis",
        errorType: error.name || "Unknown"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
