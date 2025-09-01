import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const MAIZE_DISEASES = [
  "Blight",
  "Common_Rust", 
  "Gray_Leaf_Spot",
  "Healthy",
  "maize ear rot",
  "maize fall armyworm", 
  "maize stem borer"
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, diseases = MAIZE_DISEASES } = await req.json();
    
    if (!image) {
      throw new Error('No image provided');
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Analyzing image with Gemini Vision API');

    const prompt = `Analyze this image for maize/corn plant disease detection. You MUST respond with a valid JSON object only.

IMPORTANT RULES:
1. If the image does NOT show a maize/corn plant, respond with: {"disease": "Unknown", "confidence": 0, "prevention": "Please upload an image of a maize plant", "treatment": "This doesn't appear to be a maize plant", "recommendations": "Upload a clear image of maize plant for analysis"}

2. If it IS a maize plant, identify the disease from this list ONLY: ${diseases.join(', ')}

3. For maize plants, provide confidence (0-100), detailed prevention tips, treatment advice, and recommendations.

Expected JSON format:
{
  "disease": "disease_name_from_list_or_Unknown",
  "confidence": 85,
  "prevention": "Detailed prevention advice...",
  "treatment": "Specific treatment steps...", 
  "recommendations": "Additional recommendations..."
}

Respond with JSON only, no other text.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    console.log('Raw analysis text:', analysisText);

    // Parse JSON from response
    let result;
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : analysisText;
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Fallback response
      result = {
        disease: "Analysis Error",
        confidence: 0,
        prevention: "Unable to analyze the image. Please try again with a clearer photo.",
        treatment: "Ensure good lighting and image quality for better analysis.",
        recommendations: "Take photo in good light showing the plant clearly."
      };
    }

    // Validate and clean the result
    if (!result.disease || !diseases.includes(result.disease)) {
      if (result.disease !== "Unknown" && result.disease !== "Analysis Error") {
        result.disease = "Unknown";
        result.confidence = 0;
        result.prevention = "Please upload an image of a maize plant";
        result.treatment = "This doesn't appear to be a maize plant or the disease is not recognizable";
        result.recommendations = "Upload a clear image of maize plant for analysis";
      }
    }

    // Ensure confidence is a number between 0-100
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 100) {
      result.confidence = Math.max(0, Math.min(100, Number(result.confidence) || 0));
    }

    console.log('Final processed result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in gemini-recommendations function:', error);
    
    return new Response(
      JSON.stringify({
        disease: "Analysis Error",
        confidence: 0,
        prevention: "Unable to analyze the image due to technical issues.",
        treatment: "Please try again later or contact support.",
        recommendations: "Check your internet connection and try again."
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});