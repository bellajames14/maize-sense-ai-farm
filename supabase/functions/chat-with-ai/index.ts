
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { SUPABASE_URL, SUPABASE_ANON_KEY, corsHeaders } from "./config.ts";
import { generateAIResponse } from "./aiService.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, previousMessages = [], language = "english" } = await req.json();
    
    if (!message) {
      throw new Error("Message is required");
    }

    // Validate language parameter to prevent abuse
    const validLanguages = ["english", "yoruba"];
    const validatedLanguage = validLanguages.includes(language.toLowerCase()) 
      ? language.toLowerCase() 
      : "english";
    
    console.log(`Processing message in language: ${validatedLanguage}`);

    try {
      // Generate AI response with specified language
      const aiResponse = await generateAIResponse(message, previousMessages, validatedLanguage);

      // Create Supabase client
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Store the chat message and response in the database if userId is provided
      if (userId) {
        try {
          await supabaseClient.from('ai_chats').insert({
            user_id: userId,
            user_message: message,
            ai_response: aiResponse,
            language: validatedLanguage
          });
        } catch (dbError) {
          console.error("Error storing chat in database:", dbError);
          // Continue even if database storage fails
        }
      }
      
      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      
      // Check for specific error types
      const errorMessage = aiError.toString();
      
      if (errorMessage.includes("UNAVAILABLE") || errorMessage.includes("overloaded")) {
        return new Response(
          JSON.stringify({ 
            error: "AI service is currently unavailable. Please try again later.",
            errorDetails: errorMessage
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            error: "Error generating AI response",
            errorDetails: errorMessage
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
  } catch (error) {
    console.error("Error processing AI chat:", error);
    return new Response(
      JSON.stringify({ 
        error: "Sorry, I could not process your message. Please try again.",
        errorDetails: error.toString() 
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
