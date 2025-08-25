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

// Simple and reliable model loading with proper error handling
const loadModel = async (): Promise<tf.LayersModel> => {
  if (cachedModel) {
    console.log('Using cached model');
    return cachedModel;
  }

  const MODEL_URL = 'https://sfsdfdcdethqjwtjrwpz.supabase.co/storage/v1/object/public/tfjs-models/Maize_disease_model_v1/model.json';
  
  console.log('Loading model from:', MODEL_URL);
  
  try {
    // Set up TensorFlow backend
    await tf.setBackend('webgl');
    await tf.ready();
    
    // Load model with custom loading options
    const model = await tf.loadLayersModel(MODEL_URL, {
      strict: false // Allow loading models with minor configuration issues
    });
    
    console.log('Model loaded successfully');
    console.log('Input shape:', model.inputs[0].shape);
    console.log('Output shape:', model.outputs[0].shape);
    
    // Warm up the model with a dummy prediction
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
    
    // Instead of a dummy model, throw the error so we can use Gemini as fallback
    throw new Error(`Cannot load your trained model: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Simple preprocessing for the actual model
function preprocessImage(img: HTMLImageElement, imgSize: [number, number] = [224, 224]) {
  return tf.tidy(() => {
    let tensor = tf.browser.fromPixels(img)       // convert <img> to tensor
      .toFloat()
      .resizeBilinear(imgSize)                    // resize to IMG_SIZE
      .div(255.0)                                 // normalize [0,1]
      .expandDims(0);                             // add batch dim [1, h, w, 3]
    return tensor;
  });
}

// Simple inference (based on user's provided code)
async function inferTFJS(model: tf.LayersModel, imgTensor: tf.Tensor) {
  const predictions = model.predict(imgTensor) as tf.Tensor;  // forward pass
  let probs = await predictions.data();            // get raw values
  let sum = Array.from(probs).reduce((a, b) => a + b, 0);

  // If probs don't sum to ~1, apply softmax
  if (sum <= 0 || sum > 1.0001) {
    const probsArray = Array.from(probs);
    const maxProb = Math.max(...probsArray);
    const exp = probsArray.map(p => Math.exp(p - maxProb));
    const expSum = exp.reduce((a, b) => a + b, 0);
    probs = new Float32Array(exp.map(v => v / expSum));
  }

  // Clean up the prediction tensor
  predictions.dispose();

  return Array.from(probs);
}

// Enhanced prediction using the user's reliable approach
export const predictDiseaseWithAccuracy = async (imageElement: HTMLImageElement): Promise<PredictionResult> => {
  const startTime = performance.now();
  
  try {
    console.log('=== Starting Disease Prediction ===');
    
    // Load model
    const model = await loadModel();
    
    // Preprocess image
    const preprocessStart = performance.now();
    const processedTensor = preprocessImage(imageElement);
    const preprocessEnd = performance.now();
    
    console.log('Image preprocessed successfully');
    
    // Run inference
    const predictionStart = performance.now();
    const probabilities = await inferTFJS(model, processedTensor);
    const predictionEnd = performance.now();
    
    console.log('Raw prediction probabilities:', probabilities);
    
    // Find best prediction
    const maxIndex = probabilities.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
    const maxProb = probabilities[maxIndex];
    
    // Get disease name
    const diseaseName = knownDiseases[maxIndex] || "Unknown";
    const confidence = maxProb * 100;
    
    console.log(`Prediction: ${diseaseName} with ${confidence.toFixed(2)}% confidence`);
    
    // Cleanup
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
