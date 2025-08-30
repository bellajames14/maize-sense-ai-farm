import * as tf from '@tensorflow/tfjs';
import { loadLocalModel } from './localModelLoader';
import { preprocessImageForModel } from './imagePreprocessor';
import { knownDiseases } from '../diseaseUtils';

export interface PredictionResult {
  diseaseName: string;
  confidence: number;
  rawPredictions?: number[];
}

// Predict disease using local TensorFlow.js model
export const predictDiseaseLocal = async (imageElement: HTMLImageElement): Promise<PredictionResult> => {
  try {
    console.log("Starting local disease prediction");
    
    // Load model
    const model = await loadLocalModel();
    console.log("Model loaded for prediction");
    
    // Preprocess image
    const inputTensor = preprocessImageForModel(imageElement);
    console.log("Image preprocessed for prediction");
    
    // Run prediction
    console.log("Running model inference...");
    const predictions = model.predict(inputTensor) as tf.Tensor;
    
    // Get prediction data
    const predictionData = await predictions.data();
    const predictionArray = Array.from(predictionData);
    
    console.log("Raw predictions:", predictionArray);
    
    // Find class with highest probability
    const maxIndex = predictionArray.reduce(
      (iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 
      0
    );
    
    const maxProbability = predictionArray[maxIndex];
    const diseaseName = knownDiseases[maxIndex] || "Unknown";
    const confidence = maxProbability * 100; // Convert to percentage
    
    console.log(`Prediction: ${diseaseName} with ${confidence.toFixed(2)}% confidence`);
    
    // Cleanup tensors
    inputTensor.dispose();
    predictions.dispose();
    
    return {
      diseaseName,
      confidence,
      rawPredictions: predictionArray
    };
  } catch (error) {
    console.error("Error during local disease prediction:", error);
    throw new Error("Disease prediction failed: " + (error instanceof Error ? error.message : String(error)));
  }
};