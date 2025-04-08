
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiseaseDetection } from "@/components/disease-detection/DiseaseDetection";
import { WeatherInsights } from "@/components/WeatherInsights";
import { AIAssistant } from "@/components/AIAssistant";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { MessageSquare, Upload, Cloud, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/hooks/usePreferences";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { tab = "disease" } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { translate } = usePreferences();
  const [dashboardData, setDashboardData] = useState({
    totalScans: 0,
    diseasesDetected: 0,
    weatherAlerts: 0,
    aiChats: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user activity data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Fetch total scans count
        const { count: scansCount, error: scansError } = await supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (scansError) throw scansError;
        
        // Fetch diseases detected (scans with a disease name)
        const { count: diseasesCount, error: diseasesError } = await supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('disease_name', 'is', null);
        
        if (diseasesError) throw diseasesError;
        
        // Fetch weather logs count
        const { count: weatherCount, error: weatherError } = await supabase
          .from('weather_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (weatherError) throw weatherError;
        
        // Fetch AI chats count
        const { count: chatsCount, error: chatsError } = await supabase
          .from('ai_chats')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (chatsError) throw chatsError;
        
        setDashboardData({
          totalScans: scansCount || 0,
          diseasesDetected: diseasesCount || 0,
          weatherAlerts: weatherCount || 0,
          aiChats: chatsCount || 0
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set default values if there's an error
        setDashboardData({
          totalScans: 0,
          diseasesDetected: 0,
          weatherAlerts: 0,
          aiChats: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    navigate(`/dashboard/${value}`);
  };

  return (
    <Layout>
      <div className="container mx-auto space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translate("totalScans")}</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboardData.totalScans}</div>
                  <p className="text-xs text-muted-foreground">{translate("yourTotalScans")}</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translate("diseasesDetected")}</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboardData.diseasesDetected}</div>
                  <p className="text-xs text-muted-foreground">{translate("issuesIdentified")}</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translate("weatherAlerts")}</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboardData.weatherAlerts}</div>
                  <p className="text-xs text-muted-foreground">{translate("weatherInsightsSaved")}</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translate("aiChats")}</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboardData.aiChats}</div>
                  <p className="text-xs text-muted-foreground">{translate("aiAssistantInteractions")}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={tab} className="space-y-4" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="disease">{translate("diseaseDetection")}</TabsTrigger>
            <TabsTrigger value="weather">{translate("weatherInsights")}</TabsTrigger>
            <TabsTrigger value="assistant">{translate("aiAssistant")}</TabsTrigger>
          </TabsList>
          <TabsContent value="disease" className="space-y-4">
            <DiseaseDetection />
          </TabsContent>
          <TabsContent value="weather" className="space-y-4">
            <WeatherInsights />
          </TabsContent>
          <TabsContent value="assistant" className="space-y-4">
            <AIAssistant />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
