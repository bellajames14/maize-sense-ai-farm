
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

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
    const { message, language = "english" } = await req.json();

    // Create language-specific system prompt
    const languagePrompts = {
      english: "You are an AI farming assistant specializing in maize (corn) cultivation. Provide helpful, concise advice to farmers. Focus on practical information about maize farming, disease prevention, pest control, and crop management.",
      yoruba: "Iwo ni aṣoju AI ti o ni imọ nipa irugbin agbado. Pese imọran to wulo ati to peye fun awọn agbe. Dojuko alaye to wulo nipa irugbin agbado, idaabobo arun, iṣakoso kokoro, ati iṣakoso irugbin.",
      igbo: "Ị bụ onye nkwado ọrụ ugbo AI nke na-ahụ maka ọkụ ọka. Nye ndụmọdụ bara uru, doro anya nye ndị ọrụ ugbo. Chịkọta ụmụ ihe bara uru gbasara ọrụ ugbo ọka, mgbochi ọrịa, njikwa ahụhụ, na njikwa ihe ubi.",
      hausa: "Kai ne mataimakiyar noma ta AI wanda ke ƙwarewa wajen noman masara. Ka bayar da shawarwari masu amfani, masu taƙaitawa ga manoma. Ka mayar da hankali akan bayanan aiki game da noman masara, kare cutar, yaki da kwari, da kuma kulawa da amfanin gona."
    };

    const systemPrompt = languagePrompts[language] || languagePrompts.english;

    // Call Gemini API
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt },
              { text: message }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData?.error?.message || response.status}`);
    }

    const data = await response.json();
    
    // Extract the response text from Gemini's output format
    const aiResponse = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating AI response:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
