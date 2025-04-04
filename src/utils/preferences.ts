
import { supabase } from "@/integrations/supabase/client";
import { ThemeType, LanguageType } from "@/types/preferences";

// Initialize preferences from localStorage
export const getInitialTheme = (): ThemeType => {
  if (typeof window !== "undefined") {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as ThemeType) || "light";
  }
  return "light";
};

export const getInitialLanguage = (): LanguageType => {
  if (typeof window !== "undefined") {
    const savedLanguage = localStorage.getItem("language");
    return (savedLanguage as LanguageType) || "english";
  }
  return "english";
};

// Apply theme to document
export const applyTheme = (theme: ThemeType) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  localStorage.setItem("theme", theme);
};

// Save language to localStorage
export const saveLanguage = (language: LanguageType) => {
  localStorage.setItem("language", language);
};

// Update theme in Supabase
export const updateThemeInSupabase = async (userId: string, theme: ThemeType) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ theme })
      .eq('id', userId);
      
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating theme preference:", error);
    return { success: false, error };
  }
};

// Update language in Supabase
export const updateLanguageInSupabase = async (userId: string, preferred_language: LanguageType) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ preferred_language })
      .eq('id', userId);
      
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating language preference:", error);
    return { success: false, error };
  }
};

// Load user preferences from Supabase
export const loadUserPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferred_language, theme')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    const preferences = { theme: null, language: null };
    
    if (data) {
      if (data.preferred_language === 'yoruba' || data.preferred_language === 'english') {
        preferences.language = data.preferred_language as LanguageType;
      }
      
      if (data.theme === 'light' || data.theme === 'dark') {
        preferences.theme = data.theme as ThemeType;
      }
    }
    
    return { success: true, data: preferences, error: null };
  } catch (error) {
    console.error("Error loading user preferences:", error);
    return { success: false, data: null, error };
  }
};
