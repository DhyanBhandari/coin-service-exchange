import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Coins, 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  UserPlus, 
  Home,
  Wallet,
  Gift,
  HelpCircle,
  Bell,
  X
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const { currentUser, userData, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an issue logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDashboardNavigation = () => {
    if (userData?.role === 'admin') {
      navigate('/dashboard/admin');
    } else if (userData?.role === 'org') {
      navigate('/dashboard/org');
    } else {
      navigate('/dashboard/user');
    }
    setIsOpen(false);
  };

  const handleLogoClick = () => {
    navigate('/');
    setIsOpen(false);
  };

  const MenuButton = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Menu className="h-5 w-5" />
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">3</span>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Account Menu</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* User Info */}
          {userData && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{userData.name}</p>
                  <p className="text-sm text-gray-600">{userData.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    {userData.role}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Wallet Balance</span>
                <div className="flex items-center space-x-1">
                  <Coins className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-600">{userData.walletBalance || 0}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Navigation Items */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogoClick}
            >
              <Home className="h-4 w-4 mr-3" />
              Home
            </Button>

            {currentUser && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleDashboardNavigation}
              >
                <User className="h-4 w-4 mr-3" />
                Dashboard
              </Button>
            )}

            {userData?.role === 'user' && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate('/services');
                    setIsOpen(false);
                  }}
                >
                  <Coins className="h-4 w-4 mr-3" />
                  Browse Services
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate('/wallet/add');
                    setIsOpen(false);
                  }}
                >
                  <Wallet className="h-4 w-4 mr-3" />
                  Add Coins
                </Button>
              </>
            )}

            {userData?.role === 'org' && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate('/org/services');
                    setIsOpen(false);
                  }}
                >
                  <Coins className="h-4 w-4 mr-3" />
                  My Services
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate('/org/convert');
                    setIsOpen(false);
                  }}
                >
                  <Wallet className="h-4 w-4 mr-3" />
                  Convert Coins
                </Button>
              </>
            )}

            {currentUser && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/transactions');
                  setIsOpen(false);
                }}
              >
                <Bell className="h-4 w-4 mr-3" />
                Transactions
              </Button>
            )}
          </div>

          <Separator />

          {/* Additional Options */}
          {currentUser && (
            <>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-3" />
                  Invite Friends
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  <Gift className="h-4 w-4 mr-3" />
                  Rewards
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  <HelpCircle className="h-4 w-4 mr-3" />
                  Help & Support
                </Button>
              </div>

              <Separator />

              {/* Logout */}
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </>
          )}

          {/* Login/Signup for non-authenticated users */}
          {!currentUser && (
            <div className="space-y-2">
              <Link to="/login">
                <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="w-full" onClick={() => setIsOpen(false)}>
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          >
            <Coins className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ErthaExchange</span>
          </div>

          {/* Desktop Navigation - Only show basic links when not logged in */}
          <div className="hidden md:flex items-center space-x-8">
            {!currentUser && (
              <>
                <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Home
                </Link>
                <Link to="/#services" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Services
                </Link>
                <Link to="/#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Features
                </Link>
              </>
            )}
          </div>

          {/* Right Side - Always show menu button */}
          <div className="flex items-center space-x-4">
            {currentUser && userData && (
              <div className="hidden md:flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">{userData.walletBalance || 0} coins</span>
              </div>
            )}
            
            {/* Global Menu Button - Always visible */}
            <MenuButton />

            {/* Desktop-only login/signup buttons for non-authenticated users */}
            {!currentUser && (
              <div className="hidden md:flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;