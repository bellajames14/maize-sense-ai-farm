import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { usePreferences } from "@/hooks/usePreferences";
import type { OptimizedAnalysisResult } from "./hooks/useOptimizedDiseaseAnalysis";

interface OptimizedAnalysisResultsProps {
  isAnalyzing: boolean;
  analysisResult: OptimizedAnalysisResult | null;
  analysisError: string | null;
  onReset: () => void;
}

export const OptimizedAnalysisResults = ({
  isAnalyzing,
  analysisResult,
  analysisError,
  onReset
}: OptimizedAnalysisResultsProps) => {
  const { translate } = usePreferences();

  if (analysisError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">{translate("Analysis Error")}</span>
        </div>
        <p className="text-sm text-muted-foreground">{analysisError}</p>
        <Button onClick={onReset} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {translate("Try Again")}
        </Button>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          <span>{translate("Analyzing your image...")}</span>
        </div>
        <Progress value={100} className="w-full animate-pulse" />
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{translate("Upload an image and click Analyze to get started")}</p>
      </div>
    );
  }

  const isHealthy = analysisResult.disease.toLowerCase() === "healthy";
  const isError = analysisResult.disease === "Unknown" || analysisResult.disease === "Model_Error";

  return (
    <div className="space-y-6">
      {/* Disease Detection Result */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {isHealthy ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : isError ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <CardTitle className="text-lg">{translate("Detection Result")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{translate("Detected Disease")}:</span>
            <Badge variant={isHealthy ? "default" : isError ? "secondary" : "destructive"}>
              {analysisResult.disease}
            </Badge>
          </div>
          
          {!isError && (
            <div className="flex items-center justify-between">
              <span className="font-medium">{translate("Confidence")}:</span>
              <span className="text-sm font-mono">
                {Math.round(analysisResult.confidence * 100)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prevention & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>{translate("Prevention & Recommendations")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {analysisResult.recommendations}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onReset} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {translate("Reset")}
        </Button>
      </div>
    </div>
  );
};