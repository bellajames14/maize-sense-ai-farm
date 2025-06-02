
// Text utilities for cleaning and formatting agricultural advice

export const textUtils = {
  // Clean text for farmers - remove markdown, format properly
  cleanTextForFarmers: (text: string): string => {
    if (!text) return "";
    
    return text
      // Remove markdown asterisks
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      // Clean up numbered lists - ensure proper spacing
      .replace(/(\d+\.\s*\*\*[^*]+\*\*:?\s*)/g, (match) => {
        return match.replace(/\*\*/g, '').trim() + '\n';
      })
      // Format numbered points properly
      .replace(/(\d+\.\s*)([^.]+\.)/g, '$1$2\n')
      // Clean up bullet points
      .replace(/[-•]\s*/g, '• ')
      // Remove extra whitespace and normalize spacing
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      // Ensure sentences end with periods
      .replace(/([^.!?])\s*$/g, '$1.')
      .trim();
  },

  // Format treatment steps as numbered list
  formatTreatmentSteps: (text: string): string => {
    if (!text) return "";
    
    // Clean the text first
    let cleaned = textUtils.cleanTextForFarmers(text);
    
    // If it's already well formatted with numbers, return as is
    if (/^\d+\./.test(cleaned)) {
      return cleaned;
    }
    
    // Split into sentences and create numbered list
    const sentences = cleaned
      .split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 10)
      .map(sentence => sentence.trim())
      .filter(Boolean);
    
    if (sentences.length <= 1) {
      return cleaned;
    }
    
    return sentences
      .map((sentence, index) => `${index + 1}. ${sentence}.`)
      .join('\n');
  },

  // Format prevention tips as bullet points
  formatPreventionTips: (text: string): string => {
    if (!text) return "";
    
    // Clean the text first
    let cleaned = textUtils.cleanTextForFarmers(text);
    
    // If it's already well formatted with bullets, return as is
    if (/^[•-]/.test(cleaned)) {
      return cleaned;
    }
    
    // Split into sentences and create bullet list
    const sentences = cleaned
      .split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 10)
      .map(sentence => sentence.trim())
      .filter(Boolean);
    
    if (sentences.length <= 1) {
      return cleaned;
    }
    
    return sentences
      .map(sentence => `• ${sentence}.`)
      .join('\n');
  }
};
