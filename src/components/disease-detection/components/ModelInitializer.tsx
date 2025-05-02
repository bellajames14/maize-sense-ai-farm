
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import { loadModel } from "../tensorflowService";

interface ModelInitializerProps {
  onModelLoaded: (isLoaded: boolean) => void;
}

export const ModelInitializer = ({ onModelLoaded }: ModelInitializerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load TensorFlow.js model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsLoading(true);
        await tf.ready();
        console.log("TensorFlow.js is ready");
        await loadModel();
        setIsLoading(false);
        onModelLoaded(true);
      } catch (error) {
        console.error("Failed to initialize TensorFlow.js model:", error);
        setLoadError("Failed to load disease detection model. Please try again later.");
        setIsLoading(false);
        onModelLoaded(false);
      }
    };

    initializeModel();
  }, [onModelLoaded]);

  if (loadError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        <Loader className="animate-spin mr-2 h-4 w-4" />
        <span>Loading disease detection model...</span>
      </div>
    );
  }

  return null;
};
