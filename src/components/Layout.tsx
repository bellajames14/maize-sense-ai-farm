
import { ReactNode } from "react";
import { 
  SidebarProvider,
  SidebarTrigger,
  SidebarInset 
} from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/Sidebar";
import { usePreferences } from "@/hooks/usePreferences";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { theme } = usePreferences();
  
  return (
    <SidebarProvider>
      <div className={`flex min-h-screen w-full ${theme}`}>
        <MainSidebar />
        <SidebarInset>
          <div className="flex items-center p-4 md:p-6 border-b">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold ml-4">MaizeSense - Smart Farming Assistant</h1>
          </div>
          <div className="p-4 md:p-6 flex-1">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
