
// Main entry point that re-exports all translations
import { englishTranslations } from './english';
import { yorubaTranslations } from './yoruba';

// Export the complete translations object with the same structure as before
export const translations = {
  english: englishTranslations,
  yoruba: yorubaTranslations
};
