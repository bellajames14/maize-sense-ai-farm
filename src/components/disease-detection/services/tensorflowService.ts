
// Re-export new local TensorFlow services
export { loadLocalModel } from './localModelLoader';
export { preprocessImageForModel } from './imagePreprocessor';
export { predictDiseaseLocal, type PredictionResult } from './localPredictionService';
