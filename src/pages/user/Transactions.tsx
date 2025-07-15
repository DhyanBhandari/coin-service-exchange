// src/pages/user/Transactions.tsx - Updated with real transaction data
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Receipt, TrendingUp, TrendingDown, Calendar, Filter, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/contexts/UserDataContext";

const UserTransactions = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const { userData } = useAuth();
  const { userStats, getUserTransactions } = useUserData();

  const allTransactions = getUserTransactions('all');
  const spentTransactions = getUserTransactions('spent');
  const earnedTransactions = getUserTransactions('added');

  const totalSpent = userStats.totalSpent;
  const totalAdded = userStats.totalAdded;
  const netBalance = userStats.netBalance;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const TransactionCard = ({ transaction }: { transaction: any }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full ${
              transaction.type === 'spent' ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {transaction.type === 'spent' ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <TrendingUp className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{transaction.service || 'Wallet Top-up'}</h3>
              <p className="text-sm text-gray-600">{transaction.organization || 'ErthaExchange'}</p>
              <p className="text-xs text-gray-500">{transaction.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold text-lg ${
              transaction.type === 'spent' ? 'text-red-600' : 'text-green-600'
            }`}>
              {transaction.type === 'spent' ? '-' : '+'}{transaction.amount} coins
            </p>
            <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
            <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
              {transaction.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-blue-100">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{booking.serviceName}</h3>
              <p className="text-sm text-gray-600">{booking.organization}</p>
              <p className="text-xs text-gray-500">Service booked and active</p>
              {booking.expiresAt && (
                <p className="text-xs text-orange-600">
                  Expires: {formatDate(booking.expiresAt)}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-blue-600">
              {booking.price} coins
            </p>
            <p className="text-sm text-gray-500">{formatDate(booking.bookedAt)}</p>
            <Badge className={`text-xs ${
              booking.status === 'active' ? 'bg-green-100 text-green-800' : 
              booking.status === 'expired' ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {booking.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/dashboard/user" className="flex items-center text-gray-600 hover:text-blue-600 mr-6">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center space-x-2">
              <Receipt className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">Transaction History</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-2xl font-bold text-red-600">{totalSpent}</span>
                <span className="text-gray-500 ml-1">coins</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {spentTransactions.length} transactions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Added</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-green-600">{totalAdded}</span>
                <span className="text-gray-500 ml-1">coins</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {earnedTransactions.length} transactions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Net Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Receipt className="h-5 w-5 text-blue-600 mr-2" />
                <span className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {netBalance}
                </span>
                <span className="text-gray-500 ml-1">coins</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Current wallet: {userData?.walletBalance || 0} coins
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filter Transactions</h3>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Activity</TabsTrigger>
            <TabsTrigger value="spent">Spent</TabsTrigger>
            <TabsTrigger value="added">Added</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="space-y-4">
              {/* Combine transactions and bookings, sort by date */}
              {[...allTransactions.map(t => ({...t, activityType: 'transaction'})), 
                ...userStats.activeBookings.map(b => ({...b, activityType: 'booking'}))]
                .sort((a, b) => {
                  const dateA = 'date' in a ? new Date(a.date) : new Date(a.bookedAt);
                  const dateB = 'date' in b ? new Date(b.date) : new Date(b.bookedAt);
                  return dateB.getTime() - dateA.getTime();
                })
                .map((item, index) => (
                  item.activityType === 'booking' ? (
                    <BookingCard key={`booking-${index}`} booking={item} />
                  ) : (
                    <TransactionCard key={`transaction-${index}`} transaction={item} />
                  )
                ))}
              
              {allTransactions.length === 0 && userStats.activeBookings.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                    <p className="text-gray-500 mb-4">Start by browsing services or adding coins to your wallet</p>
                    <div className="flex space-x-2 justify-center">
                      <Link to="/services">
                        <Button>Browse Services</Button>
                      </Link>
                      <Link to="/wallet/add">
                        <Button variant="outline">Add Coins</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="spent">
            <div className="space-y-4">
              {spentTransactions.map((transaction, index) => (
                <TransactionCard key={`spent-${index}`} transaction={transaction} />
              ))}
              {spentTransactions.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No spending transactions</h3>
                    <p className="text-gray-500">You haven't spent any coins yet</p>
                    <Link to="/services">
                      <Button className="mt-4">Browse Services</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="added">
            <div className="space-y-4">
              {earnedTransactions.map((transaction, index) => (
                <TransactionCard key={`added-${index}`} transaction={transaction} />
              ))}
              {earnedTransactions.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No coin additions</h3>
                    <p className="text-gray-500">You haven't added any coins yet</p>
                    <Link to="/wallet/add">
                      <Button className="mt-4">Add Coins</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="space-y-4">
              {userStats.activeBookings.map((booking, index) => (
                <BookingCard key={`service-${index}`} booking={booking} />
              ))}
              {userStats.activeBookings.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active services</h3>
                    <p className="text-gray-500">You haven't booked any services yet</p>
                    <Link to="/services">
                      <Button className="mt-4">Browse Services</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary Card */}
        {(allTransactions.length > 0 || userStats.activeBookings.length > 0) && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{allTransactions.length}</p>
                  <p className="text-sm text-blue-700">Total Transactions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{userStats.activeBookings.length}</p>
                  <p className="text-sm text-green-700">Active Services</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{userStats.servicesUsed}</p>
                  <p className="text-sm text-purple-700">Services Used</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{userData?.walletBalance || 0}</p>
                  <p className="text-sm text-orange-700">Current Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserTransactions;