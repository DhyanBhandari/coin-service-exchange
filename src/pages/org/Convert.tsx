
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, Clock, CheckCircle, XCircle, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConversionRequest {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  processedDate?: string;
}

const OrgConvert = () => {
  const [conversionAmount, setConversionAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [conversions, setConversions] = useState<ConversionRequest[]>([]);
  const [availableCoins] = useState(2500); // This would come from the org's wallet
  const { toast } = useToast();

  useEffect(() => {
    // Load conversion history from localStorage
    const savedConversions = localStorage.getItem('orgConversions');
    if (savedConversions) {
      setConversions(JSON.parse(savedConversions));
    } else {
      // Demo data
      const demoConversions: ConversionRequest[] = [
        {
          id: '1',
          amount: 500,
          currency: 'INR',
          status: 'approved',
          date: '2024-01-15',
          processedDate: '2024-01-16'
        },
        {
          id: '2',
          amount: 1000,
          currency: 'INR',
          status: 'pending',
          date: '2024-01-20'
        }
      ];
      setConversions(demoConversions);
      localStorage.setItem('orgConversions', JSON.stringify(demoConversions));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseInt(conversionAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    if (amount > availableCoins) {
      toast({
        title: "Insufficient Coins",
        description: "You don't have enough coins for this conversion.",
        variant: "destructive",
      });
      return;
    }

    const newConversion: ConversionRequest = {
      id: Date.now().toString(),
      amount,
      currency,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };

    const updatedConversions = [newConversion, ...conversions];
    setConversions(updatedConversions);
    localStorage.setItem('orgConversions', JSON.stringify(updatedConversions));

    toast({
      title: "Conversion Request Submitted",
      description: "Your request has been submitted for admin approval.",
    });

    setConversionAmount('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPending = conversions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Convert Coins</h1>
            <p className="text-gray-600">Convert your earned coins to fiat currency</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Conversion Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowDownUp className="h-5 w-5 mr-2 text-blue-600" />
                  New Conversion Request
                </CardTitle>
                <CardDescription>
                  Convert your coins to fiat currency (1 Coin = 1 {currency})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (Coins)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={conversionAmount}
                      onChange={(e) => setConversionAmount(e.target.value)}
                      placeholder="Enter amount to convert"
                      max={availableCoins}
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Available: {availableCoins} coins
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {conversionAmount && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        You will receive: <span className="font-semibold">
                          {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€'}{conversionAmount}
                        </span>
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={!conversionAmount}>
                    Submit Conversion Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Coins className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Available Coins</p>
                      <p className="text-2xl font-bold">{availableCoins}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold">{totalPending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Conversion History */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion History</CardTitle>
              <CardDescription>
                Track all your conversion requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No conversion requests yet</p>
                ) : (
                  conversions.map((conversion) => (
                    <div key={conversion.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(conversion.status)}
                          <span className="font-medium">
                            {conversion.amount} Coins → {conversion.currency === 'INR' ? '₹' : conversion.currency === 'USD' ? '$' : '€'}{conversion.amount}
                          </span>
                        </div>
                        <Badge className={getStatusColor(conversion.status)}>
                          {conversion.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Requested: {conversion.date}</p>
                        {conversion.processedDate && (
                          <p>Processed: {conversion.processedDate}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrgConvert;
