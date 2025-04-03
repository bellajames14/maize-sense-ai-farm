
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";

export type SettingsTab = "account" | "notifications" | "preferences";

const Settings = () => {
  const { tab = "account" } = useParams<{ tab?: SettingsTab }>();
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [language, setLanguage] = useState("english");
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
            setLanguage(data.preferred_language || "english");
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
        title: "Profile updated",
        description: "Your account information has been updated successfully."
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
        title: "Notification preferences updated",
        description: "Your notification settings have been saved."
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
          preferred_language: language
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Preferences updated",
        description: "Your language preference has been saved."
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
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          {/* Account Settings */}
          <TabsContent value="account">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>
                    Manage your account information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`} alt={fullName} />
                      <AvatarFallback>{fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline">Change Photo</Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
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
                      <Label htmlFor="phoneNumber">Phone Number</Label>
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
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  
                  <Button variant="outline">Change Password</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive updates, alerts and recommendations via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.email}
                        onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-leaf-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-leaf-500 peer-focus:ring-opacity-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive real-time alerts on your device
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.push}
                        onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-leaf-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-leaf-500 peer-focus:ring-opacity-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">SMS Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive important alerts via text message
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.sms}
                        onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-leaf-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-leaf-500 peer-focus:ring-opacity-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                  className="bg-leaf-700 hover:bg-leaf-800"
                >
                  {isSaving ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* User Preferences */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>
                  Customize your app experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <select 
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 mt-1 bg-background border border-input rounded-md"
                    >
                      <option value="english">English</option>
                      <option value="yoruba">Yoruba</option>
                      <option value="igbo">Igbo</option>
                      <option value="hausa">Hausa</option>
                    </select>
                    <p className="text-sm text-muted-foreground mt-1">
                      This affects AI assistant responses and app content
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Farm Location</h3>
                    <Label htmlFor="defaultLocation">Default Weather Location</Label>
                    <Input 
                      id="defaultLocation" 
                      placeholder="e.g. Lagos, Nigeria" 
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Set your default farm location for weather reports
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="bg-leaf-700 hover:bg-leaf-800"
                >
                  {isSaving ? "Saving..." : "Save Preferences"}
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
