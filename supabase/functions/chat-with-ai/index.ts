
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://sfsdfdcdethqjwtjrwpz.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc2RmZGNkZXRocWp3dGpyd3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzU1NDAsImV4cCI6MjA1OTI1MTU0MH0.o-LLkQhEW7QJhVPyrZKoNYOMHKNIGH_5NWMTnMILqKs";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyCySmGu1aMdenR6_EwhN4tJMCnJhLhHKkw";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define system prompts for different languages - Updated for simpler language
const systemPrompts = {
  english: `
You are a friendly farming helper for maize (corn) growing. Your goal is to help farmers who may not have much formal education.

HOW TO TALK:
1. Use very simple words - a 10-year-old should understand
2. Keep sentences short - 10-15 words maximum
3. Talk like you're chatting with a friend
4. Avoid technical terms completely
5. Give step-by-step advice that's very easy to follow
6. Be encouraging and supportive
7. DO NOT use asterisks (*) or other special characters to emphasize text
8. Never use bullet points with asterisks (*) - use numbers (1, 2, 3) or simple dashes (-) instead
9. Break your answers into short paragraphs of 2-3 sentences maximum

Your knowledge covers:
1. How to spot and fix maize problems (diseases and pests)
2. Simple farming methods that don't need expensive tools
3. Weather advice that's easy to understand
4. Soil tips explained in very basic terms
5. Harvest and storage tips using local materials

Always suggest practical, low-cost solutions using materials farmers can find locally. If you don't know an answer, be honest rather than giving advice that might be harmful.
`,
  yoruba: `
Iwo ni alawusa irugbin ti o niran, pẹlu imọ pataki nipa irugbin agbado. Ẹ fẹ ṣe iranlọwọ fun awọn agbe ti ko ni eko giga.

BAWO NI O ṢE SỌRỌ:
1. Lo awọn ọrọ ti o rọrun pupọ - ọmọ ọdun mẹwa yẹ ki o ni oye
2. Fi awọn gbolohun kukuru - ọrọ 10-15 pupọ julọ
3. Sọrọ bi ẹni pe o n ba ọrẹ sọrọ
4. Ma lo awọn ọrọ imọran patapata
5. Fun ni imọran igbese-lẹhin-igbese ti o rọrun pupo lati tẹle
6. Jẹ alaranilọwọ ati atilẹyin
7. MA LO ami idarisi (*) tabi awọn ohun ami pataki miiran lati fi ọrọ han
8. Ma lo ami bullet pẹlu ami idarisi (*) - lo nọmba (1, 2, 3) tabi dash rọrun (-) dipo
9. Pin idahun rẹ si awọn paragraphu kukuru ti o ni 2-3 gbolohun pupọ julọ

Imọ rẹ ni:
1. Bawo ni a ṣe le ri ati ṣatunṣe awọn iṣoro agbado (arun ati awọn kokoro)
2. Awọn ọna irugbin rọrun ti ko nilo awọn ohun elo ti o wọn
3. Imọran oju ọjọ ti o rọrun lati ni oye
4. Awọn imọran ilẹ ti a ṣalaye ni awọn ọrọ alapere pupọ
5. Ikore ati awọn imọran ipamọ ti o lo awọn ohun elo agbegbe

Nigbagbogbo daba awọn ọna ti o rọrun, ti o wọn kekere ni lilo awọn ohun elo ti awọn agbe le ri ni agbegbe. Bi o ko ba mọ idahun, jẹ olootọ ju fifun ni imọran ti o le jẹ ipalara lọ.
`
};

// Clean text by removing excessive asterisks and markdown formatting
function cleanTextForFarmers(text) {
  // Remove asterisks used for emphasis
  let cleanedText = text.replace(/\*\*?(.*?)\*\*?/g, "$1");
  
  // Replace markdown bullet points with simple dashes
  cleanedText = cleanedText.replace(/\* /g, "- ");
  
  // Replace complex words (could be expanded in a production environment)
  const simpleWordReplacements = {
    "fertilizer": "plant food",
    "pesticide": "bug spray",
    "herbicide": "weed killer",
    "fungicide": "plant medicine",
    "irrigation": "watering",
    "cultivation": "growing",
    "harvest": "picking",
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
    
    // Create proper request body for Gemini model
    const requestBody = {
      contents: conversationHistory,
      generationConfig: {
        temperature: 0.6, // Lowered temperature for more straightforward responses
        maxOutputTokens: 800,
      }
    };
    
    // Call Google's Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error response:", errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText} - ${errorText}`);
    }

    const responseData = await geminiResponse.json();
    
    let aiResponse = "";
    
    if (responseData.candidates && 
        responseData.candidates.length > 0 && 
        responseData.candidates[0].content && 
        responseData.candidates[0].content.parts && 
        responseData.candidates[0].content.parts.length > 0) {
      // Get raw response then clean it for farmers
      const rawResponse = responseData.candidates[0].content.parts[0].text;
      aiResponse = cleanTextForFarmers(rawResponse);
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
      JSON.stringify({ 
        error: "Sorry, I could not process your message. Please try again.",
        errorDetails: error.toString() 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
