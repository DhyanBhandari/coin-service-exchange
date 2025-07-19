// src/components/Navigation.tsx - Updated with real balance display
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Coins, 
  User, 
  LogOut, 
  Settings, 
  Home, 
  ShoppingBag, 
  Receipt, 
  Menu,
  X,
  Wallet,
  Plus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const { userData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'user': return 'User';
      case 'org': return 'Organization';
      case 'admin': return 'Admin';
      default: return 'User';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'org': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'user': return '/dashboard/user';
      case 'org': return '/dashboard/org';
      case 'admin': return '/dashboard/admin';
      default: return '/dashboard/user';
    }
  };

  const getNavItems = (role: string) => {
    switch (role) {
      case 'user':
        return [
          { path: '/services', label: 'Services', icon: ShoppingBag },
          { path: '/transactions', label: 'Transactions', icon: Receipt },
        ];
      case 'org':
        return [
          { path: '/org/services', label: 'My Services', icon: ShoppingBag },
          { path: '/org/convert', label: 'Convert Coins', icon: Coins },
        ];
      case 'admin':
        return [
          { path: '/admin/users', label: 'Users', icon: User },
          { path: '/admin/services', label: 'Services', icon: ShoppingBag },
          { path: '/admin/conversions', label: 'Conversions', icon: Coins },
        ];
      default:
        return [];
    }
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Coins className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ErthaExchange</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Public Navigation */}
            {!userData && (
              <>
                <Link 
                  to="/" 
                  className={`text-gray-700 hover:text-blue-600 transition-colors flex items-center ${
                    isActivePath('/') ? 'text-blue-600 font-medium' : ''
                  }`}
                >
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}

            {/* Authenticated Navigation */}
            {userData && (
              <>
                {/* Home Link */}
                <Link 
                  to="/" 
                  className={`text-gray-700 hover:text-blue-600 transition-colors flex items-center ${
                    isActivePath('/') ? 'text-blue-600 font-medium' : ''
                  }`}
                >
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Link>

                {/* Dashboard Link */}
                <Link 
                  to={getDashboardPath(userData.role)} 
                  className={`text-gray-700 hover:text-blue-600 transition-colors ${
                    isActivePath(getDashboardPath(userData.role)) ? 'text-blue-600 font-medium' : ''
                  }`}
                >
                  Dashboard
                </Link>

                {/* Role-specific Navigation */}
                {getNavItems(userData.role).map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={`text-gray-700 hover:text-blue-600 transition-colors flex items-center ${
                      isActivePath(item.path) ? 'text-blue-600 font-medium' : ''
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-1" />
                    {item.label}
                  </Link>
                ))}

                {/* Wallet Balance (for users) */}
                {userData.role === 'user' && (
                  <div className="flex items-center space-x-3">
                    {/* Wallet Balance Display */}
                    <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-blue-600" />
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium text-blue-900">
                            {userData.walletBalance || 0}
                          </span>
                          <span className="text-xs text-blue-600">coins</span>
                        </div>
                      </div>
                    </div>

                    {/* Add Coins Button */}
                    <Link to="/wallet/add">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </Link>
                  </div>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(userData.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">{userData.name}</p>
                        <p className="text-xs text-muted-foreground">{userData.email}</p>
                        <Badge className={`text-xs w-fit ${getRoleColor(userData.role)}`}>
                          {getRoleName(userData.role)}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {/* Wallet Info for Users */}
                    {userData.role === 'user' && (
                      <>
                        <div className="px-2 py-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Wallet Balance</span>
                            <div className="flex items-center space-x-1">
                              <Coins className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-600">{userData.walletBalance || 0}</span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem asChild>
                      <Link to={getDashboardPath(userData.role)} className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {userData.role === 'user' && (
                      <DropdownMenuItem asChild>
                        <Link to="/wallet/add" className="flex items-center">
                          <Wallet className="mr-2 h-4 w-4" />
                          <span>Add Coins</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {!userData ? (
                // Non-authenticated mobile menu
                <>
                  <Link 
                    to="/" 
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </div>
                  </Link>
                  <div className="px-3 py-2 space-y-2">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </div>
                </>
              ) : (
                // Authenticated mobile menu
                <>
                  {/* User Info */}
                  <div className="px-3 py-2 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(userData.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{userData.name}</p>
                        <p className="text-xs text-gray-600">{userData.email}</p>
                        <Badge className={`text-xs ${getRoleColor(userData.role)}`}>
                          {getRoleName(userData.role)}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Mobile Wallet Balance */}
                    {userData.role === 'user' && (
                      <div className="mt-3 bg-blue-50 p-2 rounded border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-900">Balance:</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Coins className="h-4 w-4 text-blue-600" />
                            <span className="font-bold text-blue-600">{userData.walletBalance || 0}</span>
                          </div>
                        </div>
                        <Link to="/wallet/add" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Coins
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <Link 
                    to="/" 
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </div>
                  </Link>

                  <Link 
                    to={getDashboardPath(userData.role)} 
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </div>
                  </Link>

                  {getNavItems(userData.role).map((item) => (
                    <Link 
                      key={item.path}
                      to={item.path} 
                      className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </div>
                    </Link>
                  ))}

                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;