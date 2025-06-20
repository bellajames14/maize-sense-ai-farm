
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsCards } from "@/components/dashboard/AnalyticsCards";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useEnhancedDashboardData } from "@/hooks/useEnhancedDashboardData";
import { useEffect } from "react";

const Dashboard = () => {
  const { tab = "disease" } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dashboardData, isLoading, refreshDashboard } = useEnhancedDashboardData(user);

  const handleTabChange = (value: string) => {
    navigate(`/dashboard/${value}`);
  };

  useEffect(() => {
    if (user) {
      refreshDashboard();
    }
  }, [user, refreshDashboard]);

  return (
    <Layout>
      <div className="container px-2 sm:px-4 md:px-6 mx-auto space-y-6">
        <AnalyticsCards 
          dashboardData={dashboardData}
          isLoading={isLoading}
        />
        <DashboardTabs 
          currentTab={tab} 
          onTabChange={handleTabChange} 
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
