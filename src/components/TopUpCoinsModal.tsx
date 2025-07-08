import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EnhancedPaymentModal from './EnhancedPaymentModal';

interface TopUpCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSuccess: (newBalance: number) => void;
}

const TopUpCoinsModal = ({ isOpen, onClose, currentBalance, onSuccess }: TopUpCoinsModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  const predefinedAmounts = [100, 500, 1000, 2000, 5000];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getSelectedAmount = () => {
    return selectedAmount || parseInt(customAmount) || 0;
  };

  const handleProceedToPayment = () => {
    const amount = getSelectedAmount();
    
    if (amount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum top-up amount is ₹10.",
        variant: "destructive",
      });
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentSuccess = (data: any) => {
    const amount = getSelectedAmount();
    const newBalance = currentBalance + amount;
    onSuccess(newBalance);
    
    setShowPayment(false);
    onClose();
    setSelectedAmount(null);
    setCustomAmount('');
  };

  return (
    <>
      <Dialog open={isOpen && !showPayment} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              Top Up ErthaCoins
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Balance */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600">Current Balance</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-blue-900">{currentBalance} coins</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amount Selection */}
            <div>
              <Label className="text-base font-medium mb-3 block">Select Amount</Label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {predefinedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAmountSelect(amount)}
                    className="flex flex-col py-3 h-auto"
                  >
                    <span className="font-semibold">₹{amount}</span>
                    <span className="text-xs opacity-80">{amount} coins</span>
                  </Button>
                ))}
              </div>

              {/* Custom Amount */}
              <div>
                <Label htmlFor="custom-amount" className="text-sm text-gray-600 mb-2 block">
                  Or enter custom amount
                </Label>
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Enter amount in ₹"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  min={10}
                />
              </div>
            </div>

            {/* Summary */}
            {getSelectedAmount() > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Amount to pay:</span>
                      <span className="font-medium">₹{getSelectedAmount()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Coins to receive:</span>
                      <span className="font-medium">{getSelectedAmount()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-green-700 border-t border-green-200 pt-2">
                      <span>New balance will be:</span>
                      <span>{currentBalance + getSelectedAmount()} coins</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleProceedToPayment}
                disabled={getSelectedAmount() < 10}
                className="flex-1"
              >
                Proceed to Pay
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Payment Modal */}
      <EnhancedPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={getSelectedAmount()}
        purpose="coin_purchase"
        onSuccess={handlePaymentSuccess}
        currentBalance={currentBalance}
      />
    </>
  );
};

export default TopUpCoinsModal;