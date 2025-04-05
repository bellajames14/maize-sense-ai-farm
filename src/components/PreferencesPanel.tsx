
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePreferences } from "@/hooks/usePreferences";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeSelector } from "./ThemeSelector";
import { Label } from "./ui/label";
import { useToast } from "./ui/use-toast";
import { useEffect, useState } from "react";

export const PreferencesPanel = () => {
  const { translate, language, theme } = usePreferences();
  const { toast } = useToast();
  const [initialLanguage, setInitialLanguage] = useState(language);
  const [initialTheme, setInitialTheme] = useState(theme);

  // Watch for changes in language or theme and show a notification
  useEffect(() => {
    // Don't show toast on initial render
    if (initialLanguage !== language) {
      toast({
        title: translate("Preferences Updated"),
        description: translate("Language changed to") + ` ${language === "english" ? "English" : "Yorùbá"}`,
      });
      setInitialLanguage(language);
    }
  }, [language, toast, translate]);

  useEffect(() => {
    // Don't show toast on initial render
    if (initialTheme !== theme) {
      toast({
        title: translate("Preferences Updated"),
        description: translate("Theme changed to") + ` ${theme}`,
      });
      setInitialTheme(theme);
    }
  }, [theme, toast, translate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translate("appPreferences")}</CardTitle>
        <CardDescription>{translate("customizeExperience")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="language">{translate("language")}</Label>
          <div id="language" className="flex items-center">
            <LanguageSelector />
            <p className="text-xs text-muted-foreground ml-2">
              {translate("affectsAI")}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="theme">{translate("theme")}</Label>
          <div id="theme">
            <ThemeSelector />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
