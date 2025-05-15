
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Upload, Save, Database, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFarmerFriendlyName, formatConfidence } from "./diseaseUtils";
import { usePreferences } from "@/hooks/usePreferences";
import { Card, CardContent } from "@/components/ui/card";

export interface DiseaseAnalysisResult {
  disease: string;
  confidence: number;
  affectedArea?: string;
  treatment: string;
  prevention: string;
}

interface AnalysisResultsProps {
  isAnalyzing: boolean;
  uploadProgress: number;
  analysisResult: DiseaseAnalysisResult | null;
  analysisError: string | null;
  onSaveResults: () => Promise<void>;
  onReset: () => void;
}

export const AnalysisResults = ({
  isAnalyzing,
  uploadProgress,
  analysisResult,
  analysisError,
  onSaveResults,
  onReset,
}: AnalysisResultsProps) => {
  const { user } = useAuth();
  const { translate } = usePreferences();

  // Get farmer-friendly disease name
  const farmerFriendlyName = analysisResult 
    ? getFarmerFriendlyName(analysisResult.disease)
    : "";

  // Determine if the plant is healthy
  const isHealthy = analysisResult?.disease === "Healthy";

  return (
    <div className="space-y-4">
      {analysisError && !isAnalyzing ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{translate("Analysis Error")}</AlertTitle>
            <AlertDescription>{analysisError}</AlertDescription>
          </Alert>
          <Button onClick={onReset} variant="outline">{translate("Try Again")}</Button>
        </div>
      ) : !analysisResult && !isAnalyzing ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
          <AlertCircle className="h-10 w-10 mb-4" />
          <p>{translate("No analysis results yet")}</p>
          <p className="text-sm">{translate("Upload an image and click Analyze to get started")}</p>
        </div>
      ) : isAnalyzing ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Upload className="h-10 w-10 mb-4 animate-pulse" />
          <p>{translate("Analyzing your image...")}</p>
          <Progress value={uploadProgress} className="w-2/3 h-2 mt-4" />
        </div>
      ) : analysisResult && (
        <>
          <Card className="overflow-hidden">
            <div className={`p-4 ${isHealthy ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} flex items-center gap-3`}>
              {isHealthy ? 
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" /> : 
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              }
              <div>
                <h3 className="font-semibold text-lg">{farmerFriendlyName}</h3>
                <p className="text-sm text-muted-foreground">
                  {translate("Confidence")}: {formatConfidence(analysisResult.confidence)}
                  {analysisResult.affectedArea && ` • ${translate("Affected Area")}: ${analysisResult.affectedArea}`}
                </p>
              </div>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-base">{translate("Recommendation")}</h3>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  {analysisResult.treatment}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-base">{translate("Treatment Tips")}</h3>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  {analysisResult.prevention}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onReset}>
              {translate("Reset")}
            </Button>
            <Button 
              className="bg-green-700 hover:bg-green-800"
              disabled={!user}
              onClick={onSaveResults}
            >
              {user ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {translate("Save Results")}
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  {translate("Login to Save")}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
