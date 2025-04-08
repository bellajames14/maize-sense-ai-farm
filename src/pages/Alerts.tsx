
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Cloud, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Alert {
  id: string;
  title: string;
  message: string;
  type: "weather" | "disease" | "info";
  date: string;
  read: boolean;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [diseaseAlerts, setDiseaseAlerts] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch alerts from the database or generate sample ones for now
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        if (user) {
          // In a real app, we would fetch alerts from Supabase
          // For now, generate sample alerts
          const sampleAlerts: Alert[] = [
            {
              id: "1",
              title: "Heavy Rain Expected",
              message: "Heavy rainfall is expected in your area in the next 48 hours. Consider covering sensitive crops.",
              type: "weather",
              date: new Date(Date.now() - 86400000).toISOString(),
              read: false,
            },
            {
              id: "2",
              title: "Disease Risk Increasing",
              message: "High humidity levels increase risk of fungal diseases. Inspect your maize crop for early signs of infection.",
              type: "disease",
              date: new Date(Date.now() - 172800000).toISOString(),
              read: true,
            },
            {
              id: "3",
              title: "Optimal Planting Conditions",
              message: "The next 10 days show optimal conditions for maize planting in your region.",
              type: "info",
              date: new Date(Date.now() - 259200000).toISOString(),
              read: false,
            },
          ];
          setAlerts(sampleAlerts);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
        toast({
          title: "Error",
          description: "Failed to load alerts. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user, toast]);

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
    
    toast({
      title: "Alert updated",
      description: "Marked alert as read",
    });
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
    
    toast({
      title: "Alert deleted",
      description: "The alert has been removed",
    });
  };

  const saveNotificationPreferences = async () => {
    try {
      if (user) {
        // In a real app, update user preferences in Supabase
        await supabase.from('profiles').update({
          notification_preferences: {
            weather: weatherAlerts,
            disease: diseaseAlerts,
            email: true, // Keep existing email setting
            sms: false, // Keep existing sms setting
          }
        }).eq('id', user.id);
        
        toast({
          title: "Preferences saved",
          description: "Your notification preferences have been updated",
        });
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "weather":
        return <Cloud className="h-5 w-5 text-blue-500" />;
      case "disease":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto space-y-6">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-500" />
          <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  Stay updated with important information about your crops and local conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-4">Loading alerts...</p>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
                    <h3 className="text-lg font-medium">All caught up!</h3>
                    <p className="text-muted-foreground">You don't have any alerts at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className={`p-4 border rounded-lg ${alert.read ? 'bg-gray-50' : 'bg-white border-l-4 border-l-blue-500'}`}
                      >
                        <div className="flex justify-between">
                          <div className="flex items-center space-x-2">
                            {getAlertIcon(alert.type)}
                            <h3 className="font-medium">{alert.title}</h3>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{alert.message}</p>
                        <div className="flex space-x-2 mt-3">
                          {!alert.read && (
                            <Button variant="outline" size="sm" onClick={() => markAsRead(alert.id)}>
                              Mark as read
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600" 
                            onClick={() => deleteAlert(alert.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Choose which alerts you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="weather-alerts" 
                    checked={weatherAlerts}
                    onCheckedChange={setWeatherAlerts}
                  />
                  <Label htmlFor="weather-alerts">Weather alerts</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="disease-alerts" 
                    checked={diseaseAlerts}
                    onCheckedChange={setDiseaseAlerts}
                  />
                  <Label htmlFor="disease-alerts">Disease alerts</Label>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={saveNotificationPreferences}
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Alerts;
