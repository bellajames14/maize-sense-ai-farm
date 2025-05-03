
import { Upload, Cloud, MessageSquare } from "lucide-react";
import { AnalyticsCard } from "./AnalyticsCard";
import { usePreferences } from "@/hooks/usePreferences";

interface DashboardData {
  totalScans: number;
  diseasesDetected: number;
  weatherAlerts: number;
  aiChats: number;
}

interface AnalyticsCardsProps {
  dashboardData: DashboardData;
  isLoading: boolean;
}

export function AnalyticsCards({ dashboardData, isLoading }: AnalyticsCardsProps) {
  const { translate } = usePreferences();

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
      <AnalyticsCard
        title={translate("totalScans")}
        value={dashboardData.totalScans}
        description={translate("yourTotalScans")}
        icon={<Upload className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <AnalyticsCard
        title={translate("diseasesDetected")}
        value={dashboardData.diseasesDetected}
        description={translate("issuesIdentified")}
        icon={<Upload className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <AnalyticsCard
        title={translate("weatherAlerts")}
        value={dashboardData.weatherAlerts}
        description={translate("weatherInsightsSaved")}
        icon={<Cloud className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <AnalyticsCard
        title={translate("aiChats")}
        value={dashboardData.aiChats}
        description={translate("aiAssistantInteractions")}
        icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
    </div>
  );
}
