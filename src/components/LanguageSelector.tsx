
import { usePreferences } from "@/hooks/usePreferences";
import { LanguageType } from "@/types/preferences";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

export const LanguageSelector = () => {
  const { language, setLanguage, translate } = usePreferences();

  const languages: { value: LanguageType; label: string }[] = [
    { value: "english", label: "English" },
    { value: "yoruba", label: "Yorùbá" },
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
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => handleLanguageChange(lang.value)}
            className="flex items-center justify-between"
          >
            {lang.label}
            {language === lang.value && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
