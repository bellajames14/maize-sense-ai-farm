
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiseaseDetection } from "@/components/DiseaseDetection";
import { WeatherInsights } from "@/components/WeatherInsights";
import { AIAssistant } from "@/components/AIAssistant";
import { useState } from "react";
import { Bell, Home, Menu, MessageSquare, Settings, Upload, User, Cloud } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 z-20 flex flex-col bg-card border-r shadow-sm transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-16"
        } md:left-0`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {isSidebarOpen ? (
            <span className="flex items-center gap-2 text-lg font-semibold">
              <img src="/placeholder.svg" alt="MaizeSense AI" className="h-6 w-6" />
              MaizeSense AI
            </span>
          ) : (
            <img src="/placeholder.svg" alt="MaizeSense AI" className="h-6 w-6 mx-auto" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 md:flex"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 py-2">
            {isSidebarOpen && <h2 className="mb-2 text-xs font-semibold text-muted-foreground">Dashboard</h2>}
            <div className="space-y-1">
              <Button
                variant="ghost"
                className={`w-full justify-start px-3 ${isSidebarOpen ? "" : "justify-center"}`}
                asChild
              >
                <Link to="/dashboard">
                  <Home className={`h-4 w-4 ${isSidebarOpen ? "mr-2" : ""}`} />
                  {isSidebarOpen && <span>Home</span>}
                </Link>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start px-3 ${isSidebarOpen ? "" : "justify-center"}`}
                asChild
              >
                <Link to="/dashboard/disease">
                  <Upload className={`h-4 w-4 ${isSidebarOpen ? "mr-2" : ""}`} />
                  {isSidebarOpen && <span>Disease Detection</span>}
                </Link>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start px-3 ${isSidebarOpen ? "" : "justify-center"}`}
                asChild
              >
                <Link to="/dashboard/weather">
                  <Cloud className={`h-4 w-4 ${isSidebarOpen ? "mr-2" : ""}`} />
                  {isSidebarOpen && <span>Weather Insights</span>}
                </Link>
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start px-3 ${isSidebarOpen ? "" : "justify-center"}`}
                asChild
              >
                <Link to="/dashboard/assistant">
                  <MessageSquare className={`h-4 w-4 ${isSidebarOpen ? "mr-2" : ""}`} />
                  {isSidebarOpen && <span>AI Assistant</span>}
                </Link>
              </Button>
            </div>
          </div>
          {isSidebarOpen && (
            <div className="px-3 py-2">
              <h2 className="mb-2 text-xs font-semibold text-muted-foreground">Settings</h2>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3"
                  asChild
                >
                  <Link to="/settings">
                    <User className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3"
                  asChild
                >
                  <Link to="/settings/notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3"
                  asChild
                >
                  <Link to="/settings/preferences">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Preferences</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </nav>
        <div className="border-t p-4">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground">john@example.com</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
        isSidebarOpen ? "md:ml-64" : "md:ml-16"
      }`}>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <h1 className="font-semibold text-lg md:text-xl">Dashboard</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6 space-y-6">
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

            <Tabs defaultValue="disease" className="space-y-4">
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
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
