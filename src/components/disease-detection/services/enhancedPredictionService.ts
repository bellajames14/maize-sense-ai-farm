import * as tf from '@tensorflow/tfjs';
import { knownDiseases } from '../diseaseUtils';

export interface PredictionResult {
  diseaseName: string;
  confidence: number;
  processingStats: {
    preprocessingTime: number;
    predictionTime: number;
    totalTime: number;
  };
}

// Cache the loaded model
let cachedModel: tf.LayersModel | null = null;

// Fix model configuration and load from Supabase
const loadModel = async (): Promise<tf.LayersModel> => {
  if (cachedModel) {
    console.log('Using cached model');
    return cachedModel;
  }

  console.log('Loading and fixing model configuration...');
  
  try {
    // Set up TensorFlow backend
    await tf.setBackend('webgl');
    await tf.ready();
    
    // First, try to fetch and fix the model.json configuration
    const modelConfigUrl = 'https://sfsdfdcdethqjwtjrwpz.supabase.co/storage/v1/object/public/tfjs-models/Maize_disease_model_v1/model.json';
    const response = await fetch(modelConfigUrl);
    const modelConfig = await response.json();
    
    console.log('Original model config:', modelConfig);
    
    // Fix the InputLayer configuration
    if (modelConfig.config && modelConfig.config.layers) {
      for (let layer of modelConfig.config.layers) {
        if (layer.class_name === 'InputLayer' && layer.config) {
          // Add the missing batchInputShape
          if (!layer.config.batch_input_shape && !layer.config.input_shape) {
            layer.config.batch_input_shape = [null, 224, 224, 3];
            console.log('Fixed InputLayer configuration');
          }
        }
      }
    }
    
    console.log('Fixed model config:', modelConfig);
    
    // Create a blob URL for the fixed configuration
    const fixedConfigBlob = new Blob([JSON.stringify(modelConfig)], { type: 'application/json' });
    const fixedConfigUrl = URL.createObjectURL(fixedConfigBlob);
    
    // Load model with fixed configuration
    const model = await tf.loadLayersModel(fixedConfigUrl);
    
    // Clean up the blob URL
    URL.revokeObjectURL(fixedConfigUrl);
    
    console.log('Model loaded successfully with fixed configuration');
    console.log('Input shape:', model.inputs[0].shape);
    console.log('Output shape:', model.outputs[0].shape);
    
    // Warm up the model
    const dummyInput = tf.zeros([1, 224, 224, 3]);
    const warmupPrediction = model.predict(dummyInput) as tf.Tensor;
    await warmupPrediction.data();
    dummyInput.dispose();
    warmupPrediction.dispose();
    
    console.log('Model warmed up successfully');
    
    cachedModel = model;
    return model;
  } catch (error) {
    console.error('Model loading failed:', error);
    throw new Error(`Cannot load trained model: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Preprocess image to (224, 224) and normalize to [0,1]
function preprocessImage(img: HTMLImageElement): tf.Tensor {
  return tf.tidy(() => {
    let tensor = tf.browser.fromPixels(img)       // convert <img> to tensor
      .toFloat()
      .resizeBilinear([224, 224])                 // resize to exactly (224, 224)
      .div(255.0)                                 // normalize to [0,1]
      .expandDims(0);                             // add batch dim [1, 224, 224, 3]
    
    console.log('Preprocessed tensor shape:', tensor.shape);
    return tensor;
  });
}

// Run model.predict() and return probabilities
async function inferTFJS(model: tf.LayersModel, imgTensor: tf.Tensor): Promise<number[]> {
  const predictions = model.predict(imgTensor) as tf.Tensor;  // forward pass
  const probs = await predictions.data();            // get raw probability values
  
  console.log('Raw prediction values:', Array.from(probs));
  
  // Clean up the prediction tensor
  predictions.dispose();

  return Array.from(probs);
}

// Enhanced prediction with confidence threshold handling
export const predictDiseaseWithAccuracy = async (imageElement: HTMLImageElement): Promise<PredictionResult> => {
  const startTime = performance.now();
  
  try {
    console.log('=== Starting Disease Prediction ===');
    
    // Load model from Supabase
    const model = await loadModel();
    
    // Preprocess image to (224, 224) and normalize to [0,1]
    const preprocessStart = performance.now();
    const processedTensor = preprocessImage(imageElement);
    const preprocessEnd = performance.now();
    
    console.log('Image preprocessed to shape:', processedTensor.shape);
    
    // Run model.predict()
    const predictionStart = performance.now();
    const probabilities = await inferTFJS(model, processedTensor);
    const predictionEnd = performance.now();
    
    console.log('Prediction probabilities:', probabilities);
    
    // Find class with highest confidence
    const maxIndex = probabilities.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
    const maxProb = probabilities[maxIndex];
    const confidence = maxProb * 100;
    
    console.log(`Highest confidence: ${confidence.toFixed(2)}% for class ${maxIndex}`);
    
    // Handle low confidence (below 50%)
    let diseaseName: string;
    if (confidence < 50) {
      diseaseName = "Low_Confidence";
      console.log('Confidence below 50%, suggesting clearer image');
    } else {
      diseaseName = knownDiseases[maxIndex] || "Unknown";
    }
    
    console.log(`Final prediction: ${diseaseName} with ${confidence.toFixed(2)}% confidence`);
    
    // Cleanup tensor
    processedTensor.dispose();
    
    const endTime = performance.now();
    const processingStats = {
      preprocessingTime: preprocessEnd - preprocessStart,
      predictionTime: predictionEnd - predictionStart,
      totalTime: endTime - startTime
    };
    
    console.log('Processing stats:', processingStats);
    console.log('=== Disease Prediction Completed ===');
    
    return {
      diseaseName,
      confidence,
      processingStats
    };
    
  } catch (error) {
    console.error('Prediction failed:', error);
    throw new Error(`Disease prediction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
