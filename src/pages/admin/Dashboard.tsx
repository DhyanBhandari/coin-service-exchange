
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Package, Coins, Clock, TrendingUp, AlertCircle } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganizations: 0,
    totalCoins: 0,
    pendingConversions: 0,
    activeServices: 0,
    monthlyGrowth: 0
  });

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'user_signup', user: 'John Doe', time: '2 hours ago' },
    { id: 2, type: 'service_created', user: 'TechCorp', time: '4 hours ago' },
    { id: 3, type: 'conversion_request', user: 'DesignStudio', time: '6 hours ago' },
    { id: 4, type: 'service_booked', user: 'Alice Smith', time: '8 hours ago' }
  ]);

  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 1, type: 'conversion', org: 'TechCorp', amount: 1500, date: '2024-01-20' },
    { id: 2, type: 'service', org: 'DesignStudio', service: 'Brand Design', date: '2024-01-19' }
  ]);

  useEffect(() => {
    // Simulate fetching admin stats
    setStats({
      totalUsers: 1247,
      totalOrganizations: 89,
      totalCoins: 125000,
      pendingConversions: 5,
      activeServices: 342,
      monthlyGrowth: 12.5
    });
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return <Users className="h-4 w-4 text-blue-600" />;
      case 'service_created': return <Package className="h-4 w-4 text-green-600" />;
      case 'conversion_request': return <Coins className="h-4 w-4 text-yellow-600" />;
      case 'service_booked': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'user_signup': return `${activity.user} signed up as a user`;
      case 'service_created': return `${activity.user} created a new service`;
      case 'conversion_request': return `${activity.user} requested coin conversion`;
      case 'service_booked': return `${activity.user} booked a service`;
      default: return 'Unknown activity';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Monitor and manage the ErthaExchange platform</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">+{stats.monthlyGrowth}% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
              <p className="text-xs text-muted-foreground">+5 new this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coins in Circulation</CardTitle>
              <Coins className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCoins.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingConversions}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform activities and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{getActivityText(activity)}</p>
                      <p className="text-xs text-gray-600">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                Pending Approvals
              </CardTitle>
              <CardDescription>Items requiring your immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{item.org}</p>
                        <p className="text-sm text-gray-600">
                          {item.type === 'conversion' 
                            ? `Conversion request: ${item.amount} coins`
                            : `New service: ${item.service}`
                          }
                        </p>
                      </div>
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">Requested: {item.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Metrics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
            <CardDescription>Key metrics and platform health indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.activeServices}</div>
                <p className="text-sm text-gray-600">Active Services</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">98.5%</div>
                <p className="text-sm text-gray-600">Platform Uptime</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">4.8/5</div>
                <p className="text-sm text-gray-600">User Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
