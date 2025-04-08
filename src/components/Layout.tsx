
import { ReactNode } from "react";
import { 
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
  SidebarContent,
  SidebarFooter
} from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/Sidebar";
import { usePreferences } from "@/hooks/usePreferences";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { theme } = usePreferences();
  const { user, userProfile } = useAuth();
  
  // Get user's initials for avatar fallback
  const getUserInitials = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };
  
  return (
    <SidebarProvider>
      <div className={`flex min-h-screen w-full ${theme}`}>
        <MainSidebar />
        <SidebarRail />
        <SidebarInset>
          <div className="flex items-center justify-between p-4 md:p-6 border-b">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold ml-4">MaizeSense - Smart Farming Assistant</h1>
            </div>
            
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium hidden md:block">
                  {userProfile?.full_name || user.email}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url || ''} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
          <div className="p-4 md:p-6 flex-1">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
