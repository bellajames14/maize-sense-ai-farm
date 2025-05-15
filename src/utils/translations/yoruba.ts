
import { navigationTranslations } from './features/navigation.yoruba';
import { dashboardTranslations } from './features/dashboard.yoruba';
import { settingsTranslations } from './features/settings.yoruba';
import { aiAssistantTranslations } from './features/aiAssistant.yoruba';
import { weatherTranslations } from './features/weather.yoruba';
import { diseaseDetectionTranslations } from './features/diseaseDetection.yoruba';
import { preferencesTranslations } from './features/preferences.yoruba';
import { otherTranslations } from './features/other.yoruba';

// Combine all Yoruba translations
export const yorubaTranslations = {
  ...navigationTranslations,
  ...dashboardTranslations,
  ...settingsTranslations,
  ...aiAssistantTranslations,
  ...weatherTranslations,
  ...diseaseDetectionTranslations,
  ...preferencesTranslations,
  ...otherTranslations
};
