
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Upload, Save, Database, AlertTriangle, Check, Leaf, Pill, User, MessageCircle } from "lucide-react";
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
  explanation?: string;
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

  // Determine status type
  const isHealthy = analysisResult?.disease === "Healthy";
  const isUnrecognized = analysisResult?.disease === "Unrecognized Plant";
  const isError = analysisResult?.disease === "Analysis Error";

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
          <p>{translate("Analyzing your maize plant...")}</p>
          <Progress value={uploadProgress} className="w-2/3 h-2 mt-4" />
        </div>
      ) : analysisResult && (
        <>
          {/* Status Header */}
          <Card className="overflow-hidden">
            <div className={`p-4 flex items-center gap-3 ${
              isHealthy ? 'bg-green-100 dark:bg-green-900/30' : 
              isUnrecognized ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              isError ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-orange-100 dark:bg-orange-900/30'
            }`}>
              {isHealthy ? 
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" /> : 
                isUnrecognized ? 
                <MessageCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" /> :
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              }
              <div>
                <h3 className="font-semibold text-lg">{farmerFriendlyName}</h3>
                <p className="text-sm text-muted-foreground">
                  {translate("Confidence")}: {formatConfidence(analysisResult.confidence)}
                </p>
              </div>
            </div>
            
            {/* Explanation */}
            {analysisResult.explanation && (
              <CardContent className="p-4 border-b">
                <div className="flex items-start gap-3">
                  <Leaf className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm text-blue-700 dark:text-blue-400 mb-2">
                      🌿 {translate("What we found")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
            
            {/* Treatment Section */}
            <CardContent className="p-4 border-b">
              <div className="flex items-start gap-3">
                <Pill className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-green-700 dark:text-green-400 mb-2">
                    💊 {isHealthy ? translate("Keep Your Plant Healthy") : translate("Treatment Steps")}
                  </h4>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm">
                    <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
                      {analysisResult.treatment}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
            
            {/* Prevention/Tips Section */}
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-blue-700 dark:text-blue-400 mb-2">
                    🧑🏾‍🌾 {translate("Tips for Farmers")}
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
                    <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
                      {analysisResult.prevention}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
            
            {/* Special message for unrecognized plants */}
            {isUnrecognized && (
              <CardContent className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <MessageCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    {translate("Try asking our AI Chat Assistant for help with plant identification!")}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onReset}>
              {translate("Analyze Another Plant")}
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
