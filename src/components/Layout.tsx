
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Settings, LogOut, Menu, Bell, X, MessageSquare, Cloud, Upload, User } from "lucide-react";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed inset-y-0 z-20 flex flex-col bg-card border-r shadow-sm transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-16"
        } hidden md:flex`}
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
            className="ml-auto h-8 w-8"
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
                  <Link to="/settings/account">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {user?.user_metadata?.full_name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header and Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="ml-2 text-lg font-semibold">MaizeSense AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings/notifications">
                <Bell className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings/account">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg">
            <nav className="py-4">
              <div className="px-4 space-y-1">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/dashboard" onClick={toggleMobileMenu}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/dashboard/disease" onClick={toggleMobileMenu}>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Disease Detection</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/dashboard/weather" onClick={toggleMobileMenu}>
                    <Cloud className="mr-2 h-4 w-4" />
                    <span>Weather Insights</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/dashboard/assistant" onClick={toggleMobileMenu}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>AI Assistant</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/settings/account" onClick={toggleMobileMenu}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/settings/notifications" onClick={toggleMobileMenu}>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/settings/preferences" onClick={toggleMobileMenu}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Preferences</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => {
                  handleSignOut();
                  toggleMobileMenu();
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        isSidebarOpen ? "md:ml-64" : "md:ml-16"
      } ${isMobileMenuOpen ? "mt-[calc(4rem+1px)]" : "mt-16 md:mt-0"}`}>
        {children}
      </main>
    </div>
  );
};
