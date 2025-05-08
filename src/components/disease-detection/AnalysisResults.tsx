
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Upload, Save, Database, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFarmerFriendlyName, formatConfidence } from "./diseaseUtils";
import { usePreferences } from "@/hooks/usePreferences";

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
          <div className="space-y-2">
            <h3 className="font-medium">{translate("Detected Disease")}</h3>
            <Alert variant={analysisResult.disease === "Healthy" ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{farmerFriendlyName}</AlertTitle>
              <AlertDescription className="mt-2">
                {translate("Confidence")}: {formatConfidence(analysisResult.confidence)}
                {analysisResult.affectedArea && ` | ${translate("Affected Area")}: ${analysisResult.affectedArea}`}
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">{translate("Recommendation")}</h3>
            <div className="bg-muted rounded-lg p-3 text-sm">
              {analysisResult.treatment}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">{translate("Treatment Tips")}</h3>
            <div className="bg-muted rounded-lg p-3 text-sm">
              {analysisResult.prevention}
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onReset} disabled={!analysisResult && !analysisError}>
          {translate("Reset")}
        </Button>
        <Button 
          className="bg-green-700 hover:bg-green-800"
          disabled={!analysisResult || !user}
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
    </div>
  );
};
