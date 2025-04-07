
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Upload, Save, Database } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export interface DiseaseAnalysisResult {
  disease: string;
  confidence: number;
  affectedArea: string;
  treatment: string;
  prevention: string;
}

interface AnalysisResultsProps {
  isAnalyzing: boolean;
  uploadProgress: number;
  analysisResult: DiseaseAnalysisResult | null;
  onSaveResults: () => Promise<void>;
  onReset: () => void;
}

export const AnalysisResults = ({
  isAnalyzing,
  uploadProgress,
  analysisResult,
  onSaveResults,
  onReset,
}: AnalysisResultsProps) => {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      {!analysisResult && !isAnalyzing ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
          <AlertCircle className="h-10 w-10 mb-4" />
          <p>No analysis results yet</p>
          <p className="text-sm">Upload an image and click Analyze to get started</p>
        </div>
      ) : isAnalyzing ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Upload className="h-10 w-10 mb-4 animate-pulse" />
          <p>Analyzing your image...</p>
          <Progress value={uploadProgress} className="w-2/3 h-2 mt-4" />
        </div>
      ) : analysisResult && (
        <>
          <div className="space-y-2">
            <h3 className="font-medium">Detected Disease</h3>
            <Alert variant={analysisResult.disease === "Healthy" ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{analysisResult.disease}</AlertTitle>
              <AlertDescription className="mt-2">
                Confidence: {analysisResult.confidence}% | Affected Area: {analysisResult.affectedArea}
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Recommended Treatment</h3>
            <div className="bg-muted rounded-lg p-3 text-sm">
              {analysisResult.treatment}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Prevention Tips</h3>
            <div className="bg-muted rounded-lg p-3 text-sm">
              {analysisResult.prevention}
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onReset} disabled={!analysisResult}>
          Reset
        </Button>
        <Button 
          className="bg-green-700 hover:bg-green-800"
          disabled={!analysisResult || !user}
          onClick={onSaveResults}
        >
          {user ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Results
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Login to Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
