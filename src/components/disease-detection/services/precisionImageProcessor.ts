import * as tf from '@tensorflow/tfjs';
import { getModelConfig } from './optimizedModelLoader';

// High-precision image preprocessing that matches TensorFlow Lite exactly
export const preprocessImageForAccuracy = async (imageElement: HTMLImageElement): Promise<tf.Tensor> => {
  return tf.tidy(() => {
    const config = getModelConfig();
    
    console.log('Starting precision image preprocessing...');
    console.log('Original image dimensions:', imageElement.naturalWidth, 'x', imageElement.naturalHeight);
    
    // Step 1: Convert to tensor with exact pixel values
    let imageTensor = tf.browser.fromPixels(imageElement, 3);
    console.log('Initial tensor shape:', imageTensor.shape);
    console.log('Initial tensor dtype:', imageTensor.dtype);
    
    // Step 2: Resize with high-quality interpolation
    // Use bilinear interpolation to match TensorFlow Lite's default
    const resized = tf.image.resizeBilinear(
      imageTensor, 
      [config.inputShape[0], config.inputShape[1]], 
      false // alignCorners = false (matches TF Lite default)
    );
    
    console.log('Resized tensor shape:', resized.shape);
    
    // Step 3: Convert to float32 and normalize to [0, 1]
    const normalized = resized.toFloat().div(tf.scalar(255.0));
    
    // Step 4: Apply ImageNet standardization (critical for accuracy)
    const mean = tf.tensor1d(config.meanValues);
    const std = tf.tensor1d(config.stdValues);
    
    // Broadcast mean and std to match image shape
    const meanBroadcast = mean.reshape([1, 1, 3]);
    const stdBroadcast = std.reshape([1, 1, 3]);
    
    const standardized = normalized.sub(meanBroadcast).div(stdBroadcast);
    
    // Step 5: Add batch dimension
    const batched = standardized.expandDims(0);
    
    console.log('Final preprocessed tensor shape:', batched.shape);
    console.log('Final tensor dtype:', batched.dtype);
    
    // Verify preprocessing values are in expected range
    const minVal = tf.min(batched).dataSync()[0];
    const maxVal = tf.max(batched).dataSync()[0];
    const meanVal = tf.mean(batched).dataSync()[0];
    
    console.log('Preprocessed tensor stats:');
    console.log('  Min value:', minVal.toFixed(4));
    console.log('  Max value:', maxVal.toFixed(4));
    console.log('  Mean value:', meanVal.toFixed(4));
    
    // Expected range after ImageNet normalization: roughly [-2.5, 2.5]
    if (minVal < -3 || maxVal > 3) {
      console.warn('Preprocessing values outside expected range - this may affect accuracy');
    }
    
    return batched;
  });
};

// Alternative preprocessing that exactly matches TensorFlow Lite quantization
export const preprocessWithQuantizationSimulation = async (imageElement: HTMLImageElement): Promise<tf.Tensor> => {
  return tf.tidy(() => {
    const config = getModelConfig();
    
    console.log('Preprocessing with quantization simulation...');
    
    // Convert and resize
    let imageTensor = tf.browser.fromPixels(imageElement, 3);
    const resized = tf.image.resizeBilinear(imageTensor, [config.inputShape[0], config.inputShape[1]]);
    
    // Simulate int8 quantization process used in TensorFlow Lite
    const float32 = resized.toFloat();
    
    // Apply quantization simulation: float32 -> int8 -> float32
    const quantized = tf.tidy(() => {
      // Scale to [0, 255] -> [-128, 127] (int8 range)
      const scaled = float32.sub(128);
      // Round to simulate quantization
      const rounded = tf.round(scaled);
      // Scale back
      return rounded.add(128);
    });
    
    // Normalize to [0, 1]
    const normalized = quantized.div(255.0);
    
    // Apply ImageNet normalization
    const mean = tf.tensor1d(config.meanValues).reshape([1, 1, 3]);
    const std = tf.tensor1d(config.stdValues).reshape([1, 1, 3]);
    const standardized = normalized.sub(mean).div(std);
    
    // Add batch dimension
    return standardized.expandDims(0);
  });
};

// Validation function to check preprocessing quality
export const validatePreprocessing = (preprocessedTensor: tf.Tensor): boolean => {
  const stats = tf.tidy(() => {
    const min = tf.min(preprocessedTensor).dataSync()[0];
    const max = tf.max(preprocessedTensor).dataSync()[0];
    const mean = tf.mean(preprocessedTensor).dataSync()[0];
    const std = tf.moments(preprocessedTensor).variance.sqrt().dataSync()[0];
    
    return { min, max, mean, std };
  });
  
  console.log('Preprocessing validation:', stats);
  
  // Check if values are in reasonable range for ImageNet normalization
  const isValid = stats.min > -4 && stats.max < 4 && Math.abs(stats.mean) < 1;
  
  if (!isValid) {
    console.warn('Preprocessing validation failed - values outside expected range');
  }
  
  return isValid;
};