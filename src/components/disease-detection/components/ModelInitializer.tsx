
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
  const [loadStatus, setLoadStatus] = useState<string>("Starting model initialization...");

  // Load TensorFlow.js model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsLoading(true);
        setLoadStatus("Initializing TensorFlow.js...");
        
        // Initialize TensorFlow.js
        await tf.ready();
        console.log("TensorFlow.js is ready");
        setLoadStatus("TensorFlow.js ready. Loading disease detection model...");
        
        // Check if WebGL is available and working correctly
        const backend = tf.getBackend();
        console.log("Using backend:", backend);
        
        // Try to enforce WebGL backend if not already using it
        if (backend !== 'webgl') {
          try {
            await tf.setBackend('webgl');
            console.log("Successfully switched to WebGL backend");
          } catch (backendError) {
            console.warn("Could not switch to WebGL backend:", backendError);
            // Continue with the current backend
          }
        }
        
        // Load the model
        setLoadStatus("Loading model from remote server...");
        const model = await loadModel();
        
        // Verify the model was loaded correctly
        if (!model) {
          throw new Error("Model loaded but returned null or undefined");
        }
        
        console.log("Model loaded successfully:", model);
        setLoadStatus("Model loaded successfully!");
        setIsLoading(false);
        onModelLoaded(true);
      } catch (error) {
        console.error("Failed to initialize TensorFlow.js model:", error);
        setLoadError(`Failed to load disease detection model: ${error instanceof Error ? error.message : "Unknown error"}. Please try refreshing your browser or using a different device.`);
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
      <div className="flex flex-col items-center justify-center p-4 text-muted-foreground">
        <div className="flex items-center mb-2">
          <Loader className="animate-spin mr-2 h-4 w-4" />
          <span>Loading disease detection model...</span>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-1">{loadStatus}</p>
      </div>
    );
  }

  return null;
};
