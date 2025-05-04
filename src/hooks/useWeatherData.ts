
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  icon: string;
  windSpeed: number;
  rainfall: number;
  pressure: number;
  location?: string;
  country?: string;
  recommendations?: {
    irrigation: string;
    disease: string;
    pests: string;
    general: string;
  };
}

export function useWeatherData(initialLocation: string, user: any | null) {
  const [location, setLocation] = useState(initialLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const { toast } = useToast();

  const fetchWeatherData = async () => {
    if (!location.trim()) {
      toast({
        title: "Location required",
        description: "Please enter a valid location",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { location },
      });
      
      if (error) {
        throw error;
      }
      
      setWeather(data);
      
      toast({
        title: "Weather data updated",
        description: `Current conditions for ${data.location}, ${data.country}`,
      });
    } catch (error: any) {
      console.error("Error fetching weather data:", error);
      toast({
        title: "Error fetching weather data",
        description: error.message || "Could not get weather for this location. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveWeatherData = async () => {
    if (!weather || !user) {
      toast({
        title: "Cannot save weather data",
        description: user ? "No weather data available" : "Please log in to save weather data",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Insert the weather data into Supabase
      const { error } = await supabase
        .from('weather_logs')
        .insert({
          user_id: user.id,
          location: `${weather.location}, ${weather.country}`,
          temperature: weather.temperature,
          humidity: weather.humidity,
          pressure: weather.pressure,
          precipitation: weather.rainfall,
          wind_speed: weather.windSpeed,
          weather_condition: weather.condition,
          recommendation: JSON.stringify(weather.recommendations)
        });
      
      if (error) throw error;
      
      toast({
        title: "Weather data saved",
        description: "The weather data has been saved to your account",
      });
    } catch (error: any) {
      console.error("Error saving weather data:", error);
      toast({
        title: "Error saving weather data",
        description: "Could not save weather data to your account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch weather data on initial load
  useEffect(() => {
    fetchWeatherData();
  }, []);

  return {
    location,
    setLocation,
    weather,
    isLoading,
    isSaving,
    fetchWeatherData,
    saveWeatherData
  };
}
