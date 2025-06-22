
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Receipt, TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react";

const UserTransactions = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const transactions = [
    {
      id: 1,
      type: 'spent',
      service: 'Web Development',
      organization: 'TechCorp Solutions',
      amount: 200,
      date: '2024-01-15',
      status: 'completed',
      description: 'Custom website development'
    },
    {
      id: 2,
      type: 'added',
      service: 'Wallet Top-up',
      organization: 'ErthaExchange',
      amount: 500,
      date: '2024-01-14',
      status: 'completed',
      description: 'UPI payment'
    },
    {
      id: 3,
      type: 'spent',
      service: 'Digital Marketing',
      organization: 'MarketPro Agency',
      amount: 50,
      date: '2024-01-13',
      status: 'completed',
      description: 'Social media marketing campaign'
    },
    {
      id: 4,
      type: 'spent',
      service: 'Logo Design',
      organization: 'Creative Studio',
      amount: 75,
      date: '2024-01-12',
      status: 'pending',
      description: 'Brand logo design'
    },
    {
      id: 5,
      type: 'added',
      service: 'Wallet Top-up',
      organization: 'ErthaExchange',
      amount: 1000,
      date: '2024-01-10',
      status: 'completed',
      description: 'Credit card payment'
    },
    {
      id: 6,
      type: 'spent',
      service: 'Business Consulting',
      organization: 'BizConsult Pro',
      amount: 100,
      date: '2024-01-08',
      status: 'completed',
      description: 'Strategic planning session'
    }
  ];

  const spentTransactions = transactions.filter(t => t.type === 'spent');
  const earnedTransactions = transactions.filter(t => t.type === 'added');

  const totalSpent = spentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalAdded = earnedTransactions.reduce((sum, t) => sum + t.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const TransactionCard = ({ transaction }: { transaction: any }) => (
    <Card className="mb-4">
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
              <h3 className="font-semibold">{transaction.service}</h3>
              <p className="text-sm text-gray-600">{transaction.organization}</p>
              <p className="text-xs text-gray-500">{transaction.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold text-lg ${
              transaction.type === 'spent' ? 'text-red-600' : 'text-green-600'
            }`}>
              {transaction.type === 'spent' ? '-' : '+'}{transaction.amount} coins
            </p>
            <p className="text-sm text-gray-500">{transaction.date}</p>
            <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
              {transaction.status}
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
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Net Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Receipt className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-blue-600">{totalAdded - totalSpent}</span>
                <span className="text-gray-500 ml-1">coins</span>
              </div>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="spent">Spent</TabsTrigger>
            <TabsTrigger value="added">Added</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="spent">
            <div className="space-y-4">
              {spentTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
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
              {earnedTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
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
        </Tabs>
      </div>
    </div>
  );
};

export default UserTransactions;
