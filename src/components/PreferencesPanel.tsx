
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePreferences } from "@/hooks/usePreferences";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeSelector } from "./ThemeSelector";
import { Label } from "./ui/label";

export const PreferencesPanel = () => {
  const { translate } = usePreferences();

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
