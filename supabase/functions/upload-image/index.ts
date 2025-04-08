
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
      return new Response(
        JSON.stringify({ 
          error: "Missing required file information" 
        }), 
        { 
          status: 200, // Return 200 to avoid Edge Function error but include error in body
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
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
        try {
          await saveScanResult(userId, publicUrl, diseaseResults);
          console.log("Scan results saved to database for user:", userId);
        } catch (dbError) {
          console.error("Error saving to database, but continuing with analysis:", dbError);
          // Continue with the response even if DB save fails
        }
      } else {
        console.log("No userId provided, skipping database save");
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
        diseaseAnalysis: {
          disease: "Analysis Error",
          confidence: 50,
          affectedArea: "Unknown",
          treatment: "We couldn't analyze your image. Please try again with a clearer photo.",
          prevention: "Take photos in good light and make sure the plant is clearly visible."
        }
      }), {
        status: 200, // Return 200 with error details in the response body
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  } catch (error) {
    console.error("Error processing image:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred during image analysis",
        errorType: error.name || "Unknown",
        diseaseAnalysis: {
          disease: "Analysis Error",
          confidence: 50,
          affectedArea: "Unknown",
          treatment: "We couldn't analyze your image due to a technical issue. Please try again later.",
          prevention: "Our system is currently experiencing issues. Please check back soon."
        }
      }),
      { 
        status: 200, // Return 200 with error details to avoid Edge Function error
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
