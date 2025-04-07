
// Utility functions for text processing

export const textUtils = {
  // Clean text by removing asterisks and markdown formatting and simplifying language
  cleanTextForFarmers(text: string): string {
    if (!text) return text;
    
    // Remove asterisks used for emphasis
    let cleanedText = text.replace(/\*\*?(.*?)\*\*?/g, "$1");
    
    // Replace markdown bullet points with simple dashes
    cleanedText = cleanedText.replace(/\* /g, "- ");
    
    // Replace complex words with simpler alternatives
    const simpleWordReplacements: Record<string, string> = {
      "fertilizer": "plant food",
      "pesticide": "bug spray",
      "herbicide": "weed killer",
      "fungicide": "plant medicine",
      "irrigation": "watering",
      "cultivation": "growing",
      "precipitation": "rain",
      "utilize": "use",
      "implement": "use",
      "appropriate": "right",
      "sufficient": "enough",
      "immediately": "now",
      "subsequently": "after that",
      "approximately": "about",
      "significantly": "a lot",
      "initiate": "start",
      "terminate": "end",
      "commence": "begin",
      "nitrogen": "plant food",
      "nutrient deficiency": "not enough food for plants",
      "dormant": "sleeping",
      "propagation": "growing new plants",
      "germination": "seed starting"
    };
    
    // Apply word replacements
    Object.keys(simpleWordReplacements).forEach(complexWord => {
      const regex = new RegExp(`\\b${complexWord}\\b`, "gi");
      cleanedText = cleanedText.replace(regex, simpleWordReplacements[complexWord]);
    });
    
    return cleanedText;
  }
};
