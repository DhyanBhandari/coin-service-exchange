// src/components/PaymentSuccessHandler.tsx - Component to handle post-payment data refresh
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccessHandler: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshUserData } = useAuth();
  const { refreshUserData: refreshUserStats } = useUserData();
  const { toast } = useToast();

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const paymentAmount = searchParams.get('amount');
    
    if (paymentSuccess === 'true') {
      // Refresh user data after successful payment
      const handlePaymentSuccess = async () => {
        try {
          await refreshUserData();
          await refreshUserStats();
          
          if (paymentAmount) {
            toast({
              title: "Payment Successful!",
              description: `${paymentAmount} coins have been added to your wallet`,
            });
          }
        } catch (error) {
          console.error('Failed to refresh data after payment:', error);
        }
      };

      handlePaymentSuccess();
      
      // Clean up URL parameters
      setSearchParams(prev => {
        prev.delete('payment_success');
        prev.delete('amount');
        return prev;
      });
    }
  }, [searchParams, setSearchParams, refreshUserData, refreshUserStats, toast]);

  return null; // This component doesn't render anything
};

export default PaymentSuccessHandler;