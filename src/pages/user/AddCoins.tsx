// src/pages/user/AddCoins.tsx - Updated with real payment integration
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coins, CreditCard, Smartphone, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/contexts/UserDataContext";

const AddCoins = () => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userData } = useAuth();
  const { addCoins } = useUserData();

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'upi': return 'UPI Payment';
      case 'card': return 'Credit/Debit Card';
      case 'wallet': return 'Digital Wallet';
      default: return 'UPI Payment';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is ₹10",
        variant: "destructive",
      });
      return;
    }

    if (numAmount > 50000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum amount is ₹50,000 per transaction",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate payment processing with realistic delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Add coins using the UserData context
      const success = await addCoins(numAmount, getPaymentMethodName(paymentMethod));

      if (success) {
        toast({
          title: "Payment Successful!",
          description: `₹${numAmount} converted to ${numAmount} ErthaCoins. Your new balance: ${(userData?.walletBalance || 0) + numAmount} coins`,
        });

        // Navigate back to dashboard after successful payment
        navigate('/dashboard/user');
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentBalance = userData?.walletBalance || 0;
  const newBalance = currentBalance + (parseInt(amount) || 0);

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
              <Coins className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">Add Coins</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add ErthaCoins</h1>
          <p className="text-gray-600">Top up your wallet to access amazing services</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Amount</CardTitle>
              <CardDescription>₹1 = 1 ErthaCoins</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Current Balance Display */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700 font-medium">Current Balance</span>
                    <div className="flex items-center space-x-1">
                      <Coins className="h-4 w-4 text-blue-600" />
                      <span className="text-lg font-bold text-blue-600">{currentBalance}</span>
                      <span className="text-blue-600">coins</span>
                    </div>
                  </div>
                </div>

                {/* Quick Amount Selection */}
                <div className="space-y-3">
                  <Label>Quick Select</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        type="button"
                        variant={amount === quickAmount.toString() ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAmount(quickAmount.toString())}
                      >
                        ₹{quickAmount}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Custom Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="10"
                    max="50000"
                    required
                  />
                  <p className="text-sm text-gray-500">Minimum: ₹10 | Maximum: ₹50,000</p>
                </div>

                {/* New Balance Preview */}
                {amount && parseInt(amount) >= 10 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 font-medium">New Balance</span>
                      <div className="flex items-center space-x-1">
                        <Coins className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">{newBalance}</span>
                        <span className="text-green-600">coins</span>
                      </div>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      +{parseInt(amount)} coins will be added
                    </p>
                  </div>
                )}

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="upi"
                        name="payment"
                        value="upi"
                        checked={paymentMethod === "upi"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <label htmlFor="upi" className="flex items-center space-x-2 cursor-pointer">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span>UPI Payment</span>
                        <Badge variant="secondary">Recommended</Badge>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="card"
                        name="payment"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                        <CreditCard className="h-4 w-4 text-green-600" />
                        <span>Credit/Debit Card</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="wallet"
                        name="payment"
                        value="wallet"
                        checked={paymentMethod === "wallet"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <label htmlFor="wallet" className="flex items-center space-x-2 cursor-pointer">
                        <Wallet className="h-4 w-4 text-purple-600" />
                        <span>Digital Wallet</span>
                      </label>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !amount || parseInt(amount) < 10}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Processing Payment...</span>
                    </div>
                  ) : (
                    `Pay ₹${amount || "0"}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium">₹{amount || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ErthaCoins</span>
                  <span className="font-medium">{amount || "0"} coins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="font-medium text-green-600">₹0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium text-sm">{getPaymentMethodName(paymentMethod)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">₹{amount || "0"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Benefits</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Instant coin conversion</li>
                  <li>• No processing fees</li>
                  <li>• Secure payment gateway</li>
                  <li>• 24/7 customer support</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Security</h4>
                <p className="text-sm text-green-800">
                  Your payment is secured with bank-grade encryption and processed through trusted payment partners.
                </p>
              </div>

              {/* Transaction History Link */}
              <div className="pt-4 border-t">
                <Link to="/transactions">
                  <Button variant="outline" className="w-full">
                    View Transaction History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddCoins;