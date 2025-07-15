// src/pages/user/Dashboard.tsx - Updated with home navigation
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, ShoppingBag, Receipt, ArrowRight, Wallet, TrendingUp, Home, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const UserDashboard = () => {
  const { userData, logout } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([
    { id: 1, type: 'spent', service: 'Web Development', amount: 200, date: '2024-01-15' },
    { id: 2, type: 'added', service: 'Wallet Top-up', amount: 500, date: '2024-01-14' },
    { id: 3, type: 'spent', service: 'Digital Marketing', amount: 50, date: '2024-01-13' },
  ]);
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

    setWalletBalance(userData.walletBalance || 0);
  }, [navigate, toast, userData]);

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

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Logo that links to home */}
              <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <Coins className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">ErthaExchange</span>
              </Link>
              
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Dashboard</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>
              <Link to="/services" className="text-gray-700 hover:text-blue-600 transition-colors">Services</Link>
              <Link to="/transactions" className="text-gray-700 hover:text-blue-600 transition-colors">Transactions</Link>
              
              {/* User Menu */}
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

            {/* Mobile Menu Button */}
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
            
            {/* Quick Actions */}
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
                      <span className="text-4xl font-bold">{walletBalance}</span>
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
            <div className="grid md:grid-cols-2 gap-4">
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

              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Receipt className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">My Transactions</CardTitle>
                        <CardDescription>Track your spending</CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to="/transactions">
                    <Button variant="outline" className="w-full group-hover:bg-gray-50 transition-colors">
                      View History
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest transactions</CardDescription>
                  </div>
                  <Link to="/transactions">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'spent' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {transaction.type === 'spent' ? (
                            <ArrowRight className="h-4 w-4 text-red-600 rotate-45" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.service}</p>
                          <p className="text-sm text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'spent' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'spent' ? '-' : '+'}{transaction.amount} coins
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                  <Badge variant="secondary" className="font-semibold">250 coins</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Services Used</span>
                  <Badge variant="secondary" className="font-semibold">12</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Since</span>
                  <Badge variant="secondary" className="font-semibold">Jan 2024</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>

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
                <Link to="/transactions">
                  <Button variant="ghost" className="w-full justify-start text-blue-700 hover:bg-blue-100">
                    <Receipt className="h-4 w-4 mr-2" />
                    View Transactions
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