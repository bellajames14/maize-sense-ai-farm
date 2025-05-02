import * as tf from '@tensorflow/tfjs';
import { knownDiseases } from './diseaseUtils';

// URL to the hosted model on Supabase
const MODEL_URL = 'https://sfsdfdcdethqjwtjrwpz.supabase.co/storage/v1/object/public/tfjs-models/Maize_disease_model/model.json';
let model: tf.LayersModel | null = null;

// Load the model
export const loadModel = async (): Promise<tf.LayersModel> => {
  if (model) {
    console.log("Using cached model");
    return model;
  }
  
  try {
    console.log("Starting model download from:", MODEL_URL);
    
    // Add a timeout promise to detect network issues
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Model download timed out after 30 seconds")), 30000);
    });
    
    // Race the model loading against the timeout
    model = await Promise.race([
      tf.loadLayersModel(MODEL_URL),
      timeoutPromise
    ]) as tf.LayersModel;
    
    console.log("Model downloaded and loaded successfully");
    console.log("Model summary:", model.summary());
    
    // Perform a simple prediction to ensure the model works
    console.log("Warming up model with test tensor...");
    const dummyTensor = tf.zeros([1, 224, 224, 3]);
    const warmupResult = model.predict(dummyTensor);
    tf.dispose(dummyTensor);
    tf.dispose(warmupResult);
    console.log("Model warm-up complete");
    
    return model;
  } catch (error) {
    console.error("Failed to load TensorFlow.js model:", error);
    // Check if it's a CORS error
    if (error instanceof Error && error.message.includes('CORS')) {
      throw new Error("CORS error when loading model. The model server doesn't allow access from this website.");
    }
    // Check if it's a network error
    else if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('timed out'))) {
      throw new Error("Network error when downloading the model. Please check your internet connection and try again.");
    }
    throw new Error(`Failed to load disease detection model: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

// Process image for model input
export const preprocessImage = async (imageElement: HTMLImageElement): Promise<tf.Tensor> => {
  return tf.tidy(() => {
    try {
      console.log("Preprocessing image, dimensions:", imageElement.width, "x", imageElement.height);
      
      // Convert image to tensor
      let imgTensor = tf.browser.fromPixels(imageElement);
      console.log("Image tensor shape:", imgTensor.shape);
      
      // Resize to model input size (224x224)
      imgTensor = tf.image.resizeBilinear(imgTensor, [224, 224]);
      console.log("Resized tensor shape:", imgTensor.shape);
      
      // Normalize pixel values to [0,1]
      imgTensor = imgTensor.toFloat().div(tf.scalar(255));
      
      // Expand dimensions to match model input shape [1, 224, 224, 3]
      return imgTensor.expandDims(0);
    } catch (error) {
      console.error("Error preprocessing image:", error);
      throw new Error("Failed to process the image. Please try with a different image.");
    }
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
