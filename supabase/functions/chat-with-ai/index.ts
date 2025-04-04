
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://sfsdfdcdethqjwtjrwpz.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc2RmZGNkZXRocWp3dGpyd3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzU1NDAsImV4cCI6MjA1OTI1MTU0MH0.o-LLkQhEW7QJhVPyrZKoNYOMHKNIGH_5NWMTnMILqKs";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyD428DEtNiCPGyayEL0ehbu2ayv8rW0Ma8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `
You are an AI farming assistant specializing in maize (corn) cultivation. Your expertise covers:

1. Maize diseases and pests identification and treatment
2. Optimal farming practices for maize
3. Weather-based recommendations for maize farming
4. Soil management and fertilization for maize
5. Harvesting and post-harvest handling

Provide helpful, practical advice using accessible language. Be concise but thorough, always prioritizing sustainable farming practices when possible. 
If you don't know the answer to a question, say so honestly rather than providing potentially harmful advice.
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, previousMessages = [] } = await req.json();
    
    if (!message) {
      throw new Error("Message is required");
    }

    // Format conversation history for the AI model
    const formattedPreviousMessages = previousMessages.map(msg => ({
      role: msg.isUser ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Add system prompt as the first message
    const conversationHistory = [
      {
        role: "model",
        parts: [{ text: systemPrompt }]
      },
      ...formattedPreviousMessages,
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    // Call Google's Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: conversationHistory,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || geminiResponse.status}`);
    }

    const responseData = await geminiResponse.json();
    let aiResponse = "";
    
    if (responseData.candidates && responseData.candidates.length > 0 && 
        responseData.candidates[0].content && responseData.candidates[0].content.parts) {
      aiResponse = responseData.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Unexpected response format from Gemini API");
    }

    // Create Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Store the chat message and response in the database if userId is provided
    if (userId) {
      await supabaseClient.from('ai_chats').insert({
        user_id: userId,
        user_message: message,
        ai_response: aiResponse
      });
    }
    
    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing AI chat:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
