
import { Link, useLocation } from "react-router-dom";
import { 
  Sidebar, 
  SidebarHeader,
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { 
  Home, 
  Cloud, 
  Upload, 
  MessageSquare, 
  Settings, 
  Bell, 
  Info, 
  LogOut,
  User,
  Menu,
  X 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const MainSidebar = () => {
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Successfully logged out",
        description: "You've been signed out of your account.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-green-600">MaizeSense</span>
          </Link>
        </div>
        
        {user && userProfile && (
          <div className="px-4 pb-2">
            <div className="flex items-center space-x-3 rounded-lg bg-muted/50 p-3">
              <Avatar>
                <AvatarImage src={userProfile.avatar_url || `https://avatar.vercel.sh/${userProfile.full_name || user.email}.png`} />
                <AvatarFallback>
                  {userProfile.full_name ? userProfile.full_name[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userProfile.full_name || "Farmer"}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Home">
                  <Link to="/dashboard">
                    <Home className="mr-2" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/disease")} tooltip="Disease Detection">
                  <Link to="/dashboard/disease">
                    <Upload className="mr-2" />
                    <span>Disease Detection</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/weather")} tooltip="Weather Insights">
                  <Link to="/dashboard/weather">
                    <Cloud className="mr-2" />
                    <span>Weather Insights</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/assistant")} tooltip="AI Assistant">
                  <Link to="/dashboard/assistant">
                    <MessageSquare className="mr-2" />
                    <span>AI Assistant</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Information</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/knowledge")} tooltip="Knowledge Base">
                  <Link to="/knowledge">
                    <Info className="mr-2" />
                    <span>Knowledge Base</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/alerts")} tooltip="Alerts">
                  <Link to="/alerts">
                    <Bell className="mr-2" />
                    <span>Alerts & Notifications</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="w-full px-4 py-2 space-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip="Settings">
              <Link to="/settings">
                <Settings className="mr-2" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {!user && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Sign In">
                <Link to="/login">
                  <User className="mr-2" />
                  <span>Sign In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          
          {user && (
            <Button 
              variant="ghost" 
              className="w-full mt-2 text-red-500 hover:text-red-600 hover:bg-red-100" 
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
