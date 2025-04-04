
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiseaseDetection } from "@/components/DiseaseDetection";
import { WeatherInsights } from "@/components/WeatherInsights";
import { AIAssistant } from "@/components/AIAssistant";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { MessageSquare, Upload, Cloud, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { tab = "disease" } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Fetch total scans count
        const { count: scansCount } = await supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        // Fetch diseases detected (scans with a disease name)
        const { count: diseasesCount } = await supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('disease_name', 'is', null);
        
        // Fetch weather logs count
        const { count: weatherCount } = await supabase
          .from('weather_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        // Fetch AI chats count
        const { count: chatsCount } = await supabase
          .from('ai_chats')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        setDashboardData({
          totalScans: scansCount || 0,
          diseasesDetected: diseasesCount || 0,
          weatherAlerts: weatherCount || 0,
          aiChats: chatsCount || 0
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
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
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
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
                  <p className="text-xs text-muted-foreground">Your total disease scans</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diseases Detected</CardTitle>
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
                  <p className="text-xs text-muted-foreground">Issues identified in your crops</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weather Alerts</CardTitle>
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
                  <p className="text-xs text-muted-foreground">Weather insights saved</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Chats</CardTitle>
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
                  <p className="text-xs text-muted-foreground">AI assistant interactions</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={tab} className="space-y-4" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="disease">Disease Detection</TabsTrigger>
            <TabsTrigger value="weather">Weather Insights</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
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
