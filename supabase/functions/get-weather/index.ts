
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
    
    console.log("Fetching weather data for:", location);

    // Fetch current weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );

    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json();
      throw new Error(`OpenWeather API error: ${errorData.message || weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    console.log("Weather data received");
    
    // Get 5-day forecast data for better recommendations
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!forecastResponse.ok) {
      console.error("Failed to fetch forecast data, continuing with current data only");
    }
    
    const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;
    
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
      forecast: forecastData ? processForecastData(forecastData) : null,
    };

    // Add farming recommendations based on weather conditions and forecast
    const recommendations = generateFarmerFriendlyRecommendations(transformedData, forecastData);
    
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

function processForecastData(forecastData) {
  // Extract the next 3 days of forecast data
  const forecastList = forecastData.list || [];
  const processedForecast = [];
  const seenDates = new Set();
  
  for (const item of forecastList) {
    const date = new Date(item.dt * 1000).toISOString().split('T')[0];
    
    // Only take one reading per day
    if (!seenDates.has(date)) {
      seenDates.add(date);
      
      processedForecast.push({
        date,
        temperature: item.main.temp,
        condition: item.weather[0].main,
        humidity: item.main.humidity,
        rainfall: item.rain ? item.rain["3h"] || 0 : 0,
        windSpeed: item.wind.speed
      });
    }
    
    // Only take 5 days
    if (processedForecast.length >= 5) {
      break;
    }
  }
  
  return processedForecast;
}

function generateFarmerFriendlyRecommendations(weather, forecastData) {
  const { temperature, humidity, rainfall, windSpeed } = weather;
  const forecast = forecastData?.list || [];
  
  // Check if heavy rain is expected in the next 24 hours
  const heavyRainExpected = forecast.slice(0, 8).some(item => 
    item.rain && (item.rain["3h"] > 5 || (item.weather[0].main.toLowerCase() === "rain" && item.weather[0].description.includes("heavy")))
  );
  
  // Check if temperatures will drop significantly
  const currentTemp = temperature;
  const minForecastTemp = forecast.slice(0, 16).reduce((min, item) => 
    Math.min(min, item.main.temp), currentTemp);
  const temperatureDrop = currentTemp - minForecastTemp > 8;
  
  let recommendations = {
    irrigation: "",
    disease: "",
    pests: "",
    general: ""
  };
  
  // Irrigation recommendations - using simple language
  if (rainfall > 5) {
    recommendations.irrigation = "The rain today is enough for your plants. Don't add more water for 2 days.";
  } else if (heavyRainExpected) {
    recommendations.irrigation = "Heavy rain is coming soon. Wait until after the rain before watering your plants.";
  } else if (temperature > 30 && humidity < 50) {
    recommendations.irrigation = "It's very hot and dry today. Your plants need more water than usual.";
  } else if (temperature < 15) {
    recommendations.irrigation = "It's cool today, so your plants will lose less water. Water them less than usual.";
  } else {
    recommendations.irrigation = "Water your plants as normal today. Check the soil with your finger - if it feels dry, add water.";
  }
  
  // Disease risk assessment - simplified language
  if (humidity > 80 && temperature > 22) {
    recommendations.disease = "The air is very wet and warm. Your maize plants might get sick. Watch for strange spots on leaves and spray plant medicine if you see any.";
  } else if (rainfall > 10 && temperature > 20) {
    recommendations.disease = "After this much rain, check your plants carefully for spots or white powder on leaves. These are signs of sickness.";
  } else if (heavyRainExpected && temperature > 20) {
    recommendations.disease = "Heavy rain is coming. After rain, check your plants for signs of sickness like spots or changing leaf color.";
  } else {
    recommendations.disease = "Your plants have low chance of getting sick in this weather. Still good to check them every few days.";
  }
  
  // Pest management - using simple terms
  if (temperature > 25 && humidity > 60) {
    recommendations.pests = "This warm, wet weather brings insects that eat plants. Check under leaves and in the middle of your plants for small bugs or holes in leaves.";
  } else if (temperature < 15) {
    recommendations.pests = "Cold weather means fewer bugs that can harm your plants. Still good to check, but less worry today.";
  } else {
    recommendations.pests = "Some bugs might be around. Look at your plants every few days for signs like holes in leaves or small insects.";
  }
  
  // General recommendations - step by step, actionable
  if (heavyRainExpected) {
    recommendations.general = "Heavy rain is coming in the next day. Here's what to do: 1) Make small channels near your plants so water can flow away. 2) If you can, cover young plants with plastic sheets or large leaves. 3) After the rain, remove any standing water near plants.";
  } else if (windSpeed > 20) {
    recommendations.general = "Strong winds today! 1) If you have young maize plants, support them with sticks. 2) For taller plants, you can pile a little soil around the base to make them stronger. 3) Check plants after the wind stops to fix any that fell over.";
  } else if (temperature > 35) {
    recommendations.general = "Very hot today! 1) Water your plants early morning or evening, not midday. 2) If possible, create shade for smaller plants using cloths or palm leaves. 3) Add mulch (dry grass or leaves) around plants to keep soil cool.";
  } else if (temperatureDrop) {
    recommendations.general = "Temperature will drop a lot soon. 1) Cover young plants at night with cloth or large leaves. 2) Water plants during warmer parts of the day, not evening. 3) If you have plastic sheets, you can cover some plants overnight.";
  } else if (temperature < 5) {
    recommendations.general = "It's very cold! 1) Cover all young plants with whatever you have - cloth, large leaves, or plastic. 2) Water only when the sun is up and it's warmer. 3) Add extra mulch (dry grass/leaves) around plants.";
  } else {
    recommendations.general = "Weather is good for your maize today. Keep up regular care: 1) Check soil moisture with your finger - water if dry. 2) Look under leaves for any bugs or spots. 3) Remove any weeds you see growing near your plants.";
  }
  
  return recommendations;
}
