
import { useAuth } from "@/hooks/useAuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { usePreferences } from "@/hooks/usePreferences";
import { useState } from "react";
import { ThemeSelector } from "./ThemeSelector";
import { LanguageSelector } from "./LanguageSelector";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { translate } = usePreferences();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navigationLinks = [
    { path: "/dashboard", label: translate("home") },
    { path: "/dashboard/disease", label: translate("diseaseDetection") },
    { path: "/dashboard/weather", label: translate("weatherInsights") },
    { path: "/dashboard/ai", label: translate("aiAssistant") },
    { path: "/knowledge", label: translate("knowledgeBase") },
    { path: "/alerts", label: translate("alerts") },
    { path: "/settings", label: translate("settings") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">MaizeMate</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {user && navigationLinks.slice(0, 4).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-foreground"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <ThemeSelector />
              <LanguageSelector />
            </div>
            {user ? (
              <>
                <div className="hidden md:block">
                  <Button variant="ghost" onClick={handleSignOut}>
                    {translate("signOut")}
                  </Button>
                </div>
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xl">MaizeMate</span>
                        <div className="flex items-center gap-2">
                          <ThemeSelector />
                          <LanguageSelector />
                        </div>
                      </div>
                      <div className="flex flex-col space-y-3">
                        {navigationLinks.map((link) => (
                          <Link
                            key={link.path}
                            to={link.path}
                            className={`text-sm font-medium transition-colors p-2 rounded-md ${
                              isActive(link.path)
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground/60 hover:text-foreground hover:bg-accent/50"
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ))}
                        <Button 
                          variant="ghost" 
                          className="justify-start pl-2" 
                          onClick={() => {
                            handleSignOut();
                            setIsMenuOpen(false);
                          }}
                        >
                          {translate("signOut")}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost">{translate("Login")}</Button>
                </Link>
                <Link to="/signup">
                  <Button>{translate("Sign up")}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2023-2025 MaizeMate. {translate("All rights reserved")}.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:underline">
              {translate("Privacy Policy")}
            </Link>
            <Link to="/terms" className="hover:underline">
              {translate("Terms of Service")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
