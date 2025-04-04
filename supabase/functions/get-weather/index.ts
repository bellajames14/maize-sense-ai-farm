
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY") || "c0413911273b214251bcd34a375b046b";

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
    
    if (!location) {
      throw new Error("Location is required");
    }

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );

    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json();
      throw new Error(`OpenWeather API error: ${errorData.message || weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    
    // Transform the data into a more usable format
    const transformedData = {
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      condition: weatherData.weather[0].main,
      icon: weatherData.weather[0].icon,
      windSpeed: weatherData.wind.speed,
      rainfall: weatherData.rain ? weatherData.rain["1h"] || 0 : 0,
      pressure: weatherData.main.pressure,
      location: weatherData.name,
      country: weatherData.sys.country,
    };

    // Add farming recommendations based on weather conditions
    const recommendations = generateFarmingRecommendations(transformedData);
    
    // Combine the weather data with recommendations
    const responseData = {
      ...transformedData,
      recommendations
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFarmingRecommendations(weather) {
  const { temperature, humidity, rainfall, windSpeed } = weather;
  
  let recommendations = {
    irrigation: "",
    disease: "",
    pests: "",
    general: ""
  };
  
  // Irrigation recommendations
  if (rainfall > 5) {
    recommendations.irrigation = "Recent rainfall is sufficient. Reduce irrigation for the next 48 hours.";
  } else if (temperature > 30 && humidity < 50) {
    recommendations.irrigation = "High temperature and low humidity detected. Increase irrigation frequency.";
  } else if (temperature < 15) {
    recommendations.irrigation = "Lower temperatures reduce evaporation. Adjust irrigation accordingly.";
  } else {
    recommendations.irrigation = "Maintain regular irrigation schedule based on soil moisture levels.";
  }
  
  // Disease risk assessment
  if (humidity > 80 && temperature > 22) {
    recommendations.disease = "High risk for fungal diseases. Consider preventative fungicide application.";
  } else if (rainfall > 10 && temperature > 20) {
    recommendations.disease = "Moderate disease risk due to recent rainfall. Monitor crops closely.";
  } else {
    recommendations.disease = "Low disease risk under current conditions. Maintain regular monitoring.";
  }
  
  // Pest management
  if (temperature > 25 && humidity > 60) {
    recommendations.pests = "Conditions favorable for armyworm and aphid development. Scout fields regularly.";
  } else if (temperature < 15) {
    recommendations.pests = "Reduced pest activity expected due to lower temperatures.";
  } else {
    recommendations.pests = "Moderate pest risk. Implement regular monitoring practices.";
  }
  
  // General recommendations
  if (windSpeed > 20) {
    recommendations.general = "High winds may damage crops. Consider temporary windbreaks if available.";
  } else if (temperature > 35) {
    recommendations.general = "Extreme heat may stress plants. Consider shade cloth for sensitive crops.";
  } else if (temperature < 5) {
    recommendations.general = "Near freezing temperatures. Protect seedlings if possible.";
  } else {
    recommendations.general = "Current conditions are generally favorable for maize growth.";
  }
  
  return recommendations;
}
