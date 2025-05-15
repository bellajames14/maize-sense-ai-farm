
import * as tf from '@tensorflow/tfjs';
import { knownDiseases } from '../diseaseUtils';
import { loadModel } from './modelLoader';
import { preprocessImage } from './imageProcessor';

// Predict disease from image
export const predictDisease = async (imageElement: HTMLImageElement): Promise<{diseaseName: string, confidence: number}> => {
  try {
    console.log("Starting disease prediction process");
    
    const loadedModel = await loadModel();
    console.log("Model loaded for prediction");
    
    const processedImg = await preprocessImage(imageElement);
    console.log("Image preprocessed successfully");
    
    console.log("Running inference...");
    // Get prediction
    const predictions = await loadedModel.predict(processedImg) as tf.Tensor;
    
    // Use typed array for faster processing
    const predictionArray = await predictions.data();
    console.log("Raw predictions:", Array.from(predictionArray));
    
    // Find index with highest probability using typed array methods
    const maxIndex = Array.from(predictionArray).reduce(
      (iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 
      0
    );
    
    const maxProb = predictionArray[maxIndex];
    
    // Get disease name and confidence
    const diseaseName = knownDiseases[maxIndex] || "Unknown";
    const confidence = maxProb * 100; // Convert to percentage
    
    console.log("Prediction result:", diseaseName, "with confidence", confidence.toFixed(2) + "%");
    
    // Cleanup tensors to prevent memory leaks
    tf.dispose([processedImg, predictions]);
    
    return {
      diseaseName,
      confidence
    };
  } catch (error) {
    console.error("Error during disease prediction:", error);
    throw new Error("Disease detection failed: " + (error instanceof Error ? error.message : String(error)));
  }
};
