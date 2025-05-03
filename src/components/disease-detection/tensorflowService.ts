
import * as tf from '@tensorflow/tfjs';
import { knownDiseases } from './diseaseUtils';

// URL to the hosted model on Supabase
const MODEL_URL = 'https://sfsdfdcdethqjwtjrwpz.supabase.co/storage/v1/object/public/tfjs-models/Maize_disease_model/model.json';
let model: tf.LayersModel | null = null;

// Type definition for the model config
interface ModelConfig {
  config?: {
    layers?: any[];
    input_layers?: any[];
    output_layers?: any[];
  };
}

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
    
    // Use explicit model loading options to help with the InputLayer issue
    const modelLoadingOptions = {
      strict: false,
      weightPathPrefix: '', // Use default path
    };
    
    // Race the model loading against the timeout
    model = await Promise.race([
      tf.loadLayersModel(MODEL_URL, modelLoadingOptions),
      timeoutPromise
    ]) as tf.LayersModel;
    
    console.log("Model downloaded successfully");
    
    // Check model architecture and input shape
    const modelJSON = model.toJSON();
    const modelConfig = typeof modelJSON === 'string' 
      ? JSON.parse(modelJSON) as ModelConfig 
      : modelJSON as ModelConfig;
    
    console.log("Model config summary:", {
      layers: modelConfig.config?.layers?.length || 'unknown',
      inputLayers: modelConfig.config?.input_layers || 'unknown',
      outputLayers: modelConfig.config?.output_layers || 'unknown'
    });
    
    // Verify the model has layers properly configured
    if (!modelConfig.config?.layers || modelConfig.config.layers.length === 0) {
      throw new Error("Model loaded but has no layers defined");
    }
    
    // Perform a simple prediction with default inputs to ensure the model works
    try {
      console.log("Warming up model with test tensor...");
      // Create a tensor with the expected input shape for this kind of model (typically 1,224,224,3 for image models)
      const dummyTensor = tf.zeros([1, 224, 224, 3]);
      const warmupResult = model.predict(dummyTensor);
      
      if (Array.isArray(warmupResult)) {
        warmupResult.forEach(tensor => tf.dispose(tensor));
      } else {
        tf.dispose(warmupResult);
      }
      
      tf.dispose(dummyTensor);
      console.log("Model warm-up complete");
    } catch (warmupError) {
      console.error("Model warm-up failed:", warmupError);
      throw new Error(`Model loaded but failed validation: ${warmupError instanceof Error ? warmupError.message : "Unknown error"}`);
    }
    
    return model;
  } catch (error) {
    console.error("Failed to load TensorFlow.js model:", error);
    
    // Check if it's an InputLayer error
    if (error instanceof Error && error.message.includes('InputLayer')) {
      throw new Error("The model has an issue with its input layer configuration. Please check the model architecture.");
    }
    // Check if it's a CORS error
    else if (error instanceof Error && error.message.includes('CORS')) {
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
