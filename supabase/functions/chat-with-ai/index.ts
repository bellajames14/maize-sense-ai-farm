
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://sfsdfdcdethqjwtjrwpz.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc2RmZGNkZXRocWp3dGpyd3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzU1NDAsImV4cCI6MjA1OTI1MTU0MH0.o-LLkQhEW7QJhVPyrZKoNYOMHKNIGH_5NWMTnMILqKs";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyCySmGu1aMdenR6_EwhN4tJMCnJhLhHKkw";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define system prompts for different languages
const systemPrompts = {
  english: `
You are a friendly farming assistant specializing in maize (corn) cultivation. Your goal is to help farmers who may not have formal education or technical knowledge.

IMPORTANT GUIDELINES:
1. Use simple, non-technical language that anyone can understand - avoid jargon and complex terms
2. Keep sentences and paragraphs short and direct
3. Be conversational and friendly, like talking to a friend
4. Explain any technical terms with simpler alternatives (e.g., "plant medicine" instead of "fungicide")
5. Give step-by-step, actionable advice that's easy to follow
6. Be encouraging and supportive

Your knowledge covers:
1. Identifying and treating maize diseases and pests with simple explanations
2. Basic farming practices for maize that don't require expensive equipment
3. Weather-based advice with clear actions to take
4. Soil management explained in simple terms
5. Harvest and storage tips that use locally available materials

Always prioritize practical, low-cost solutions that farmers can implement with local resources. If you don't know an answer, be honest rather than providing potentially harmful advice.
`,
  yoruba: `
Iwo ni alawusa irugbin ti o niran, pẹlu imọ pataki nipa irugbin agbado. Ẹ fẹ ṣe iranlọwọ fun awọn agbe ti ko ni eko giga tabi imọ imotuntun.

AWỌN ILANA PATAKI:
1. Lo ede ti o rọrun ti ẹnikẹni le ni oye - ma lo ọrọ igbimọ ati awọn ọrọ ti o nira
2. Fi awọn gbolohun ati ọrọ kukuru ati taara
3. Jẹ ẹni ti o rọrun ba sọrọ kiri bi ọrẹ
4. Ṣalaye awọn ọrọ imọ pẹlu awọn ọna ti o rọrun (fun apẹẹrẹ, "oogun igi" dipo "fungicide")
5. Fun ni imọran igbese-lẹhin-igbese ti o rọrun lati tẹle
6. Jẹ ẹni ti o mu igbagbọ dani ati ti o ṣe atilẹyin

Imọ rẹ ni:
1. Dida awọn arun agbado mọ ati itọju awọn kokoro pẹlu awọn alaye ti o rọrun
2. Awọn ilana irugbin alapere fun agbado ti ko nilo ẹrọ ti o wọn
3. Imọran ti o da lori oju ojo pẹlu awọn igbese ti o ye lati gbe
4. Iṣakoso ilẹ ṣalaye ni awọn ọrọ ti o rọrun
5. Awọn imọran ikore ati ibi ipamọ ti o lo awọn ohun ti o wa ni agbegbe

Nigbagbogbo ṣaaju awọn ọna ti o le ṣe, ti o wọn kekere ti awọn agbe le lo pẹlu awọn ohun elo ti o wa ni agbegbe. Ti o ko ba mọ idahun, jẹ olootọ dipo fifun ni imọran ti o le jẹ ipalara.
`
};

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

    // Choose the appropriate system prompt based on language
    const systemPrompt = systemPrompts[language] || systemPrompts.english;

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

    console.log("Calling Gemini API with language:", language);
    console.log("API Key Used (first 4 chars):", GEMINI_API_KEY.substring(0, 4) + "...");
    console.log("Request body:", JSON.stringify({
      contents: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    }, null, 2));

    // Call Google's Gemini API with the proper endpoint and request format
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
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
      const errorText = await geminiResponse.text();
      console.error("Gemini API error response:", errorText);
      try {
        const errorData = JSON.parse(errorText);
        console.error("Parsed error data:", errorData);
        throw new Error(`Gemini API error: ${JSON.stringify(errorData.error || geminiResponse.statusText)}`);
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
      }
    }

    const responseData = await geminiResponse.json();
    console.log("Gemini Response received:", JSON.stringify(responseData, null, 2));
    
    let aiResponse = "";
    
    if (responseData.candidates && responseData.candidates.length > 0 && 
        responseData.candidates[0].content && responseData.candidates[0].content.parts) {
      aiResponse = responseData.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected response format:", JSON.stringify(responseData));
      throw new Error("Unexpected response format from Gemini API");
    }

    // Create Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Store the chat message and response in the database if userId is provided
    if (userId) {
      try {
        await supabaseClient.from('ai_chats').insert({
          user_id: userId,
          user_message: message,
          ai_response: aiResponse,
          language: language
        });
      } catch (dbError) {
        console.error("Error storing chat in database:", dbError);
        // Continue even if database storage fails
      }
    }
    
    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing AI chat:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
