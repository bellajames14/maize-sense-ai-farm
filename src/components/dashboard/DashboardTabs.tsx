
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiseaseDetection } from "@/components/disease-detection/DiseaseDetection";
import { WeatherInsights } from "@/components/WeatherInsights";
import { AIAssistant } from "@/components/AIAssistant";
import { usePreferences } from "@/hooks/usePreferences";

interface DashboardTabsProps {
  currentTab: string;
  onTabChange: (value: string) => void;
}

export function DashboardTabs({ currentTab, onTabChange }: DashboardTabsProps) {
  const { translate } = usePreferences();

  return (
    <Tabs defaultValue={currentTab} className="space-y-6" onValueChange={onTabChange}>
      <TabsList className="w-full grid grid-cols-3 gap-1">
        <TabsTrigger value="disease">{translate("diseaseDetection")}</TabsTrigger>
        <TabsTrigger value="weather">{translate("weatherInsights")}</TabsTrigger>
        <TabsTrigger value="assistant">{translate("aiAssistant")}</TabsTrigger>
      </TabsList>
      <TabsContent value="disease" className="space-y-4 pt-4">
        <DiseaseDetection />
      </TabsContent>
      <TabsContent value="weather" className="space-y-4 pt-4">
        <WeatherInsights />
      </TabsContent>
      <TabsContent value="assistant" className="space-y-4 pt-4">
        <AIAssistant />
      </TabsContent>
    </Tabs>
  );
}
