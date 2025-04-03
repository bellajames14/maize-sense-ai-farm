
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const UPLOADTHING_SECRET = "sk_live_96f3f998cb1e07b7bb75b58cb03e04059830b4012f74999e7c3465da4a7bac75";
const UPLOADTHING_APP_ID = "12wli5d86w";

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
    const { fileUrl, fileName, fileType } = await req.json();
    
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
    
    return new Response(JSON.stringify(data), {
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
