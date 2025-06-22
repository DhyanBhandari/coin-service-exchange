
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, TrendingUp, Package, ArrowUpRight, Clock } from "lucide-react";

const OrgDashboard = () => {
  const [orgData, setOrgData] = useState({
    coinsEarned: 0,
    servicesActive: 0,
    pendingConversions: 0,
    totalBookings: 0
  });

  const [recentConversions, setRecentConversions] = useState([
    { id: 1, amount: 500, status: 'pending', date: '2024-01-15' },
    { id: 2, amount: 1200, status: 'approved', date: '2024-01-12' },
    { id: 3, amount: 800, status: 'rejected', date: '2024-01-10' }
  ]);

  useEffect(() => {
    // Simulate fetching org data
    const orgInfo = JSON.parse(localStorage.getItem('user') || '{}');
    setOrgData({
      coinsEarned: 2500,
      servicesActive: 5,
      pendingConversions: 2,
      totalBookings: 23
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organization Dashboard</h1>
              <p className="text-gray-600">Manage your services and earnings</p>
            </div>
            <div className="flex space-x-3">
              <Link to="/org/services">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </Link>
              <Link to="/org/convert">
                <Button variant="outline">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Convert Coins
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coins Earned</CardTitle>
              <Coins className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{orgData.coinsEarned}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orgData.servicesActive}</div>
              <p className="text-xs text-muted-foreground">2 pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orgData.totalBookings}</div>
              <p className="text-xs text-muted-foreground">+8 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Conversions</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orgData.pendingConversions}</div>
              <p className="text-xs text-muted-foreground">₹1,300 pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Conversion Requests</CardTitle>
                <CardDescription>Track your coin-to-fiat conversion requests</CardDescription>
              </div>
              <Link to="/org/convert">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentConversions.map((conversion) => (
                <div key={conversion.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Coins className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{conversion.amount} Coins</p>
                      <p className="text-sm text-gray-600">₹{conversion.amount} INR</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="text-sm text-gray-600">{conversion.date}</p>
                    <Badge className={getStatusColor(conversion.status)}>
                      {conversion.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrgDashboard;
