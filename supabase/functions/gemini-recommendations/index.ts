import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.15.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { predictedClass, accuracy } = await req.json()
    
    const genAI = new GoogleGenerativeAI(Deno.env.get('VITE_GEMINI_API_KEY') || '')
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `You are an expert agronomist specializing in maize disease management.
A machine learning model predicted: ${predictedClass} with ${accuracy}% confidence.

Please provide farmer-friendly advice in the following format:

**Confirmation:** Brief statement about the detected condition
**Prevention Steps:** 3-4 immediate actions to prevent spread
**Treatment Options:** Specific treatments available 
**Additional Recommendations:** General care tips

Keep responses practical and actionable for farmers.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return new Response(
      JSON.stringify({ recommendations: text }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate recommendations' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})