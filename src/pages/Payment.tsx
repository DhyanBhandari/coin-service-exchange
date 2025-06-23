
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coins, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const serviceName = searchParams.get('service') || 'Service';
  const servicePrice = parseInt(searchParams.get('price') || '0');
  const [userBalance, setUserBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Get user balance from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserBalance(user.walletBalance || 0);
    }
  }, []);

  const handlePayment = async () => {
    if (userBalance < servicePrice) {
      toast({
        title: "Insufficient Balance",
        description: "Please add more coins to your wallet",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      // Update user balance
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.walletBalance = (user.walletBalance || 0) - servicePrice;
        localStorage.setItem('user', JSON.stringify(user));
      }

      toast({
        title: "Payment Successful!",
        description: `You have successfully booked ${serviceName}`,
      });

      setIsProcessing(false);
      navigate(`/feedback?service=${encodeURIComponent(serviceName)}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/" className="flex items-center text-gray-600 hover:text-blue-600 mr-6">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
          <p className="text-gray-600">Pay with your ErthaCoins</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium">{serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-medium">{servicePrice} Coins</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">{servicePrice} Coins</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Coins className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Your Balance</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{userBalance} Coins</p>
              </div>

              {userBalance < servicePrice && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800 text-sm">
                    Insufficient balance. You need {servicePrice - userBalance} more coins.
                  </p>
                  <Link to="/wallet/add" className="text-red-600 hover:text-red-700 text-sm underline">
                    Add more coins
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Confirmation */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Confirmation</CardTitle>
              <CardDescription>Review and confirm your purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Secure payment with ErthaCoins</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Instant booking confirmation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">24/7 customer support</span>
                </div>
              </div>

              <Button 
                onClick={handlePayment}
                className="w-full" 
                disabled={isProcessing || userBalance < servicePrice}
              >
                {isProcessing ? "Processing Payment..." : `Pay ${servicePrice} Coins`}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By clicking "Pay", you agree to our terms of service and confirm your purchase.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;
