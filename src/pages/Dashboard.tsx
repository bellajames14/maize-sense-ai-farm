
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiseaseDetection } from "@/components/DiseaseDetection";
import { WeatherInsights } from "@/components/WeatherInsights";
import { AIAssistant } from "@/components/AIAssistant";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { MessageSquare, Upload, Cloud } from "lucide-react";

const Dashboard = () => {
  const { tab = "disease" } = useParams<{ tab?: string }>();

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
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diseases Detected</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">+180% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weather Alerts</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">+19% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">27</div>
              <p className="text-xs text-muted-foreground">+7% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={tab} className="space-y-4">
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
