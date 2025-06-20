
import { useRef } from 'react';
import { predictDisease } from "../tensorflowService";

export const useTensorFlowAnalysis = () => {
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Analyze image using TensorFlow.js model
  const analyzeWithTensorflow = async (previewUrl: string): Promise<{diseaseName: string, confidence: number}> => {
    if (!imageRef.current) {
      throw new Error("Image reference not available");
    }
    
    // Create hidden image element for TensorFlow.js if not exists
    if (!imageRef.current.src) {
      imageRef.current.crossOrigin = "anonymous";
      imageRef.current.src = previewUrl;
    } else {
      imageRef.current.src = previewUrl;
    }
    
    // Make sure image is fully loaded
    return new Promise((resolve, reject) => {
      if (imageRef.current?.complete) {
        // Image already loaded
        predictDisease(imageRef.current)
          .then(result => resolve(result))
          .catch(error => reject(error));
      } else {
        // Wait for image to load
        imageRef.current!.onload = () => {
          predictDisease(imageRef.current!)
            .then(result => resolve(result))
            .catch(error => reject(error));
        };
        imageRef.current!.onerror = () => {
          reject(new Error("Failed to load image for analysis"));
        };
      }
    });
  };

  return {
    imageRef,
    analyzeWithTensorflow
  };
};
