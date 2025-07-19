// src/pages/user/Transactions.tsx - Corrected
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Receipt, TrendingUp, TrendingDown, Filter, CheckCircle, Loader2, RefreshCw, Plus, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/contexts/UserDataContext";
import { api } from "@/lib/api";
import DebugPanel from "@/components/DebugPanel";

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

// ✅ FIX 2: This utility function is now more robust. It accepts transactions as a parameter and checks if it's an array.
const getTransactionStats = (transactions: Transaction[]) => {
  // Add a guard clause to prevent crashes if the input is not an array.
  if (!Array.isArray(transactions)) {
    return {
      totalSpent: 0,
      totalAdded: 0,
      netBalance: 0,
      totalTransactions: 0,
      completedTransactions: 0,
      pendingTransactions: 0,
    };
  }

  const completedTransactions = transactions.filter(t => t.status === 'completed');
  
  const totalSpent = completedTransactions
    .filter(t => t.type === 'service_booking' || t.type === 'coin_conversion')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalAdded = completedTransactions
    .filter(t => t.type === 'coin_purchase' || t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    totalSpent,
    totalAdded,
    netBalance: totalAdded - totalSpent,
    totalTransactions: transactions.length,
    completedTransactions: completedTransactions.length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length
  };
};

const UserTransactions = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { userData } = useAuth();
  const { userStats, getUserTransactions, refreshUserData } = useUserData();

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
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

      console.log('Fetching transactions with params:', params.toString());
      const transactionsResponse = await api.transactions.getAll(params);

      // ✅ FIX 1: Safely check if the API response is an array before setting state.
      if (transactionsResponse.success && transactionsResponse.data) {
        let apiTransactions = [];
        
        if (Array.isArray(transactionsResponse.data)) {
          apiTransactions = transactionsResponse.data;
        } else if (transactionsResponse.data && typeof transactionsResponse.data === 'object' && 'data' in transactionsResponse.data) {
          // Handle paginated response format: { data: [], pagination: {} }
          apiTransactions = Array.isArray(transactionsResponse.data.data) ? transactionsResponse.data.data : [];
        } else if (transactionsResponse.data && typeof transactionsResponse.data === 'object' && 'items' in transactionsResponse.data) {
          // Handle alternative paginated response format: { items: [], pagination: {} }
          apiTransactions = Array.isArray(transactionsResponse.data.items) ? transactionsResponse.data.items : [];
        }
        
        // Map database fields to frontend fields
        const mappedTransactions = apiTransactions.map((t: any) => ({
          ...t,
          createdAt: t.created_at || t.createdAt,
          updatedAt: t.updated_at || t.updatedAt,
          amount: parseFloat(t.amount || 0),
          coinAmount: parseFloat(t.coin_amount || t.coinAmount || t.amount || 0)
        }));
        
        console.log('Mapped transactions:', mappedTransactions);
        setTransactions(mappedTransactions);
      } else {
        console.error("API did not return a valid response for transactions, using fallback.", transactionsResponse);
        setTransactions([]); // Fallback to an empty array to prevent crashes
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Fallback to context data if API fails
      const contextTransactions = getUserTransactions('all');
      const mappedTransactions = contextTransactions.map(t => ({
        ...t,
        createdAt: t.date, // Use t.date directly since created_at doesn't exist
        updatedAt: t.date, // Use t.date directly since updated_at doesn't exist
        type: t.type as 'coin_purchase' | 'service_booking' | 'coin_conversion' | 'refund',
        status: t.status as 'completed' | 'pending' | 'failed' | 'cancelled',
        amount: parseFloat(t.amount?.toString() || '0'),
        coinAmount: parseFloat(t.coinAmount?.toString() || t.amount?.toString() || '0')
      }));

      setTransactions(mappedTransactions);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both local transactions and the main user data context
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

  // This call is now safe because the utility function and data fetching are robust.
  const stats = getTransactionStats(transactions);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filterTransactionsByType = (type: 'all' | 'spent' | 'added') => {
    if (!Array.isArray(transactions)) return [];
    if (type === 'all') return transactions;
    return transactions.filter(t => {
      if (type === 'spent') return t.type === 'service_booking' || t.type === 'coin_conversion';
      if (type === 'added') return t.type === 'coin_purchase' || t.type === 'refund';
      return false;
    });
  };

  const TransactionCard = ({ transaction }: { transaction: Transaction }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-gray-100">
              {getTransactionIcon(transaction.type)}
            </div>
            <div>
              <h3 className="font-semibold">{transaction.description}</h3>
              <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
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
            <Badge className={`mt-1 text-xs ${getStatusColor(transaction.status)}`}>
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
            <div className="p-3 rounded-full bg-blue-100">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{booking.serviceName}</h3>
              <p className="text-sm text-gray-600">{booking.organization}</p>
              <p className="text-xs text-gray-500">{formatDate(booking.bookedAt)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-blue-600">
              {booking.price} coins
            </p>
            <Badge className={`mt-1 text-xs ${getStatusColor('completed')}`}>
              Service Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard/user" className="flex items-center text-gray-600 hover:text-blue-600">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
            </div>
            <h1 className="text-lg font-semibold flex items-center">
              <Receipt className="h-6 w-6 text-blue-600 mr-2" />
              Transaction History
            </h1>
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
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg text-gray-600">Loading transactions...</span>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.totalSpent} coins</div>
                  <p className="text-xs text-gray-500">{filterTransactionsByType('spent').length} transactions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Added</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.totalAdded} coins</div>
                  <p className="text-xs text-gray-500">{filterTransactionsByType('added').length} transactions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                  <Receipt className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{userData?.walletBalance || 0} coins</div>
                   <p className="text-xs text-gray-500">Net change: {stats.netBalance > 0 ? '+' : ''}{stats.netBalance} coins</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center"><Filter className="h-4 w-4 mr-2 text-gray-500"/>Filter Period</h3>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Activity</TabsTrigger>
                <TabsTrigger value="spent">Spent</TabsTrigger>
                <TabsTrigger value="added">Added</TabsTrigger>
                <TabsTrigger value="services">Active Services</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="space-y-4">
                  {[...transactions, ...userStats.activeBookings]
                    .sort((a, b) => new Date('createdAt' in a ? a.createdAt : a.bookedAt).getTime() - new Date('createdAt' in b ? b.createdAt : b.bookedAt).getTime())
                    .reverse()
                    .map((item, index) => 'description' in item ? 
                      <TransactionCard key={`tx-${item.id}-${index}`} transaction={item as Transaction} /> : 
                      <BookingCard key={`bk-${item.id}-${index}`} booking={item as ServiceBooking} />
                    )}
                  {transactions.length === 0 && userStats.activeBookings.length === 0 && (
                    <Card><CardContent className="p-8 text-center text-gray-500">No activity to show.</CardContent></Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="spent" className="mt-4">
                <div className="space-y-4">
                  {filterTransactionsByType('spent').length > 0 ? filterTransactionsByType('spent').map(t => <TransactionCard key={t.id} transaction={t} />) : 
                  (<Card><CardContent className="p-8 text-center text-gray-500">No spending transactions.</CardContent></Card>)}
                </div>
              </TabsContent>
              
              <TabsContent value="added" className="mt-4">
                <div className="space-y-4">
                   {filterTransactionsByType('added').length > 0 ? filterTransactionsByType('added').map(t => <TransactionCard key={t.id} transaction={t} />) :
                   (<Card><CardContent className="p-8 text-center text-gray-500">No deposits or refunds.</CardContent></Card>)}
                </div>
              </TabsContent>
              
              <TabsContent value="services" className="mt-4">
                 <div className="space-y-4">
                    {userStats.activeBookings.length > 0 ? userStats.activeBookings.map(b => <BookingCard key={b.id} booking={b} />) :
                    (<Card><CardContent className="p-8 text-center text-gray-500">No active services.</CardContent></Card>)}
                 </div>
              </TabsContent>
            </Tabs>

            {/* Debug Panel for Testing */}
            <DebugPanel />
          </>
        )}
      </main>
    </div>
  );
};

export default UserTransactions;