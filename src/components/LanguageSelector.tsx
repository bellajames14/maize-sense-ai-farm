
import { usePreferences } from "@/hooks/usePreferences";
import { LanguageType } from "@/types/preferences";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

export const LanguageSelector = () => {
  const { language, setLanguage, translate } = usePreferences();

  const languages: { value: LanguageType; label: string; nativeLabel: string }[] = [
    { value: "english", label: "English", nativeLabel: "English" },
    { value: "yoruba", label: "Yorùbá", nativeLabel: "Yorùbá" },
  ];

  const handleLanguageChange = async (value: LanguageType) => {
    await setLanguage(value);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Globe className="h-4 w-4" />
          <span>{language === "english" ? "English" : "Yorùbá"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{translate("language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => handleLanguageChange(lang.value)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span>{lang.nativeLabel}</span>
              <span className="text-xs text-muted-foreground">
                {lang.value === "english" 
                  ? "Change all app text to English" 
                  : "Yi gbogbo ọrọ app pada si Yorùbá"}
              </span>
            </div>
            {language === lang.value && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
