import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, RotateCcw } from "lucide-react";
import { usePreferences } from "@/hooks/usePreferences";
import { DiseaseDetectionResult } from "./services/geminiDiseaseService";

interface AnalysisResultsProps {
  isAnalyzing: boolean;
  result: DiseaseDetectionResult | null;
  error: string | null;
  onReset: () => void;
}

export const AnalysisResults = ({ isAnalyzing, result, error, onReset }: AnalysisResultsProps) => {
  const { translate } = usePreferences();

  // Error state
  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {translate("Analysis Error")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={onReset} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            {translate("Try Again")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isAnalyzing) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{translate("Analyzing your image...")}</CardTitle>
          <CardDescription>
            Processing your maize plant image for disease detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Running AI analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No results state
  if (!result) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{translate("Analysis Results")}</CardTitle>
          <CardDescription>
            {translate("Disease detection results and treatment recommendations")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {translate("Upload an image and click Analyze to get started")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Results state
  const isHealthy = result.disease.toLowerCase().includes('healthy');

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isHealthy ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-500" />
          )}
          {translate("Analysis Results")}
        </CardTitle>
        <CardDescription>
          Disease detection and treatment recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prediction Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">{translate("Detected Disease")}</span>
            <Badge variant={isHealthy ? "secondary" : "destructive"}>
              {result.disease}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">{translate("Confidence")}</span>
            <Badge variant="outline">
              {result.confidence.toFixed(1)}%
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Recommendations */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Prevention Tips</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.prevention}
          </p>

          <h4 className="font-medium text-sm">Treatment Recommendations</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.treatment}
          </p>

          <h4 className="font-medium text-sm">Additional Recommendations</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.recommendations}
          </p>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onReset} variant="outline" className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            {translate("Reset")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};