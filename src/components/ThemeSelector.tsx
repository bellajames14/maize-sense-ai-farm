
import { usePreferences } from "@/hooks/usePreferences";
import { ThemeType } from "@/types/preferences";
import { Check, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

export const ThemeSelector = () => {
  const { theme, setTheme, translate } = usePreferences();

  const themes: { value: ThemeType; label: string; icon: JSX.Element }[] = [
    { value: "light", label: translate("light"), icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: translate("dark"), icon: <Moon className="h-4 w-4" /> },
  ];

  const handleThemeChange = async (value: ThemeType) => {
    await setTheme(value);
  };

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          {currentTheme?.icon}
          <span>{currentTheme?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => handleThemeChange(t.value)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {t.icon}
              <span>{t.label}</span>
            </div>
            {theme === t.value && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
