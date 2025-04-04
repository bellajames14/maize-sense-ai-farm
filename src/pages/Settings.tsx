
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuthContext";
import { usePreferences } from "@/hooks/usePreferences";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const { tab = "account" } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { translate } = usePreferences();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || "");
      setPhoneNumber(userProfile.phone_number || "");
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile?.notification_preferences) {
      const prefs = userProfile.notification_preferences;
      setEmailNotifications(!!prefs.email);
      setPushNotifications(!!prefs.push);
      setSmsNotifications(!!prefs.sms);
    }
  }, [userProfile]);

  const updateProfile = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: translate("profileUpdated"),
        description: translate("profileInformationUpdated"),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: translate("error"),
        description: translate("failedToUpdateProfile"),
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateNotificationPreferences = async () => {
    if (!userProfile) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: {
            email: emailNotifications,
            push: pushNotifications,
            sms: smsNotifications
          }
        })
        .eq('id', user.id);
    
      if (error) throw error;
    
      toast({
        title: translate("preferencesUpdated"),
        description: translate("notificationPreferencesUpdated"),
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: translate("error"),
        description: translate("failedToUpdatePreferences"),
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTabChange = (value: string) => {
    navigate(`/settings/${value}`);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <Tabs defaultValue={tab} className="space-y-4" onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="account">{translate("account")}</TabsTrigger>
            <TabsTrigger value="notifications">{translate("notifications")}</TabsTrigger>
            <TabsTrigger value="preferences">{translate("preferences")}</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{translate("profile")}</CardTitle>
                <CardDescription>{translate("manageAccount")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={userProfile?.avatar_url || `https://avatar.vercel.sh/${fullName}.png`} />
                      <AvatarFallback>{fullName ? fullName[0] : "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{fullName || "No Name"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <div>
                    <Button>{translate("changePhoto")}</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{translate("fullName")}</Label>
                    <Input
                      id="name"
                      placeholder={translate("fullName")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{translate("email")}</Label>
                    <Input id="email" placeholder={translate("email")} value={user?.email || ""} disabled />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{translate("phoneNumber")}</Label>
                    <Input
                      id="phone"
                      placeholder={translate("phoneNumber")}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={updateProfile} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {translate("savingChanges")}
                    </>
                  ) : (
                    translate("saveChanges")
                  )}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{translate("password")}</CardTitle>
                <CardDescription>{translate("changePassword")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{translate("currentPassword")}</Label>
                  <Input id="currentPassword" type="password" placeholder={translate("currentPassword")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{translate("newPassword")}</Label>
                  <Input id="newPassword" type="password" placeholder={translate("newPassword")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{translate("confirmPassword")}</Label>
                  <Input id="confirmPassword" type="password" placeholder={translate("confirmPassword")} />
                </div>
                <Button disabled>{translate("changePassword")}</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{translate("notificationPreferences")}</CardTitle>
                <CardDescription>{translate("chooseNotifications")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{translate("emailNotifications")}</p>
                    <p className="text-sm text-muted-foreground">{translate("receiveEmailUpdates")}</p>
                  </div>
                  <Switch id="email" checked={emailNotifications} onCheckedChange={(checked) => setEmailNotifications(checked)} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{translate("pushNotifications")}</p>
                    <p className="text-sm text-muted-foreground">{translate("receiveRealTimeAlerts")}</p>
                  </div>
                  <Switch id="push" checked={pushNotifications} onCheckedChange={(checked) => setPushNotifications(checked)} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{translate("smsNotifications")}</p>
                    <p className="text-sm text-muted-foreground">{translate("receiveTextMessages")}</p>
                  </div>
                  <Switch id="sms" checked={smsNotifications} onCheckedChange={(checked) => setSmsNotifications(checked)} />
                </div>
                <Button onClick={updateNotificationPreferences} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {translate("savingPreferences")}
                    </>
                  ) : (
                    translate("savePreferences")
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{translate("appPreferences")}</CardTitle>
                <CardDescription>{translate("customizeExperience")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language">{translate("language")}</Label>
                  {/* Add language selection component here */}
                </div>
                <div>
                  <Label htmlFor="theme">{translate("theme")}</Label>
                  {/* Add theme selection component here */}
                </div>
                <div>
                  <Label htmlFor="location">{translate("farmLocation")}</Label>
                  {/* Add location selection component here */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
