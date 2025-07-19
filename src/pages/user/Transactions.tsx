// src/pages/user/Transactions.tsx - Fixed with proper error handling
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Receipt, TrendingUp, TrendingDown, Calendar, Filter, CheckCircle, Loader2, RefreshCw, Plus, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { useUserData, UserStats } from "@/contexts/UserDataContext";
import { api } from "@/lib/api";

interface Transaction {
  id: string;
  type: 'coin_purchase' | 'service_booking' | 'coin_conversion' | 'refund';
  subType?: string;
  amount: number;
  coinAmount?: number;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  paymentMethod?: string;
  paymentProvider?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  serviceId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

interface ServiceBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  organization: string;
  bookedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'cancelled';
}

const UserTransactions = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState<any>({});
  const { userData } = useAuth();
  const { userStats, getUserTransactions, refreshUserData } = useUserData();

  // Fetch transactions from backend with proper error handling
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching transactions...');
      
      const params = new URLSearchParams();
      params.append('limit', '100');
      
      if (selectedPeriod !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (selectedPeriod) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        params.append('startDate', startDate.toISOString());
        params.append('endDate', now.toISOString());
      }

      // Try to fetch from API first
      try {
        const [transactionsResponse, statsResponse] = await Promise.all([
          api.transactions.getAll(params),
          api.transactions.getStats()
        ]);

        console.log('API Response - Transactions:', transactionsResponse);
        console.log('API Response - Stats:', statsResponse);

        // Handle transactions response with proper error checking
        if (transactionsResponse.success && transactionsResponse.data) {
          const rawData = transactionsResponse.data;
          let transactionData: Transaction[] = [];
          
          if (Array.isArray(rawData)) {
            transactionData = rawData as Transaction[];
          } else if (rawData && typeof rawData === 'object' && 'items' in rawData) {
            // Handle paginated response
            transactionData = Array.isArray(rawData.items) ? rawData.items as Transaction[] : [];
          } else {
            console.warn('Invalid transactions response structure:', rawData);
            transactionData = [];
          }
          
          console.log('Processed transaction data:', transactionData);
          setTransactions(transactionData);
        } else {
          console.warn('API response not successful, falling back to context data');
          throw new Error('API response not successful');
        }
        
        // Handle stats response
        if (statsResponse.success && statsResponse.data) {
          setTransactionStats(statsResponse.data || {});
        }
      } catch (apiError) {
        console.warn('API call failed, using context data:', apiError);
        throw apiError;
      }

    } catch (error) {
      console.error('Error fetching transactions, using fallback:', error);
      
      // Always fallback to context data
      const contextTransactions = getUserTransactions('all');
      console.log('Context transactions:', contextTransactions);
      
      // Map the transactions to match the expected interface
      const mappedTransactions = Array.isArray(contextTransactions) ? contextTransactions.map(t => ({
        ...t,
        createdAt: t.date || new Date().toISOString(),
        updatedAt: t.date || new Date().toISOString(),
        // Ensure all required properties are present
        type: t.type as 'coin_purchase' | 'service_booking' | 'coin_conversion' | 'refund',
        status: t.status as 'completed' | 'pending' | 'failed' | 'cancelled',
        description: t.description || `${t.type} transaction`,
        amount: t.amount || 0
      })) : [];
      
      console.log('Mapped transactions:', mappedTransactions);
      setTransactions(mappedTransactions);

      // Also try to get stats from userStats
      const userStatsData = userStats || {} as UserStats;
      setTransactionStats({
        byType: {
          coin_purchase: userStatsData.totalAdded || 0,
          service_booking: userStatsData.totalSpent || 0
        },
        total: (userStatsData.totalAdded || 0) + (userStatsData.totalSpent || 0)
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTransactions(),
        refreshUserData()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load data on component mount and when period changes
  useEffect(() => {
    fetchTransactions();
  }, [selectedPeriod]);

  // Also refresh when userStats changes (e.g., after a new transaction)
  useEffect(() => {
    console.log('UserStats changed:', userStats);
    if (userStats.transactions && Array.isArray(userStats.transactions) && userStats.transactions.length > 0) {
      console.log('UserStats updated with transactions, refreshing display...');
      // If we have userStats but no API transactions, use the userStats data
      if (transactions.length === 0) {
        const mappedTransactions: Transaction[] = userStats.transactions.map(t => ({
          id: t.id || Date.now().toString(),
          type: t.type as 'coin_purchase' | 'service_booking' | 'coin_conversion' | 'refund',
          amount: t.amount || 0,
          coinAmount: t.coinAmount || t.amount || 0,
          description: t.description || `${t.type} transaction`,
          status: t.status as 'completed' | 'pending' | 'failed' | 'cancelled',
          createdAt: t.date || new Date().toISOString(),
          updatedAt: t.date || new Date().toISOString(),
          metadata: t.metadata || {}
        }));
        console.log('Mapped transactions from userStats:', mappedTransactions);
        setTransactions(mappedTransactions);
      }
    }
  }, [userStats]);

  // Calculate statistics from transactions
  const getTransactionStats = () => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const completedTransactions = safeTransactions.filter(t => t.status === 'completed');
    
    const totalSpent = completedTransactions
      .filter(t => t.type === 'service_booking' || t.type === 'coin_conversion')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const totalAdded = completedTransactions
      .filter(t => t.type === 'coin_purchase' || t.type === 'refund')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const netBalance = totalAdded - totalSpent;
    
    return {
      totalSpent: transactionStats.byType?.service_booking || totalSpent,
      totalAdded: transactionStats.byType?.coin_purchase || totalAdded,
      netBalance,
      totalTransactions: safeTransactions.length,
      completedTransactions: completedTransactions.length,
      pendingTransactions: safeTransactions.filter(t => t.status === 'pending').length
    };
  };

  const stats = getTransactionStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'coin_purchase':
      case 'refund':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'service_booking':
      case 'coin_conversion':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Receipt className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'coin_purchase': return 'Coins Added';
      case 'service_booking': return 'Service Booked';
      case 'coin_conversion': return 'Coins Converted';
      case 'refund': return 'Refund Received';
      default: return 'Transaction';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const filterTransactionsByType = (type: 'all' | 'spent' | 'added') => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    if (type === 'all') return safeTransactions;
    if (type === 'spent') return safeTransactions.filter(t => 
      t.type === 'service_booking' || t.type === 'coin_conversion'
    );
    if (type === 'added') return safeTransactions.filter(t => 
      t.type === 'coin_purchase' || t.type === 'refund'
    );
    return safeTransactions;
  };

  const TransactionCard = ({ transaction }: { transaction: Transaction }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-gray-100">
              {getTransactionIcon(transaction.type)}
            </div>
            <div>
              <h3 className="font-semibold">{getTransactionTypeLabel(transaction.type)}</h3>
              <p className="text-sm text-gray-600">{transaction.description}</p>
              {transaction.metadata?.serviceName && (
                <p className="text-xs text-blue-600">Service: {transaction.metadata.serviceName}</p>
              )}
              {transaction.paymentMethod && (
                <p className="text-xs text-gray-500">
                  Payment: {transaction.paymentMethod} 
                  {transaction.paymentProvider && ` via ${transaction.paymentProvider}`}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold text-lg ${
              transaction.type === 'coin_purchase' || transaction.type === 'refund' 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {transaction.type === 'coin_purchase' || transaction.type === 'refund' ? '+' : '-'}
              {transaction.coinAmount || transaction.amount} coins
            </p>
            {transaction.balanceBefore !== undefined && transaction.balanceAfter !== undefined && (
              <p className="text-xs text-gray-500">
                Balance: {transaction.balanceBefore} → {transaction.balanceAfter}
              </p>
            )}
            <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
            <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
              {transaction.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const BookingCard = ({ booking }: { booking: ServiceBooking }) => (
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

  // Safe access to userStats with fallbacks
  const safeActiveBookings = Array.isArray(userStats.activeBookings) ? userStats.activeBookings : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Debug component to show data state
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <Card className="mb-4 bg-gray-100">
        <CardHeader>
          <CardTitle className="text-sm">Debug Info (Dev Only)</CardTitle>
        </CardHeader>
        <CardContent className="text-xs">
          <p><strong>API Transactions:</strong> {safeTransactions.length} items</p>
          <p><strong>Context Transactions:</strong> {getUserTransactions('all').length} items</p>
          <p><strong>User Stats Total:</strong> {userStats.transactions?.length || 0} items</p>
          <p><strong>Active Bookings:</strong> {safeActiveBookings.length} items</p>
          <p><strong>User ID:</strong> {userData?.id || 'No user'}</p>
          <p><strong>Wallet Balance:</strong> {userData?.walletBalance || 0} coins</p>
          <details className="mt-2">
            <summary>Raw Transaction Data</summary>
            <pre className="text-xs bg-white p-2 mt-1 rounded overflow-auto max-h-32">
              {JSON.stringify(safeTransactions.slice(0, 3), null, 2)}
            </pre>
          </details>
          <details className="mt-2">
            <summary>User Stats Data</summary>
            <pre className="text-xs bg-white p-2 mt-1 rounded overflow-auto max-h-32">
              {JSON.stringify(userStats, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard/user" className="flex items-center text-gray-600 hover:text-blue-600">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="flex items-center space-x-2">
                <Receipt className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold">Transaction History</span>
              </div>
            </div>
            
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info */}
        <DebugInfo />

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading transactions...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-2xl font-bold text-red-600">{stats.totalSpent}</span>
                    <span className="text-gray-500 ml-1">coins</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {filterTransactionsByType('spent').length} transactions
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
                    <span className="text-2xl font-bold text-green-600">{stats.totalAdded}</span>
                    <span className="text-gray-500 ml-1">coins</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {filterTransactionsByType('added').length} transactions
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
                    <span className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {stats.netBalance}
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
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
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
                  {[...safeTransactions.map(t => ({...t, activityType: 'transaction'})), 
                    ...safeActiveBookings.map(b => ({...b, activityType: 'booking'}))]
                    .sort((a, b) => {
                      const dateA = 'createdAt' in a ? new Date(a.createdAt) : new Date(a.bookedAt);
                      const dateB = 'createdAt' in b ? new Date(b.createdAt) : new Date(b.bookedAt);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map((item, index) => (
                      item.activityType === 'booking' ? (
                        <BookingCard key={`booking-${index}`} booking={item as ServiceBooking} />
                      ) : (
                        <TransactionCard key={`transaction-${index}`} transaction={item as Transaction} />
                      )
                    ))}
                  
                  {safeTransactions.length === 0 && safeActiveBookings.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                        <p className="text-gray-500 mb-4">Start by browsing services or adding coins to your wallet</p>
                        <div className="flex justify-center space-x-4">
                          <Link to="/dashboard/user/services">
                            <Button variant="outline">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Browse Services
                            </Button>
                          </Link>
                          <Link to="/dashboard/user/wallet">
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Coins
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="spent">
                <div className="space-y-4">
                  {filterTransactionsByType('spent').map((transaction) => (
                    <TransactionCard key={transaction.id} transaction={transaction} />
                  ))}
                  
                  {filterTransactionsByType('spent').length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No spending history</h3>
                        <p className="text-gray-500 mb-4">No coins have been spent yet</p>
                        <Link to="/dashboard/user/services">
                          <Button>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Browse Services
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="added">
                <div className="space-y-4">
                  {filterTransactionsByType('added').map((transaction) => (
                    <TransactionCard key={transaction.id} transaction={transaction} />
                  ))}
                  
                  {filterTransactionsByType('added').length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No coins added yet</h3>
                        <p className="text-gray-500 mb-4">Add coins to your wallet to get started</p>
                        <Link to="/dashboard/user/wallet">
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Coins
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="services">
                <div className="space-y-4">
                  {safeActiveBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                  
                  {safeActiveBookings.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No active services</h3>
                        <p className="text-gray-500 mb-4">Browse and book services to see them here</p>
                        <Link to="/dashboard/user/services">
                          <Button>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Browse Services
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default UserTransactions;