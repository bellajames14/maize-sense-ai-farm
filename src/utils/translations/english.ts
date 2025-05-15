
import { navigationTranslations } from './features/navigation.english';
import { dashboardTranslations } from './features/dashboard.english';
import { settingsTranslations } from './features/settings.english';
import { aiAssistantTranslations } from './features/aiAssistant.english';
import { weatherTranslations } from './features/weather.english';
import { diseaseDetectionTranslations } from './features/diseaseDetection.english';
import { preferencesTranslations } from './features/preferences.english';
import { otherTranslations } from './features/other.english';

// Combine all English translations
export const englishTranslations = {
  ...navigationTranslations,
  ...dashboardTranslations,
  ...settingsTranslations,
  ...aiAssistantTranslations,
  ...weatherTranslations,
  ...diseaseDetectionTranslations,
  ...preferencesTranslations,
  ...otherTranslations
};
