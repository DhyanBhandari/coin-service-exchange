import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Plus,
  Check,
  X,
  Shield,
  Zap,
  Loader2,
  Globe,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  details: {
    last4?: string;
    cardType?: string;
    upiId?: string;
    walletProvider?: string;
    holderName?: string;
  };
  isDefault: boolean;
}

interface EnhancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  purpose: 'coin_purchase' | 'service_booking';
  onSuccess: (data: any) => void;
  currentBalance?: number;
}

interface UserLocation {
  country: string;
  countryCode: string;
  isIndia: boolean;
}

interface PaymentOrder {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
}

const EnhancedPaymentModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  purpose, 
  onSuccess,
  currentBalance = 0 
}: EnhancedPaymentModalProps) => {
  const [selectedPaymentType, setSelectedPaymentType] = useState('new');
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      detectUserLocation();
      loadSavedPaymentMethods();
      loadRazorpayScript();
    }
  }, [isOpen]);

  const detectUserLocation = async () => {
    setIsDetectingLocation(true);
    try {
      // Method 1: Try IP-based geolocation
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const location: UserLocation = {
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'XX',
        isIndia: data.country_code === 'IN'
      };
      
      setUserLocation(location);
      
      // Set default payment method based on location
      if (location.isIndia) {
        setSelectedMethod('upi');
      } else {
        setSelectedMethod('card');
      }
      
    } catch (error) {
      console.error('Location detection failed:', error);
      
      // Fallback: Try navigator.language
      const language = navigator.language || 'en-US';
      const isIndia = language.toLowerCase().includes('in') || 
                     language.toLowerCase().includes('hindi') ||
                     Intl.DateTimeFormat().resolvedOptions().timeZone?.includes('Asia/Kolkata');
      
      setUserLocation({
        country: isIndia ? 'India' : 'International',
        countryCode: isIndia ? 'IN' : 'XX',
        isIndia
      });
      
      setSelectedMethod(isIndia ? 'upi' : 'card');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const loadRazorpayScript = () => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  };

  const loadSavedPaymentMethods = async () => {
    try {
      // For now, we'll use empty array since payment methods API is not implemented
      setSavedMethods([]);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const getAvailablePaymentMethods = () => {
    if (!userLocation) return [];
    
    if (userLocation.isIndia) {
      return [
        { id: 'upi', name: 'UPI', icon: <Smartphone className="h-6 w-6" />, color: 'bg-green-100 text-green-700', description: 'Pay with any UPI app' },
        { id: 'card', name: 'Card', icon: <CreditCard className="h-6 w-6" />, color: 'bg-blue-100 text-blue-700', description: 'Credit/Debit cards' },
        { id: 'wallet', name: 'Wallet', icon: <Wallet className="h-6 w-6" />, color: 'bg-purple-100 text-purple-700', description: 'Digital wallets' },
        { id: 'netbanking', name: 'Net Banking', icon: <Shield className="h-6 w-6" />, color: 'bg-orange-100 text-orange-700', description: 'Internet banking' }
      ];
    } else {
      return [
        { id: 'card', name: 'International Card', icon: <CreditCard className="h-6 w-6" />, color: 'bg-blue-100 text-blue-700', description: 'Visa/Mastercard/Amex' }
      ];
    }
  };

  const handlePayment = async () => {
    if (amount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is ₹10",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create payment order through our API
      const orderResponse = await api.payments.createOrder({
        amount,
        purpose,
        currency: 'INR',
        userLocation: userLocation
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const order = orderResponse.data as PaymentOrder;

      // Configure Razorpay options based on region
      const options = {
        key: order.keyId,
        amount: order.amount * 100, // Convert to paise
        currency: order.currency,
        name: 'ErthaExchange',
        description: purpose === 'coin_purchase' ? 'Add ErthaCoins' : 'Service Payment',
        order_id: order.orderId,
        image: '/logo.png',
        method: getPaymentMethods(),
        prefill: {
          name: 'User',
          email: 'user@example.com',
          contact: userLocation?.isIndia ? '+919999999999' : '+1234567890'
        },
        theme: {
          color: '#3B82F6'
        },
        config: {
          display: {
            blocks: {
              utib: {
                name: 'Pay using Axis Bank',
                instruments: [
                  {
                    method: 'card',
                    issuers: ['UTIB']
                  },
                  {
                    method: 'netbanking',
                    banks: ['UTIB']
                  }
                ]
              },
              other: {
                name: 'Other Payment Modes',
                instruments: [
                  {
                    method: 'card'
                  },
                  {
                    method: 'netbanking'
                  }
                ]
              }
            },
            hide: [
              {
                method: 'upi'
              }
            ],
            sequence: ['block.utib', 'block.other'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast({
              title: "Payment Cancelled",
              description: "Payment was cancelled by user",
              variant: "destructive",
            });
          }
        },
        handler: async (response: any) => {
          await verifyPayment(response, order);
        }
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay not loaded. Please refresh and try again.');
      }

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error: any) {
      setIsLoading(false);
      console.error('Payment initiation error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethods = () => {
    const methods: any = {};

    if (userLocation?.isIndia) {
      if (selectedMethod === 'upi' || selectedPaymentType === 'new') {
        methods.upi = true;
      }
      if (selectedMethod === 'card' || selectedPaymentType === 'new') {
        methods.card = true;
      }
      if (selectedMethod === 'netbanking' || selectedPaymentType === 'new') {
        methods.netbanking = true;
      }
      if (selectedMethod === 'wallet' || selectedPaymentType === 'new') {
        methods.wallet = ['paytm', 'mobikwik', 'olamoney', 'freecharge'];
      }
    } else {
      // International users - cards only
      methods.card = true;
    }

    return methods;
  };

  const verifyPayment = async (response: any, order: any) => {
    try {
      const verifyResponse = await api.payments.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        userLocation: userLocation
      });

      if (verifyResponse.success) {
        toast({
          title: "Payment Successful!",
          description: purpose === 'coin_purchase' 
            ? `₹${amount} converted to ${amount} ErthaCoins`
            : "Service payment completed successfully",
        });
        onSuccess(verifyResponse.data);
        onClose();
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment Verification Failed",
        description: error.message || "Please contact support if amount was deducted.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: '💰' },
    { id: 'paytm', name: 'Paytm', icon: '💙' },
    { id: 'phonepe', name: 'PhonePe', icon: '💜' },
    { id: 'bhim', name: 'BHIM UPI', icon: '🟢' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-blue-600" />
            {purpose === 'coin_purchase' ? 'Add ErthaCoins' : 'Complete Payment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Location Detection */}
          {isDetectingLocation ? (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-blue-800">Detecting your location for optimal payment options...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            userLocation && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-green-800">
                      Location: {userLocation.country} {userLocation.countryCode && `(${userLocation.countryCode})`}
                    </span>
                    {userLocation.isIndia && (
                      <Badge className="bg-green-100 text-green-800 ml-2">
                        🇮🇳 UPI Available
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          )}

          {/* Payment Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    {purpose === 'coin_purchase' ? 'Amount to Add' : 'Payment Amount'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">₹{amount}</p>
                  {purpose === 'coin_purchase' && (
                    <p className="text-sm text-green-600">= {amount} ErthaCoins</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="font-semibold">{currentBalance} coins</p>
                </div>
              </div>
              {purpose === 'coin_purchase' && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg">
                  <p className="text-sm text-green-800">
                    New Balance: {currentBalance + amount} coins
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          {!isDetectingLocation && userLocation && (
            <Tabs value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="saved">
                  Saved Methods ({savedMethods.length})
                </TabsTrigger>
                <TabsTrigger value="new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Payment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="saved" className="space-y-4">
                {savedMethods.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-900 mb-2">No saved payment methods</h3>
                      <p className="text-gray-500 mb-4">Add a payment method to pay faster next time</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedPaymentType('new')}
                      >
                        Add Payment Method
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {savedMethods.map((method) => (
                      <Card key={method.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-5 w-5" />
                            <div>
                              <p className="font-medium">{method.provider}</p>
                              {method.details.last4 && (
                                <p className="text-sm text-gray-500">**** {method.details.last4}</p>
                              )}
                            </div>
                          </div>
                          {method.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="new" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getAvailablePaymentMethods().map((method) => (
                    <Card 
                      key={method.id}
                      className={`cursor-pointer transition-all ${
                        selectedMethod === method.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 rounded-lg ${method.color} flex items-center justify-center mx-auto mb-2`}>
                          {method.icon}
                        </div>
                        <p className="text-sm font-medium">{method.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedMethod === 'upi' && userLocation?.isIndia && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Popular UPI Apps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {upiApps.map((app) => (
                          <div 
                            key={app.id}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <span className="text-2xl">{app.icon}</span>
                            <span className="font-medium">{app.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedMethod === 'card' && !userLocation?.isIndia && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 text-blue-700">
                        <Globe className="h-5 w-5" />
                        <span className="font-medium">International Payment</span>
                      </div>
                      <div className="mt-2 text-sm text-blue-600">
                        <p>✓ Visa, Mastercard, American Express accepted</p>
                        <p>✓ Secure international payment processing</p>
                        <p>✓ Multi-currency support</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Security Information */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-green-700">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Secure Payment</span>
              </div>
              <div className="mt-2 text-sm text-green-600">
                <p>✓ 256-bit SSL encryption</p>
                <p>✓ PCI DSS compliant</p>
                <p>✓ Powered by Razorpay</p>
                {userLocation?.isIndia && <p>✓ RBI approved payment gateway</p>}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={isLoading || isDetectingLocation}
              className="flex-1 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Pay ₹{amount}
                  {userLocation?.isIndia && selectedMethod === 'upi' && (
                    <Badge className="ml-2 bg-green-100 text-green-800">UPI</Badge>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

