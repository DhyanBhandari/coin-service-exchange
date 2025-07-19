// src/pages/user/AddCoins.tsx - Updated with proper API integration
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Coins, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/contexts/UserDataContext";
import { api, apiUtils } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const AddCoins = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userData, refreshUserData } = useAuth();
  const { refreshUserData: refreshUserStats, addCoins } = useUserData();
  
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const coinPackages = [
    { coins: 100, price: 100, bonus: 0, popular: false },
    { coins: 500, price: 500, bonus: 25, popular: true },
    { coins: 1000, price: 1000, bonus: 100, popular: false },
    { coins: 2000, price: 2000, bonus: 300, popular: false },
  ];

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  // Get user location
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await apiUtils.getUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.error('Failed to get location:', error);
        setUserLocation({
          country: 'India',
          countryCode: 'IN',
          isIndia: true
        });
      }
    };

    getUserLocation();
  }, []);

  const handlePackageSelect = (packageInfo: any) => {
    setAmount(packageInfo.price.toString());
  };

  const createRazorpayOrder = async (paymentAmount: number) => {
    try {
      const response = await api.payments.createOrder({
        amount: paymentAmount,
        purpose: 'coin_purchase',
        currency: userLocation?.isIndia ? 'INR' : 'USD',
        userLocation
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('Create order error:', error);
      throw new Error(apiUtils.handleError(error));
    }
  };

  const verifyPayment = async (paymentResponse: RazorpayResponse) => {
    try {
      const response = await api.payments.verifyPayment({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        userLocation
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      throw new Error(apiUtils.handleError(error));
    }
  };

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!razorpayLoaded) {
      toast({
        title: "Payment Service Loading",
        description: "Please wait for payment service to load",
        variant: "destructive",
      });
      return;
    }

    if (!userData) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a payment",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      const orderData = await createRazorpayOrder(parseFloat(amount));
      
      // Razorpay options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency,
        name: 'ErthaExchange',
        description: 'Add coins to your wallet',
        order_id: orderData.orderId,
        prefill: {
          name: userData.name || userData.email,
          email: userData.email,
        },
        theme: {
          color: '#3B82F6'
        },
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment
            const verificationResult = await verifyPayment(response);
            
            // Add coins to user data context (this creates the transaction record)
            const success = await addCoins(parseFloat(amount), 'razorpay');
            
            if (success) {
              toast({
                title: "Payment Successful!",
                description: `${amount} coins have been added to your wallet`,
              });

              // Multiple refresh attempts to ensure data updates
              console.log('Payment successful, refreshing data...');
              await Promise.all([
                refreshUserData(),
                refreshUserStats()
              ]);
              
              // Force another refresh after a short delay
              setTimeout(async () => {
                console.log('Force refreshing data after delay...');
                await refreshUserData();
                await refreshUserStats();
              }, 1000);

              // Redirect after a longer delay to ensure data is updated
              setTimeout(() => {
                navigate('/dashboard/user');
              }, 3000);
            } else {
              throw new Error('Failed to update local transaction data');
            }
          } catch (error: any) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment",
              variant: "destructive",
            });
          }
        }
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-blue-600 mr-6"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <div className="flex items-center space-x-2">
              <Coins className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">Add Coins</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Coins to Your Wallet</h1>
          <p className="text-gray-600">
            Purchase ErthaCoins to book sustainable services
            {userLocation && (
              <span className="ml-2 text-sm text-blue-600">
                (Region: {userLocation.country})
              </span>
            )}
          </p>
          
          {/* Current Balance Display */}
          {userData && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-blue-600" />
                <span className="text-blue-900 font-medium">Current Balance:</span>
                <span className="text-2xl font-bold text-blue-600">{userData.walletBalance}</span>
                <span className="text-blue-600">coins</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Coin Packages */}
          <Card>
            <CardHeader>
              <CardTitle>Choose a Package</CardTitle>
              <CardDescription>Select a predefined coin package</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {coinPackages.map((pkg, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      pkg.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Coins className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold">{pkg.coins} Coins</span>
                          {pkg.popular && <Badge variant="default">Popular</Badge>}
                        </div>
                        {pkg.bonus > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            +{pkg.bonus} bonus coins
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {userLocation?.isIndia ? '₹' : '$'}{pkg.price}
                        </p>
                        <p className="text-sm text-gray-500">
                          {pkg.coins + pkg.bonus} total coins
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Amount */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Amount</CardTitle>
              <CardDescription>Enter your desired amount</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount ({userLocation?.isIndia ? 'INR' : 'USD'})
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="10"
                  max={userLocation?.isIndia ? "500000" : "10000"}
                />
                <p className="text-sm text-gray-500">
                  Minimum: {userLocation?.isIndia ? '₹10' : '$10'} | 
                  Maximum: {userLocation?.isIndia ? '₹500,000' : '$10,000'}
                </p>
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Payment Summary</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      Amount: {userLocation?.isIndia ? '₹' : '$'}{amount}
                    </p>
                    <p className="text-sm">
                      Coins: {amount} coins
                    </p>
                    <p className="text-sm text-blue-600">
                      You'll receive {amount} ErthaCoins
                    </p>
                  </div>
                </div>
              )}

              {!razorpayLoaded && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Loading payment service...
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handlePayment}
                className="w-full"
                disabled={isProcessing || !amount || parseFloat(amount) <= 0 || !razorpayLoaded}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay {amount ? `${userLocation?.isIndia ? '₹' : '$'}{amount}` : 'Amount'}
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Secure payment via Razorpay</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Instant coin delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">24/7 support</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By clicking Pay, you agree to our terms and conditions. 
                All payments are processed securely through Razorpay.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddCoins;