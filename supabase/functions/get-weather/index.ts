
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENWEATHER_API_KEY = "c0413911273b214251bcd34a375b046b";

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
    const { location } = await req.json();
    
    // Call OpenWeather API
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`);
    }
    
    const weatherData = await response.json();
    
    // Transform the data to match our frontend expectations
    const transformedData = {
      temperature: Math.round(weatherData.main.temp),
      humidity: weatherData.main.humidity,
      condition: weatherData.weather[0].main,
      icon: weatherData.weather[0].icon,
      windSpeed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
      rainfall: weatherData.rain ? weatherData.rain["1h"] || 0 : 0,
      location: weatherData.name,
      country: weatherData.sys.country
    };
    
    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
