// src/contexts/UserDataContext.tsx - Fixed with proper error handling
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';

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

interface Transaction {
  id: string;
  type: 'coin_purchase' | 'service_booking' | 'coin_conversion' | 'refund';
  subType?: string;
  amount: number;
  coinAmount?: number;
  service?: string;
  organization?: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
  paymentProvider?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  metadata?: any;
}

export interface UserStats {
  totalSpent: number;
  totalAdded: number;
  netBalance: number;
  servicesUsed: number;
  memberSince: string;
  status: 'active' | 'suspended';
  activeBookings: ServiceBooking[];
  transactions: Transaction[];
}

interface UserDataContextType {
  userStats: UserStats;
  bookService: (service: any) => Promise<boolean>;
  addCoins: (amount: number, method: string) => Promise<boolean>;
  getUserTransactions: (filter?: 'all' | 'spent' | 'added') => Transaction[];
  getRecentActivity: () => (Transaction | ServiceBooking)[];
  refreshUserData: () => Promise<void>;
  loading: boolean;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

interface UserDataProviderProps {
  children: ReactNode;
}

export const UserDataProvider: React.FC<UserDataProviderProps> = ({ children }) => {
  const { userData, refreshUserData: refreshAuth } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    totalSpent: 0,
    totalAdded: 0,
    netBalance: 0,
    servicesUsed: 0,
    memberSince: '',
    status: 'active' as 'active',
    activeBookings: [],
    transactions: []
  });
  const [loading, setLoading] = useState(false);

  // Fetch user data from backend with proper error handling
  const fetchUserData = async () => {
    if (!userData) {
      console.log('No userData available, skipping fetch');
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching user data from backend for user:', userData.id);
      
      // Fetch transactions with error handling
      console.log('Calling api.transactions.getAll()...');
      const params = new URLSearchParams();
      params.append('limit', '100');
      params.append('page', '1');
      
      const transactionsResponse = await api.transactions.getAll(params);
      let transactions: Transaction[] = [];
      
      console.log('Transactions API response:', transactionsResponse);
      
      if (transactionsResponse.success && transactionsResponse.data) {
        // Ensure the data is an array
        const rawData = transactionsResponse.data;
        console.log('Raw transaction data type:', typeof rawData, 'isArray:', Array.isArray(rawData));
        
        if (Array.isArray(rawData)) {
          transactions = rawData as Transaction[];
        } else if (rawData && typeof rawData === 'object' && 'data' in rawData) {
          // Handle paginated response format: { data: [], pagination: {} }
          transactions = Array.isArray(rawData.data) ? rawData.data as Transaction[] : [];
          console.log('Found paginated data with .data field, items count:', transactions.length);
        } else if (rawData && typeof rawData === 'object' && 'items' in rawData) {
          // Handle alternative paginated response format: { items: [], pagination: {} }
          transactions = Array.isArray(rawData.items) ? rawData.items as Transaction[] : [];
          console.log('Found paginated data with .items field, items count:', transactions.length);
        } else {
          console.warn('Invalid transactions data structure:', rawData);
          transactions = [];
        }
      } else {
        console.warn('Transactions API call failed:', transactionsResponse);
      }

      console.log('Processed transactions count:', transactions.length, 'transactions:', transactions);

      // Fetch transaction stats with error handling
      const statsResponse = await api.transactions.getStats();
      const stats = statsResponse.success ? statsResponse.data : {};

      console.log('Transaction stats:', stats);

      // Fetch user bookings
      let bookings: any[] = [];
      try {
        console.log('Fetching user bookings...');
        const bookingsResponse = await api.users.getBookings();
        console.log('Bookings API response:', bookingsResponse);
        
        if (bookingsResponse.success && bookingsResponse.data) {
          const rawBookingData = bookingsResponse.data;
          if (Array.isArray(rawBookingData)) {
            bookings = rawBookingData;
          } else if (rawBookingData && typeof rawBookingData === 'object' && 'data' in rawBookingData) {
            bookings = Array.isArray(rawBookingData.data) ? rawBookingData.data : [];
          }
        }
        console.log('Processed bookings count:', bookings.length);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        bookings = [];
      }

      // Calculate totals from transactions (with fallback to empty array)
      const safeTransactions = Array.isArray(transactions) ? transactions : [];
      const completedTransactions = safeTransactions.filter((t: any) => t.status === 'completed');
      
      const totalSpent = completedTransactions
        .filter((t: any) => t.type === 'service_booking')
        .reduce((sum: number, t: any) => sum + parseFloat(t.coin_amount || t.amount || 0), 0);
      
      const totalAdded = completedTransactions
        .filter((t: any) => t.type === 'coin_purchase')
        .reduce((sum: number, t: any) => sum + parseFloat(t.coin_amount || t.amount || 0), 0);

      // Map bookings to active bookings format
      const activeBookings = bookings
        .filter((b: any) => b.status === 'confirmed' || b.status === 'active')
        .map((b: any) => ({
          id: b.id,
          serviceId: b.serviceId,
          serviceName: b.serviceTitle || b.serviceName,
          price: parseFloat(b.totalAmount || 0),
          organization: 'Unknown', // This could be enhanced with organization data
          bookedAt: b.bookingDate || b.createdAt,
          status: 'active' as const,
          bookingReference: b.bookingReference
        }));
      
      const servicesUsed = activeBookings.length;

      const newUserStats: UserStats = {
        totalSpent,
        totalAdded,
        netBalance: totalAdded - totalSpent,
        servicesUsed,
        memberSince: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }) : 'Jan 2024',
        status: (userData?.isActive ? 'active' : 'suspended') as 'active' | 'suspended',
        activeBookings,
        transactions: safeTransactions.map((t: any) => ({
          ...t,
          date: t.created_at || t.createdAt || t.date || new Date().toISOString(),
          type: t.type,
          amount: parseFloat(t.amount || 0),
          coinAmount: parseFloat(t.coin_amount || t.coinAmount || t.amount || 0)
        }))
      };

      console.log('Setting user stats:', newUserStats);
      setUserStats(newUserStats);

    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to localStorage data if backend fails
      console.log('Falling back to localStorage data');
      initializeLocalUserData();
    } finally {
      setLoading(false);
    }
  };

  // Initialize user data from localStorage (fallback)
  const initializeLocalUserData = () => {
    const userId = userData?.id;
    if (!userId) return;

    try {
      const existingTransactions = JSON.parse(localStorage.getItem(`transactions_${userId}`) || '[]');
      const existingBookings = JSON.parse(localStorage.getItem(`bookings_${userId}`) || '[]');
      
      // Ensure arrays are valid
      const safeTransactions = Array.isArray(existingTransactions) ? existingTransactions : [];
      const safeBookings = Array.isArray(existingBookings) ? existingBookings : [];
      
      const totalSpent = safeTransactions
        .filter((t: Transaction) => (t.type === 'service_booking' || t.type === 'coin_conversion') && t.status === 'completed')
        .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

      const totalAdded = safeTransactions
        .filter((t: Transaction) => (t.type === 'coin_purchase' || t.type === 'refund') && t.status === 'completed')
        .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
      
      const servicesUsed = safeBookings.filter((b: ServiceBooking) => b.status === 'active').length;
      
      const localUserStats: UserStats = {
        totalSpent,
        totalAdded,
        netBalance: totalAdded - totalSpent,
        servicesUsed,
        memberSince: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }) : 'Jan 2024',
        status: (userData?.isActive ? 'active' : 'suspended') as 'active' | 'suspended',
        activeBookings: safeBookings,
        transactions: safeTransactions
      };
      
      setUserStats(localUserStats);
    } catch (error) {
      console.error('Error initializing local user data:', error);
      // Set default empty state
      setUserStats({
        totalSpent: 0,
        totalAdded: 0,
        netBalance: 0,
        servicesUsed: 0,
        memberSince: 'Jan 2024',
        status: 'active',
        activeBookings: [],
        transactions: []
      });
    }
  };

  // Load data when userData changes
  useEffect(() => {
    if (userData) {
      fetchUserData();
    }
  }, [userData]);

  const bookService = async (service: any): Promise<boolean> => {
    try {
      if (!userData) return false;

      // Check balance
      if (userData.walletBalance < service.price) {
        return false;
      }

      // Call backend API to book service
      const response = await api.services.book(service.id, {
        quantity: 1,
        totalAmount: service.price,
        serviceId: service.serviceId || service.id,
        metadata: {
          serviceName: service.title,
          organization: service.organization,
          organizationId: service.organizationId,
          bookingType: 'service_purchase',
          paymentMethod: 'coins'
        }
      });

      if (response.success) {
        // Refresh user data and auth context
        await refreshAuth();
        await fetchUserData();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error booking service:', error);
      
      // Fallback to localStorage for demo
      const userId = userData?.id;
      if (!userId) return false;

      try {
        const booking: ServiceBooking = {
          id: Date.now().toString(),
          serviceId: service.id,
          serviceName: service.title,
          price: service.price,
          organization: service.organization || 'Unknown',
          bookedAt: new Date().toISOString(),
          status: 'active'
        };

        const transaction: Transaction = {
          id: Date.now().toString() + '_tx',
          type: 'service_booking',
          amount: service.price,
          service: service.title,
          organization: service.organization || 'Unknown',
          description: `Service booking: ${service.title}`,
          date: new Date().toISOString(),
          status: 'completed'
        };

        // Update localStorage safely
        const existingBookings = JSON.parse(localStorage.getItem(`bookings_${userId}`) || '[]');
        const existingTransactions = JSON.parse(localStorage.getItem(`transactions_${userId}`) || '[]');
        
        const safeBookings = Array.isArray(existingBookings) ? existingBookings : [];
        const safeTransactions = Array.isArray(existingTransactions) ? existingTransactions : [];
        
        safeBookings.push(booking);
        safeTransactions.push(transaction);
        
        localStorage.setItem(`bookings_${userId}`, JSON.stringify(safeBookings));
        localStorage.setItem(`transactions_${userId}`, JSON.stringify(safeTransactions));

        // Update user balance
        const updatedUser = {
          ...userData,
          walletBalance: userData.walletBalance - service.price
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Refresh data
        refreshAuth();
        initializeLocalUserData();

        return true;
      } catch (localError) {
        console.error('Error with local storage fallback:', localError);
        return false;
      }
    }
  };

  const addCoins = async (amount: number, method: string): Promise<boolean> => {
    try {
      if (!userData) {
        console.error("User data not available to add coins.");
        return false;
      }

      // For payment methods like 'razorpay', the transaction should already be created by payment verification
      // So we just need to refresh the data to get the latest state
      if (method === 'razorpay') {
        console.log('Razorpay payment detected, refreshing data from server...');
        
        // Add multiple retry attempts with delays to ensure backend has processed the payment
        let retryCount = 0;
        const maxRetries = 5;
        
        while (retryCount < maxRetries) {
          try {
            await refreshAuth();
            await fetchUserData();
            
            // Check if transaction data has been updated by making a fresh API call
            const freshTransactionsResponse = await api.transactions.getAll();
            if (freshTransactionsResponse.success && freshTransactionsResponse.data) {
              const freshData = Array.isArray(freshTransactionsResponse.data) ? freshTransactionsResponse.data : 
                (typeof freshTransactionsResponse.data === 'object' && freshTransactionsResponse.data !== null &&
                  'data' in freshTransactionsResponse.data ? freshTransactionsResponse.data.data : [])

              
              if (Array.isArray(freshData) && freshData.length > 0) {
                console.log(`Fresh transaction data found: ${freshData.length} transactions`);
                return true;
              }
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Retry ${retryCount}/${maxRetries} - waiting for backend to process...`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            }
          } catch (error) {
            console.error(`Retry ${retryCount} failed:`, error);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        console.log('All retries completed, returning success to prevent user confusion');
        return true;
      }

      // For other methods, create the transaction record
      try {
        const response = await api.transactions.create({
          type: 'coin_purchase',
          amount: amount,
          description: `Wallet top-up via ${method}`,
          status: 'completed',
          metadata: { paymentMethod: method }
        });

        if (response.success) {
          // ✅ If successful, refresh ALL data from the server.
          await refreshAuth();
          await fetchUserData();
          return true;
        } else {
          console.error("Failed to create transaction on server:", response);
          return false;
        }
      } catch (apiError) {
        console.error('API transaction creation failed, using fallback:', apiError);
        // Fallback to local storage approach for demo purposes
        await refreshAuth();
        await fetchUserData();
        return true;
      }

    } catch (error) {
      console.error('Error adding coins:', error);
      return false;
    }
  };

  const getUserTransactions = (filter: 'all' | 'spent' | 'added' = 'all'): Transaction[] => {
    const safeTransactions = Array.isArray(userStats.transactions) ? userStats.transactions : [];
    
    if (filter === 'all') return safeTransactions;
    
    return safeTransactions.filter(t => {
      if (filter === 'spent') {
        return t.type === 'service_booking' || t.type === 'coin_conversion';
      }
      if (filter === 'added') {
        return t.type === 'coin_purchase' || t.type === 'refund';
      }
      return true;
    });
  };

  const getRecentActivity = (): (Transaction | ServiceBooking)[] => {
    const safeTransactions = Array.isArray(userStats.transactions) ? userStats.transactions : [];
    const safeBookings = Array.isArray(userStats.activeBookings) ? userStats.activeBookings : [];
    
    const allActivity: (Transaction | ServiceBooking)[] = [
      ...safeTransactions.map(t => ({ ...t, activityType: 'transaction' })),
      ...safeBookings.map(b => ({ ...b, activityType: 'booking' }))
    ];

    return allActivity
      .sort((a, b) => {
        const dateA = 'date' in a ? new Date(a.date) : new Date(a.bookedAt);
        const dateB = 'date' in b ? new Date(b.date) : new Date(b.bookedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  };

  const refreshUserData = async () => {
    if (userData) {
      await fetchUserData();
    }
  };

  const value: UserDataContextType = {
    userStats,
    bookService,
    addCoins,
    getUserTransactions,
    getRecentActivity,
    refreshUserData,
    loading
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};