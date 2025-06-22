
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, ShoppingBag, Receipt, ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([
    { id: 1, type: 'spent', service: 'Web Development', amount: 200, date: '2024-01-15' },
    { id: 2, type: 'added', service: 'Wallet Top-up', amount: 500, date: '2024-01-14' },
    { id: 3, type: 'spent', service: 'Digital Marketing', amount: 50, date: '2024-01-13' },
  ]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'user') {
      toast({
        title: "Access Denied",
        description: "This page is for users only.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setUser(parsedUser);
    setWalletBalance(parsedUser.walletBalance || 0);
  }, [navigate, toast]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Coins className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">ErthaExchange</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/dashboard/user" className="text-blue-600 font-medium">Dashboard</Link>
              <Link to="/services" className="text-gray-700 hover:text-blue-600">Services</Link>
              <Link to="/transactions" className="text-gray-700 hover:text-blue-600">Transactions</Link>
              <Button variant="ghost" onClick={handleLogout}>Logout</Button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h1>
          <p className="text-gray-600">Manage your coins and explore amazing services</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Card */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white mb-2">Your Wallet</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-5 w-5" />
                      <span className="text-3xl font-bold">{walletBalance}</span>
                      <span className="text-lg">ErthaCoins</span>
                    </div>
                  </div>
                  <Link to="/wallet/add">
                    <Button size="sm" variant="secondary" className="text-blue-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Coins
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ShoppingBag className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Browse Services</CardTitle>
                        <CardDescription>Discover amazing services</CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to="/services">
                    <Button className="w-full">Explore Now</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Receipt className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">My Transactions</CardTitle>
                        <CardDescription>Track your spending</CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to="/transactions">
                    <Button variant="outline" className="w-full">View History</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                <div className="mt-4">
                  <Link to="/transactions">
                    <Button variant="outline" className="w-full">
                      View All Transactions
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
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
                  <Badge variant="secondary">250 coins</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Services Used</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Since</span>
                  <Badge variant="secondary">Jan 2024</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Add Coins */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Top-up</CardTitle>
                <CardDescription>Add coins instantly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">₹100</Button>
                  <Button variant="outline" size="sm">₹500</Button>
                  <Button variant="outline" size="sm">₹1000</Button>
                  <Button variant="outline" size="sm">₹2000</Button>
                </div>
                <Link to="/wallet/add">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Coins
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
