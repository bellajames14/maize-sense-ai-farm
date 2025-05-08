
import { Cloud, CloudRain, Droplets, Thermometer, Wind, Sun, AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/hooks/usePreferences";

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

interface WeatherDisplayProps {
  weather: WeatherData | null;
  isLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
  isUserLoggedIn: boolean;
}

export const WeatherDisplay = ({ 
  weather, 
  isLoading, 
  isSaving, 
  onSave,
  isUserLoggedIn 
}: WeatherDisplayProps) => {
  const { translate } = usePreferences();
  
  // Map weather condition to appropriate icons
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

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Cloud className="animate-pulse h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        {translate("No weather data available")}
      </div>
    );
  }

  return (
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
          <span>{weather.humidity}% {translate("humidity")}</span>
        </div>
        <div className="flex items-center">
          <Wind className="h-5 w-5 mr-2 text-gray-500" />
          <span>{weather.windSpeed} {translate("windSpeed")}</span>
        </div>
        <div className="flex items-center">
          <CloudRain className="h-5 w-5 mr-2 text-blue-400" />
          <span>{weather.rainfall} mm {translate("precipitation")}</span>
        </div>
        <div className="flex items-center">
          <Thermometer className="h-5 w-5 mr-2 text-red-500" />
          <span>{translate("Feels like")} {weather.temperature}°C</span>
        </div>
      </div>
      
      {isUserLoggedIn && (
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="mt-4 bg-green-700 hover:bg-green-800 w-full sm:w-auto"
        >
          {isSaving ? (
            <span>{translate("Saving...")}</span>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {translate("Save Weather Data")}
            </>
          )}
        </Button>
      )}
    </div>
  );
};
