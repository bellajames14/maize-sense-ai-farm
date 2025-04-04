
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";

export type SettingsTab = "account" | "notifications" | "preferences";

const Settings = () => {
  const { tab = "account" } = useParams<{ tab?: SettingsTab }>();
  const { user, loading } = useAuth();
  const { translate, theme, setTheme, language, setLanguage } = usePreferences();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [defaultLocation, setDefaultLocation] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Load user profile data
      const loadUserProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setFullName(data.full_name || "");
            setPhoneNumber(data.phone_number || "");
            setEmail(user.email || "");
            
            // If we have notification preferences saved
            if (data.notification_preferences) {
              setNotifications(data.notification_preferences);
            }
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      };
      
      loadUserProfile();
    }
  }, [user]);

  const handleSaveAccount = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: translate("profile") + " " + translate("saveChanges").toLowerCase(),
        description: translate("profile") + " " + translate("saveChanges").toLowerCase() + "."
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: notifications
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: translate("notificationPreferences") + " " + translate("saveChanges").toLowerCase(),
        description: translate("notificationPreferences") + " " + translate("saveChanges").toLowerCase() + "."
      });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your notification preferences.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_language: language,
          theme: theme,
          // Add additional preferences as needed
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: translate("preferences") + " " + translate("saveChanges").toLowerCase(),
        description: translate("preferences") + " " + translate("saveChanges").toLowerCase() + "."
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your preferences.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTabChange = (value: string) => {
    navigate(`/settings/${value}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <h1 className="text-2xl font-bold mb-6">{translate("settings")}</h1>
        
        <Tabs defaultValue={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="account">{translate("account")}</TabsTrigger>
            <TabsTrigger value="notifications">{translate("notifications")}</TabsTrigger>
            <TabsTrigger value="preferences">{translate("preferences")}</TabsTrigger>
          </TabsList>
          
          {/* Account Settings */}
          <TabsContent value="account">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{translate("profile")}</CardTitle>
                  <CardDescription>
                    {translate("manageAccount")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`} alt={fullName} />
                      <AvatarFallback>{fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline">{translate("changePhoto")}</Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">{translate("fullName")}</Label>
                      <Input 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="email">{translate("email")}</Label>
                      <Input 
                        id="email" 
                        value={email} 
                        readOnly 
                        disabled 
                      />
                      <p className="text-sm text-muted-foreground">
                        You cannot change your email address directly. Please contact support for assistance.
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="phoneNumber">{translate("phoneNumber")}</Label>
                      <Input 
                        id="phoneNumber" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +234 123 456 7890"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSaveAccount}
                      disabled={isSaving}
                      className="bg-leaf-700 hover:bg-leaf-800"
                    >
                      {isSaving ? "Saving..." : translate("saveChanges")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{translate("password")}</CardTitle>
                  <CardDescription>
                    {translate("changePassword")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">{translate("currentPassword")}</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">{translate("newPassword")}</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">{translate("confirmPassword")}</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  
                  <Button variant="outline">{translate("changePassword")}</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{translate("notificationPreferences")}</CardTitle>
                <CardDescription>
                  {translate("chooseNotifications")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{translate("emailNotifications")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {translate("receiveEmailUpdates")}
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{translate("pushNotifications")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {translate("receiveRealTimeAlerts")}
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{translate("smsNotifications")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {translate("receiveTextMessages")}
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.sms}
                      onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                  className="bg-leaf-700 hover:bg-leaf-800"
                >
                  {isSaving ? "Saving..." : translate("savePreferences")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* User Preferences */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>{translate("appPreferences")}</CardTitle>
                <CardDescription>
                  {translate("customizeExperience")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language">{translate("language")}</Label>
                    <div className="flex items-center mt-2 space-x-2">
                      <Button 
                        variant={language === "english" ? "default" : "outline"}
                        onClick={() => setLanguage("english")}
                      >
                        English
                      </Button>
                      <Button 
                        variant={language === "yoruba" ? "default" : "outline"}
                        onClick={() => setLanguage("yoruba")}
                      >
                        Yoruba
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {translate("affectsAI")}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="theme">{translate("theme")}</Label>
                    <div className="flex items-center mt-2 space-x-2">
                      <Button 
                        variant={theme === "light" ? "default" : "outline"} 
                        onClick={() => setTheme("light")}
                        className="flex items-center gap-2"
                      >
                        <Sun className="h-4 w-4" />
                        {translate("light")}
                      </Button>
                      <Button 
                        variant={theme === "dark" ? "default" : "outline"} 
                        onClick={() => setTheme("dark")}
                        className="flex items-center gap-2"
                      >
                        <Moon className="h-4 w-4" />
                        {translate("dark")}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">{translate("farmLocation")}</h3>
                    <Label htmlFor="defaultLocation">{translate("defaultLocation")}</Label>
                    <Input 
                      id="defaultLocation"
                      value={defaultLocation}
                      onChange={(e) => setDefaultLocation(e.target.value)}
                      placeholder="e.g. Lagos, Nigeria" 
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {translate("setDefaultLocation")}
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="bg-leaf-700 hover:bg-leaf-800"
                >
                  {isSaving ? "Saving..." : translate("savePreferences")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
