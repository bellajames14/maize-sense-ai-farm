
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CloudRain, Droplets, Thermometer, Wind, Sun, AlertTriangle, Save, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const WeatherInsights = () => {
  const [location, setLocation] = useState("Lagos, Nigeria");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [weather, setWeather] = useState<{
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
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
    } catch (error) {
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
    } catch (error) {
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

  useEffect(() => {
    fetchWeatherData();
  }, []);

  // Map weather condition to appropriate icons from Lucide
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className="h-14 w-14 text-yellow-500" />;
      case 'clouds':
        return <Cloud className="h-14 w-14 text-gray-500" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-14 w-14 text-blue-500" />;
      case 'thunderstorm':
        return <AlertTriangle className="h-14 w-14 text-yellow-600" />;
      default:
        return <Cloud className="h-14 w-14 text-gray-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Current Weather</CardTitle>
          <CardDescription>
            Weather conditions for your farm location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Farm Location</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city or coordinates"
              />
              <Button onClick={fetchWeatherData} disabled={isLoading}>
                Update
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Cloud className="animate-pulse h-8 w-8 text-muted-foreground" />
            </div>
          ) : weather ? (
            <div className="flex flex-col items-center py-4">
              <div className="mb-4">
                {getWeatherIcon(weather.condition)}
              </div>
              <div className="text-4xl font-bold mb-2">{weather.temperature}°C</div>
              <div className="text-lg text-muted-foreground mb-4">{weather.condition}</div>
              <div className="text-sm text-muted-foreground mb-4">
                {weather.location}, {weather.country}
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex items-center">
                  <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                  <span>{weather.humidity}% Humidity</span>
                </div>
                <div className="flex items-center">
                  <Wind className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{weather.windSpeed} km/h</span>
                </div>
                <div className="flex items-center">
                  <CloudRain className="h-5 w-5 mr-2 text-blue-400" />
                  <span>{weather.rainfall} mm Rain</span>
                </div>
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 mr-2 text-red-500" />
                  <span>Feels like {weather.temperature}°C</span>
                </div>
              </div>
              
              {user && (
                <Button
                  onClick={saveWeatherData}
                  disabled={isSaving}
                  className="mt-4 bg-green-700 hover:bg-green-800"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Weather Data
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No weather data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Farming Recommendations</CardTitle>
          <CardDescription>
            Based on current and forecasted weather conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {weather && weather.recommendations ? (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Weather Alert</AlertTitle>
                <AlertDescription>
                  {weather.recommendations.general}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">Irrigation Recommendations</h3>
                  <div className="bg-muted rounded-lg p-3 mt-2">
                    <p>{weather.recommendations.irrigation}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-lg">Disease Prevention</h3>
                  <div className="bg-muted rounded-lg p-3 mt-2">
                    <p>{weather.recommendations.disease}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-lg">Pest Management</h3>
                  <div className="bg-muted rounded-lg p-3 mt-2">
                    <p>{weather.recommendations.pests}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mb-4" />
              <p>No weather recommendations available</p>
              <p className="text-sm">Update weather data to get personalized farming recommendations</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!user ? (
            <Button className="bg-green-700 hover:bg-green-800">
              <Database className="mr-2 h-4 w-4" />
              Login to Save Recommendations
            </Button>
          ) : (
            <Button 
              className="bg-green-700 hover:bg-green-800"
              onClick={fetchWeatherData}
              disabled={isLoading}
            >
              Refresh Weather Data
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
