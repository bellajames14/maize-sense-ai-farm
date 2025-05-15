
import { englishTranslations } from './english';
import { yorubaTranslations } from './yoruba';
import { aiAssistantTranslations as englishAIAssistant } from './features/aiAssistant.english';
import { aiAssistantTranslations as yorubaAIAssistant } from './features/aiAssistant.yoruba';
import { diseaseDetectionTranslations as englishDiseaseDetection } from './features/diseaseDetection.english';
import { diseaseDetectionTranslations as yorubaDiseaseDetection } from './features/diseaseDetection.yoruba';
import { weatherTranslations as englishWeather } from './features/weather.english';
import { weatherTranslations as yorubaWeather } from './features/weather.yoruba';
import { preferencesTranslations as englishPreferences } from './features/preferences.english';
import { preferencesTranslations as yorubaPreferences } from './features/preferences.yoruba';
import { dashboardTranslations as englishDashboard } from './features/dashboard.english';
import { dashboardTranslations as yorubaDashboard } from './features/dashboard.yoruba';
import { navigationTranslations as englishNavigation } from './features/navigation.english';
import { navigationTranslations as yorubaNavigation } from './features/navigation.yoruba';
import { otherTranslations as englishOther } from './features/other.english';
import { otherTranslations as yorubaOther } from './features/other.yoruba';
import { settingsTranslations as englishSettings } from './features/settings.english';
import { settingsTranslations as yorubaSettings } from './features/settings.yoruba';

// Merge all English translations
const english = {
  ...englishTranslations,
  ...englishAIAssistant,
  ...englishDiseaseDetection,
  ...englishWeather,
  ...englishPreferences,
  ...englishDashboard,
  ...englishNavigation,
  ...englishOther,
  ...englishSettings
};

// Merge all Yoruba translations
const yoruba = {
  ...yorubaTranslations,
  ...yorubaAIAssistant,
  ...yorubaDiseaseDetection,
  ...yorubaWeather,
  ...yorubaPreferences,
  ...yorubaDashboard,
  ...yorubaNavigation,
  ...yorubaOther,
  ...yorubaSettings
};

// Export the translations object
export const translations = {
  english,
  yoruba
};
