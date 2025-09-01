
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "./ImageUploader";
import { AnalysisResults } from "./AnalysisResults";
import { useDiseaseDetection } from "./hooks/useDiseaseDetection";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePreferences } from "@/hooks/usePreferences";
import { Button } from "@/components/ui/button";

export const DiseaseDetection = () => {
  const isMobile = useIsMobile();
  const { translate } = usePreferences();
  
  const {
    selectedFile,
    previewUrl,
    isAnalyzing,
    result,
    error,
    handleFileChange,
    handleAnalyze,
    handleReset
  } = useDiseaseDetection();

  return (
    <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
      <Card>
        <CardHeader>
          <CardTitle>{translate("Maize Disease Detection")}</CardTitle>
          <CardDescription>
            {translate("Upload an image of your maize plant to detect diseases and receive treatment advice.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isAnalyzing={isAnalyzing}
            uploadProgress={0}
            onFileChange={handleFileChange}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            isModelLoaded={true}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate("Analysis Results")}</CardTitle>
          <CardDescription>
            {result 
              ? translate("Disease detection results and treatment recommendations")
              : error
                ? translate("Analysis error")
                : translate("Upload and analyze an image to see results")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalysisResults
            isAnalyzing={isAnalyzing}
            result={result}
            error={error}
            onReset={handleReset}
          />
        </CardContent>
      </Card>
    </div>
  );
};
