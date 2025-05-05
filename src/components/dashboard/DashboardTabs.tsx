
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    // Check for tab parameter in URL when component mounts
    const tabParam = searchParams.get('tab');
    if (tabParam && ['disease', 'weather', 'assistant'].includes(tabParam)) {
      // Only update if the tab is different from current
      if (tabParam !== currentTab) {
        onTabChange(tabParam);
      }
    }
  }, [searchParams, currentTab, onTabChange]);
  
  // Update the URL when tab changes
  const handleTabChange = (value: string) => {
    onTabChange(value);
    setSearchParams({ tab: value });
  };

  return (
    <Tabs 
      defaultValue={currentTab} 
      value={currentTab}
      className="space-y-6" 
      onValueChange={handleTabChange}
    >
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
