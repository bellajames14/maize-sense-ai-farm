
import * as tf from '@tensorflow/tfjs';
import { knownDiseases } from './diseaseUtils';

// URL to the hosted model on Supabase
const MODEL_URL = 'https://sfsdfdcdethqjwtjrwpz.supabase.co/storage/v1/object/public/tfjs-models/Maize_disease_model/model.json';
let model: tf.LayersModel | null = null;

// Load the model
export const loadModel = async (): Promise<tf.LayersModel> => {
  if (model) return model;
  
  try {
    console.log("Loading TensorFlow.js model...");
    model = await tf.loadLayersModel(MODEL_URL);
    console.log("Model loaded successfully");
    return model;
  } catch (error) {
    console.error("Failed to load TensorFlow.js model:", error);
    throw new Error("Failed to load disease detection model. Please try again later.");
  }
};

// Process image for model input
export const preprocessImage = async (imageElement: HTMLImageElement): Promise<tf.Tensor> => {
  return tf.tidy(() => {
    // Convert image to tensor
    let imgTensor = tf.browser.fromPixels(imageElement);
    
    // Resize to model input size (assumed to be 224x224)
    imgTensor = tf.image.resizeBilinear(imgTensor, [224, 224]);
    
    // Normalize pixel values to [0,1]
    imgTensor = imgTensor.toFloat().div(tf.scalar(255));
    
    // Expand dimensions to match model input shape [1, 224, 224, 3]
    return imgTensor.expandDims(0);
  });
};

// Predict disease from image
export const predictDisease = async (imageElement: HTMLImageElement): Promise<{diseaseName: string, confidence: number}> => {
  try {
    const loadedModel = await loadModel();
    const processedImg = await preprocessImage(imageElement);
    
    // Get prediction
    const predictions = await loadedModel.predict(processedImg) as tf.Tensor;
    const predictionArray = await predictions.data();
    
    // Find index with highest probability
    let maxIndex = 0;
    let maxProb = predictionArray[0];
    
    for (let i = 1; i < predictionArray.length; i++) {
      if (predictionArray[i] > maxProb) {
        maxProb = predictionArray[i];
        maxIndex = i;
      }
    }
    
    // Get disease name and confidence
    const diseaseName = knownDiseases[maxIndex] || "Unknown";
    const confidence = maxProb * 100; // Convert to percentage
    
    // Cleanup tensors to prevent memory leaks
    tf.dispose([processedImg, predictions]);
    
    return {
      diseaseName,
      confidence
    };
  } catch (error) {
    console.error("Error during disease prediction:", error);
    throw new Error("Failed to analyze the image. Please try again.");
  }
};
