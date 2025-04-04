
import React, { createContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import { translations } from "@/utils/translations";
import { 
  ThemeType, 
  LanguageType, 
  PreferencesContextType 
} from "@/types/preferences";
import { 
  getInitialTheme, 
  getInitialLanguage, 
  applyTheme, 
  saveLanguage,
  updateThemeInSupabase,
  updateLanguageInSupabase,
  loadUserPreferences
} from "@/utils/preferences";

export const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeType>(getInitialTheme);
  const [language, setLanguageState] = useState<LanguageType>(getInitialLanguage);

  // Apply theme effect
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Save language to localStorage
  useEffect(() => {
    saveLanguage(language);
  }, [language]);

  // Load user preferences from Supabase
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) return;
      
      const { data } = await loadUserPreferences(user.id);
      
      if (data) {
        if (data.language) {
          setLanguageState(data.language);
        }
        
        if (data.theme) {
          setThemeState(data.theme);
        }
      }
    };
    
    fetchUserPreferences();
  }, [user]);

  // Function to update theme with Supabase sync
  const updateTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    
    if (user) {
      await updateThemeInSupabase(user.id, newTheme);
    }
  };

  // Function to update language with Supabase sync
  const updateLanguage = async (newLanguage: LanguageType) => {
    setLanguageState(newLanguage);
    
    if (user) {
      await updateLanguageInSupabase(user.id, newLanguage);
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

export { usePreferences } from "@/hooks/usePreferences";
