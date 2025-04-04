
export type ThemeType = "light" | "dark";
export type LanguageType = "english" | "yoruba";

export interface PreferencesContextType {
  theme: ThemeType;
  language: LanguageType;
  setTheme: (theme: ThemeType) => Promise<void>;
  setLanguage: (language: LanguageType) => Promise<void>;
  translations: Record<string, Record<string, string>>;
  translate: (key: string) => string;
}
