
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CloudRain, Droplets, Thermometer, Wind, Sun, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const WeatherInsights = () => {
  const [location, setLocation] = useState("Lagos, Nigeria");
  const [isLoading, setIsLoading] = useState(false);
  const [weather, setWeather] = useState<{
    temperature: number;
    humidity: number;
    condition: string;
    icon: string;
    windSpeed: number;
    rainfall: number;
    location?: string;
    country?: string;
  } | null>(null);
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

  useEffect(() => {
    fetchWeatherData();
  }, []);

  // Map OpenWeather condition to appropriate icons from Lucide
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
          {weather && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Weather Alert</AlertTitle>
                <AlertDescription>
                  {weather.humidity > 70 
                    ? "High humidity levels may increase risk of fungal diseases. Monitor your crops closely."
                    : weather.temperature > 30
                    ? "High temperatures may stress plants. Ensure adequate irrigation."
                    : "Current weather conditions are favorable for maize growth."}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">Irrigation Recommendations</h3>
                  <div className="bg-muted rounded-lg p-3 mt-2">
                    <p>With the recent rainfall of {weather.rainfall}mm and humidity at {weather.humidity}%, adjust your irrigation schedule:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {weather.rainfall > 0 
                        ? <li>Reduce irrigation by 30% for the next 48 hours</li>
                        : <li>Maintain regular irrigation schedule</li>}
                      <li>Monitor soil moisture levels closely</li>
                      <li>Water early in the morning to reduce evaporation and fungal growth</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-lg">Disease Prevention</h3>
                  <div className="bg-muted rounded-lg p-3 mt-2">
                    <p>{weather.humidity > 70 ? "Current conditions are favorable for fungal diseases like:" : "Watch for these common diseases:"}</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Gray Leaf Spot</li>
                      <li>Northern Corn Leaf Blight</li>
                      <li>Common Rust</li>
                    </ul>
                    <p className="mt-2">{weather.humidity > 70 ? "Consider preventative fungicide application if these diseases have been an issue previously." : "Maintain regular monitoring of your crops."}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-lg">Pest Management</h3>
                  <div className="bg-muted rounded-lg p-3 mt-2">
                    <p>{weather.temperature > 25 ? "Warm conditions are ideal for:" : "Keep an eye out for these pests:"}</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Fall Armyworm</li>
                      <li>Corn Earworm</li>
                      <li>Aphids</li>
                    </ul>
                    <p className="mt-2">Monitor your maize plants for these pests and consider appropriate control measures if detected.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button className="bg-leaf-700 hover:bg-leaf-800">
            View Detailed Forecast
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
