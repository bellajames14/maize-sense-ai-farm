
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { LocationSearch } from "./weather/LocationSearch";
import { WeatherDisplay } from "./weather/WeatherDisplay";
import { WeatherRecommendations, WeatherActionFooter } from "./weather/WeatherRecommendations";
import { useWeatherData } from "@/hooks/useWeatherData";

export const WeatherInsights = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const {
    location,
    setLocation,
    weather,
    isLoading,
    isSaving,
    fetchWeatherData,
    saveWeatherData
  } = useWeatherData("Lagos, Nigeria", user);

  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Current Weather</CardTitle>
          <CardDescription>
            Weather conditions for your farm location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocationSearch 
            location={location}
            setLocation={setLocation}
            onSearch={fetchWeatherData}
            isLoading={isLoading}
          />
          
          <WeatherDisplay 
            weather={weather}
            isLoading={isLoading}
            isSaving={isSaving}
            onSave={saveWeatherData}
            isUserLoggedIn={!!user}
          />
        </CardContent>
      </Card>

      <Card className={`col-span-1 ${isMobile ? '' : 'lg:col-span-2'}`}>
        <CardHeader>
          <CardTitle>Farming Recommendations</CardTitle>
          <CardDescription>
            Based on current and forecasted weather conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WeatherRecommendations 
            recommendations={weather?.recommendations}
            isUserLoggedIn={!!user}
            onRefresh={fetchWeatherData}
            isLoading={isLoading}
          />
        </CardContent>
        <CardFooter className="flex justify-center sm:justify-start">
          <WeatherActionFooter 
            isUserLoggedIn={!!user}
            onRefresh={fetchWeatherData}
            isLoading={isLoading}
          />
        </CardFooter>
      </Card>
    </div>
  );
};
