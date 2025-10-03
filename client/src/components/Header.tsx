import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Camera, Image, User, LogOut, Settings, UserCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@assets/7edd6b98-247a-49a0-b423-a67e010d87ec (1)_1759107927861.png";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="relative">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-chart-1 to-chart-2 opacity-90" />
      
      <div className="relative z-10 flex items-center justify-between p-4 text-white">
        {/* Logo - acts as Home button */}
        <div className="flex items-center">
          <Link href="/">
            <img 
              src={logoImage} 
              alt="prettyclick home" 
              className="h-8 w-auto hover:opacity-80 transition-opacity cursor-pointer"
              data-testid="logo-header"
              width="100"
              height="32"
              decoding="async"
            />
          </Link>
        </div>
        
        {/* Navigation - CLICK button centered */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/about">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              data-testid="button-about"
            >
              About
            </Button>
          </Link>
          
          <Link href="/tutorial">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              data-testid="button-tutorial"
            >
              Tutorial
            </Button>
          </Link>
          
          {isAuthenticated && (
            <Link href="/camera">
              <Button 
                size="default"
                className="bg-primary text-white font-semibold px-8 py-2 rounded-full"
                data-testid="button-click"
              >
                CLICK!
              </Button>
            </Link>
          )}
          
          <Link href="/policy">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              data-testid="button-policy"
            >
              Policy
            </Button>
          </Link>
          
          <Link href="/gallery">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              data-testid="button-gallery"
            >
              <Image className="w-4 h-4 mr-2" />
              Gallery
            </Button>
          </Link>
        </nav>
        
        {/* Auth Section */}
        <div className="flex items-center space-x-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 text-white hover:bg-white/20 hover-elevate"
                  data-testid="button-user-menu"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profilePicture || undefined} />
                    <AvatarFallback className="text-sm bg-white/20 text-white">
                      {user.displayName ? user.displayName[0].toUpperCase() : user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block">{user.displayName || user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium" data-testid="text-user-display-name">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="text-user-username">
                    @{user.username}
                  </p>
                </div>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer" data-testid="link-profile">
                    <UserCircle className="w-4 h-4 mr-2" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/profile/settings" className="cursor-pointer" data-testid="link-settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button 
                variant="outline" 
                size="sm"
                className="text-white border-white/30 hover:bg-white/20 hover-elevate"
                data-testid="button-signup"
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}