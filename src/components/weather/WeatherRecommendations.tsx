
import { AlertTriangle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePreferences } from "@/hooks/usePreferences";

interface WeatherRecommendations {
  irrigation: string;
  disease: string;
  pests: string;
  general: string;
}

interface WeatherRecommendationsProps {
  recommendations: WeatherRecommendations | undefined;
  isUserLoggedIn: boolean;
  onRefresh: () => void;
  isLoading: boolean;
}

export const WeatherRecommendations = ({
  recommendations,
  isUserLoggedIn,
  onRefresh,
  isLoading
}: WeatherRecommendationsProps) => {
  const { translate } = usePreferences();
  
  if (!recommendations) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
        <AlertTriangle className="h-10 w-10 mb-4" />
        <p>{translate("No weather recommendations available")}</p>
        <p className="text-sm">{translate("Update weather data to get personalized farming recommendations")}</p>
      </div>
    );
  }

  return (
    <>
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{translate("Weather Alert")}</AlertTitle>
        <AlertDescription>
          {recommendations.general}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-lg">{translate("Irrigation Recommendations")}</h3>
          <div className="bg-muted rounded-lg p-3 mt-2">
            <p>{recommendations.irrigation}</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-lg">{translate("Disease Prevention")}</h3>
          <div className="bg-muted rounded-lg p-3 mt-2">
            <p>{recommendations.disease}</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-lg">{translate("Pest Management")}</h3>
          <div className="bg-muted rounded-lg p-3 mt-2">
            <p>{recommendations.pests}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export const WeatherActionFooter = ({ 
  isUserLoggedIn, 
  onRefresh, 
  isLoading 
}: { 
  isUserLoggedIn: boolean; 
  onRefresh: () => void; 
  isLoading: boolean; 
}) => {
  const { translate } = usePreferences();
  
  return (
    <>
      {!isUserLoggedIn ? (
        <Button className="bg-green-700 hover:bg-green-800 w-full sm:w-auto">
          <Database className="mr-2 h-4 w-4" />
          {translate("Login to Save Recommendations")}
        </Button>
      ) : (
        <Button 
          className="bg-green-700 hover:bg-green-800 w-full sm:w-auto"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {translate("Refresh Weather Data")}
        </Button>
      )}
    </>
  );
};
