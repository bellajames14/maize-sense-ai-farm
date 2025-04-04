
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

type ThemeType = "light" | "dark";
type LanguageType = "english" | "yoruba";

interface PreferencesContextType {
  theme: ThemeType;
  language: LanguageType;
  setTheme: (theme: ThemeType) => Promise<void>;
  setLanguage: (language: LanguageType) => Promise<void>;
  translations: Record<string, Record<string, string>>;
  translate: (key: string) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

// English to Yoruba translations
const translations = {
  english: {
    // Navigation
    "home": "Home",
    "diseaseDetection": "Disease Detection",
    "weatherInsights": "Weather Insights",
    "aiAssistant": "AI Assistant",
    "knowledgeBase": "Knowledge Base",
    "alerts": "Alerts & Notifications",
    "settings": "Settings",
    "account": "Account",
    "notifications": "Notifications",
    "preferences": "Preferences",
    "signOut": "Sign Out",
    
    // Dashboard
    "totalScans": "Total Scans",
    "diseasesDetected": "Diseases Detected",
    "weatherAlerts": "Weather Alerts",
    "aiChats": "AI Chats",
    "yourTotalScans": "Your total disease scans",
    "issuesIdentified": "Issues identified in your crops",
    "weatherInsightsSaved": "Weather insights saved",
    "aiAssistantInteractions": "AI assistant interactions",
    
    // Settings
    "profile": "Profile",
    "manageAccount": "Manage your account information",
    "fullName": "Full Name",
    "email": "Email",
    "phoneNumber": "Phone Number",
    "changePhoto": "Change Photo",
    "saveChanges": "Save Changes",
    "password": "Password",
    "changePassword": "Change your password",
    "currentPassword": "Current Password",
    "newPassword": "New Password",
    "confirmPassword": "Confirm New Password",
    "notificationPreferences": "Notification Preferences",
    "chooseNotifications": "Choose how you want to receive notifications",
    "emailNotifications": "Email Notifications",
    "pushNotifications": "Push Notifications",
    "smsNotifications": "SMS Notifications",
    "receiveEmailUpdates": "Receive updates, alerts and recommendations via email",
    "receiveRealTimeAlerts": "Receive real-time alerts on your device",
    "receiveTextMessages": "Receive important alerts via text message",
    "savePreferences": "Save Preferences",
    "appPreferences": "App Preferences",
    "customizeExperience": "Customize your app experience",
    "language": "Language",
    "theme": "Theme",
    "light": "Light",
    "dark": "Dark",
    "affectsAI": "This affects AI assistant responses and app content",
    "farmLocation": "Farm Location",
    "defaultLocation": "Default Weather Location",
    "setDefaultLocation": "Set your default farm location for weather reports",
    
    // AI Assistant
    "askMaizeQuestion": "Ask a question about maize farming...",
    "send": "Send",
    "waitingForResponse": "Waiting for response...",
    
    // Weather Insights
    "currentWeather": "Current Weather",
    "weatherForecast": "Weather Forecast",
    "farmingTips": "Farming Tips",
    "searchLocation": "Search Location",
    "getWeather": "Get Weather",
    "temperature": "Temperature",
    "humidity": "Humidity",
    "pressure": "Pressure",
    "precipitation": "Precipitation",
    "windSpeed": "Wind Speed",
    "condition": "Condition",
    "recommendations": "Recommendations",
    
    // Disease Detection
    "uploadImage": "Upload Image",
    "scanImage": "Scan Image",
    "diseaseResults": "Disease Detection Results",
    "confidence": "Confidence",
    "affectedArea": "Affected Area Estimate",
    "treatmentTips": "Treatment Tips",
    "preventionTips": "Prevention Tips",
    "uploadInstructions": "Upload a clear image of your maize plant for disease detection"
  },
  yoruba: {
    // Navigation
    "home": "Ile",
    "diseaseDetection": "Iwadi Arun",
    "weatherInsights": "Akiyesi Oju Ojo",
    "aiAssistant": "Alawusa AI",
    "knowledgeBase": "Ibi Imo",
    "alerts": "Ikilo ati Ifitoniletaniwo",
    "settings": "Eto",
    "account": "Akanti",
    "notifications": "Ifitoniletaniwo",
    "preferences": "Afojusun",
    "signOut": "Jade Sinu",
    
    // Dashboard
    "totalScans": "Gbogbo Iwadi",
    "diseasesDetected": "Arun Ti A Ri",
    "weatherAlerts": "Ikilo Oju Ojo",
    "aiChats": "Ibaraenisorosoro AI",
    "yourTotalScans": "Gbogbo iwadi arun re",
    "issuesIdentified": "Awon isoro ti a ri ninu irugbin re",
    "weatherInsightsSaved": "Akiyesi oju ojo ti a fi pamosi",
    "aiAssistantInteractions": "Ibaraenisorosoro pelu alawusa AI",
    
    // Settings
    "profile": "Profaili",
    "manageAccount": "Saakoso alaye akanti re",
    "fullName": "Oruko Kikun",
    "email": "Imeeli",
    "phoneNumber": "Nomba Foonu",
    "changePhoto": "Yi Foto Pada",
    "saveChanges": "Fi Ayipada Pamo",
    "password": "Ọrọigbaniwọle",
    "changePassword": "Yi Ọrọigbaniwọle Pada",
    "currentPassword": "Ọrọigbaniwọle Lọwọlọwọ",
    "newPassword": "Ọrọigbaniwọle Tuntun",
    "confirmPassword": "Jẹrisi Ọrọigbaniwọle Tuntun",
    "notificationPreferences": "Afojusun Ifitoniletaniwo",
    "chooseNotifications": "Yan bii o se fẹ gba ifitoniletaniwo",
    "emailNotifications": "Ifitoniletaniwo Imeeli",
    "pushNotifications": "Ifitoniletaniwo Tara",
    "smsNotifications": "Ifitoniletaniwo SMS",
    "receiveEmailUpdates": "Gba imudojuiwọn, ikilo ati imọran nipasẹ imeeli",
    "receiveRealTimeAlerts": "Gba ikilo lọgan ni ori ẹrọ rẹ",
    "receiveTextMessages": "Gba ikilo pataki nipasẹ ifiranṣẹ ọrọ",
    "savePreferences": "Fi Afojusun Pamo",
    "appPreferences": "Afojusun App",
    "customizeExperience": "Se eto iriri app re",
    "language": "Ede",
    "theme": "Awọ App",
    "light": "Funfun",
    "dark": "Dudu",
    "affectsAI": "Eyi yoo ni ipa lori idahun alawusa AI ati akoonu app",
    "farmLocation": "Ipo Oko",
    "defaultLocation": "Ipo Aiyipada fun Oju Ojo",
    "setDefaultLocation": "Yan ipo oko rẹ fun ijabọ oju ojo",
    
    // AI Assistant
    "askMaizeQuestion": "Beere ibeere nipa irugbin agbado...",
    "send": "Firanṣẹ",
    "waitingForResponse": "N duro fun idahun...",
    
    // Weather Insights
    "currentWeather": "Oju Ojo Lọwọlọwọ",
    "weatherForecast": "Asọtẹlẹ Oju Ojo",
    "farmingTips": "Imọran Agbe",
    "searchLocation": "Wa Ipo",
    "getWeather": "Gba Oju Ojo",
    "temperature": "Iwọn Oru",
    "humidity": "Irugbin",
    "pressure": "Ifunpa",
    "precipitation": "Ojo",
    "windSpeed": "Iyara Afẹfẹ",
    "condition": "Ipo",
    "recommendations": "Awọn Imọran",
    
    // Disease Detection
    "uploadImage": "Gbe Aworan Soke",
    "scanImage": "Yẹ Aworan Wo",
    "diseaseResults": "Awọn Esi Iwadi Arun",
    "confidence": "Idaniloju",
    "affectedArea": "Agbegbe ti O ni Ipa",
    "treatmentTips": "Imọran Itọju",
    "preventionTips": "Imọran Idaabobo",
    "uploadInstructions": "Gbe aworan to daju ti irugbin agbado re soke fun iwadi arun"
  }
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      return (savedTheme as ThemeType) || "light";
    }
    return "light";
  });
  
  const [language, setLanguageState] = useState<LanguageType>(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language");
      return (savedLanguage as LanguageType) || "english";
    }
    return "english";
  });

  // Apply theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // Load user preferences from Supabase
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferred_language, theme')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          if (data.preferred_language === 'yoruba' || data.preferred_language === 'english') {
            setLanguageState(data.preferred_language);
          }
          
          if (data.theme === 'light' || data.theme === 'dark') {
            setThemeState(data.theme);
          }
        }
      } catch (error) {
        console.error("Error loading user preferences:", error);
      }
    };
    
    loadUserPreferences();
  }, [user]);

  // Function to update theme with Supabase sync
  const updateTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ theme: newTheme })
          .eq('id', user.id);
      } catch (error) {
        console.error("Error updating theme preference:", error);
      }
    }
  };

  // Function to update language with Supabase sync
  const updateLanguage = async (newLanguage: LanguageType) => {
    setLanguageState(newLanguage);
    
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: newLanguage })
          .eq('id', user.id);
      } catch (error) {
        console.error("Error updating language preference:", error);
      }
    }
  };

  // Translation function
  const translate = (key: string) => {
    return translations[language][key] || key;
  };

  const value = {
    theme,
    language,
    setTheme: updateTheme,
    setLanguage: updateLanguage,
    translations,
    translate
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
