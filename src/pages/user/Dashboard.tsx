// src/pages/user/Dashboard.tsx - Updated with real user data
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, ShoppingBag, ArrowRight, Wallet, Home, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/contexts/UserDataContext";

const UserDashboard = () => {
  const { userData, logout } = useAuth();
  const { userStats } = useUserData();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!userData) {
      navigate('/login');
      return;
    }

    if (userData.role !== 'user') {
      toast({
        title: "Access Denied",
        description: "This page is for users only.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

  }, [navigate, toast, userData, userStats]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <Coins className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">ErthaExchange</span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Dashboard</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>
              <Link to="/services" className="text-gray-700 hover:text-blue-600 transition-colors">Services</Link>
              
              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{userData.name}</p>
                  <p className="text-xs text-gray-500">{userData.email}</p>
                </div>
                <Button variant="ghost" onClick={handleLogout} size="sm">
                  Logout
                </Button>
              </div>
            </nav>

            <div className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {userData.name}!</h1>
              <p className="text-gray-600">Manage your coins and explore amazing services</p>
            </div>
            
            <div className="hidden md:flex items-center space-x-3">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/services">
                <Button size="sm">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Card */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
              
              <CardHeader className="relative">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white mb-2 text-xl">Your Wallet</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-6 w-6" />
                      <span className="text-4xl font-bold">{userData.walletBalance || 0}</span>
                      <span className="text-xl opacity-90">ErthaCoins</span>
                    </div>
                    <p className="text-blue-100 text-sm mt-2">Available for spending</p>
                  </div>
                  <Link to="/wallet/add">
                    <Button size="sm" variant="secondary" className="text-blue-600 hover:text-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Coins
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-1 gap-4">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <ShoppingBag className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Browse Services</CardTitle>
                        <CardDescription>Discover amazing services</CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to="/services">
                    <Button className="w-full group-hover:bg-blue-700 transition-colors">
                      Explore Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>

            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Spent</span>
                  <Badge variant="secondary" className="font-semibold">{userStats.totalSpent} coins</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Services Used</span>
                  <Badge variant="secondary" className="font-semibold">{userStats.servicesUsed}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Since</span>
                  <Badge variant="secondary" className="font-semibold">{userStats.memberSince}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <Badge className={userStats.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {userStats.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Active Services */}
            {userStats.activeBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Services</CardTitle>
                  <CardDescription>Your current bookings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userStats.activeBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{booking.serviceName}</h4>
                        <Badge className="text-xs bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{booking.organization}</p>
                      <p className="text-xs text-gray-500">
                        Booked: {formatDate(booking.bookedAt)}
                      </p>
                      {booking.expiresAt && (
                        <p className="text-xs text-orange-600">
                          Expires: {formatDate(booking.expiresAt)}
                        </p>
                      )}
                    </div>
                  ))}
                  {userStats.activeBookings.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{userStats.activeBookings.length - 3} more services
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Top-up */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Top-up</CardTitle>
                <CardDescription>Add coins instantly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs">₹100</Button>
                  <Button variant="outline" size="sm" className="text-xs">₹500</Button>
                  <Button variant="outline" size="sm" className="text-xs">₹1000</Button>
                  <Button variant="outline" size="sm" className="text-xs">₹2000</Button>
                </div>
                <Link to="/wallet/add">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Coins
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Navigation Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/">
                  <Button variant="ghost" className="w-full justify-start text-blue-700 hover:bg-blue-100">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="ghost" className="w-full justify-start text-blue-700 hover:bg-blue-100">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Services
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;