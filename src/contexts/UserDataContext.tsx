// src/contexts/UserDataContext.tsx - Real user data management
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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
  type: 'spent' | 'added';
  amount: number;
  service?: string;
  organization?: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface UserStats {
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
  refreshUserData: () => void;
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
    status: 'active',
    activeBookings: [],
    transactions: []
  });

  // Initialize user data
  useEffect(() => {
    if (userData) {
      initializeUserData();
    }
  }, [userData]);

  const initializeUserData = () => {
    const userId = userData?.id;
    if (!userId) return;

    // Load existing data or create new
    const existingTransactions = JSON.parse(localStorage.getItem(`transactions_${userId}`) || '[]');
    const existingBookings = JSON.parse(localStorage.getItem(`bookings_${userId}`) || '[]');
    
    // Calculate stats
    const totalSpent = existingTransactions
      .filter((t: Transaction) => t.type === 'spent' && t.status === 'completed')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    
    const totalAdded = existingTransactions
      .filter((t: Transaction) => t.type === 'added' && t.status === 'completed')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    
    const servicesUsed = existingBookings.filter((b: ServiceBooking) => b.status === 'active').length;
    
    setUserStats({
      totalSpent,
      totalAdded,
      netBalance: totalAdded - totalSpent,
      servicesUsed,
      memberSince: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      }) : 'Jan 2024',
      status: userData?.isActive ? 'active' : 'suspended',
      activeBookings: existingBookings,
      transactions: existingTransactions
    });
  };

  const bookService = async (service: any): Promise<boolean> => {
    try {
      const userId = userData?.id;
      if (!userId) return false;

      // Check balance
      if (userData.walletBalance < service.price) {
        return false;
      }

      // Create booking
      const booking: ServiceBooking = {
        id: Date.now().toString(),
        serviceId: service.id,
        serviceName: service.title,
        price: service.price,
        organization: service.organization || 'Unknown',
        bookedAt: new Date().toISOString(),
        expiresAt: service.duration ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined, // 30 days from now
        status: 'active'
      };

      // Create transaction
      const transaction: Transaction = {
        id: Date.now().toString() + '_tx',
        type: 'spent',
        amount: service.price,
        service: service.title,
        organization: service.organization || 'Unknown',
        description: `Service booking: ${service.title}`,
        date: new Date().toISOString(),
        status: 'completed'
      };

      // Update localStorage
      const existingBookings = JSON.parse(localStorage.getItem(`bookings_${userId}`) || '[]');
      const existingTransactions = JSON.parse(localStorage.getItem(`transactions_${userId}`) || '[]');
      
      existingBookings.push(booking);
      existingTransactions.push(transaction);
      
      localStorage.setItem(`bookings_${userId}`, JSON.stringify(existingBookings));
      localStorage.setItem(`transactions_${userId}`, JSON.stringify(existingTransactions));

      // Update user balance
      const updatedUser = {
        ...userData,
        walletBalance: userData.walletBalance - service.price
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Refresh data
      refreshAuth();
      initializeUserData();

      return true;
    } catch (error) {
      console.error('Error booking service:', error);
      return false;
    }
  };

  const addCoins = async (amount: number, method: string): Promise<boolean> => {
    try {
      const userId = userData?.id;
      if (!userId) return false;

      // Create transaction
      const transaction: Transaction = {
        id: Date.now().toString() + '_add',
        type: 'added',
        amount,
        description: `Wallet top-up via ${method}`,
        date: new Date().toISOString(),
        status: 'completed'
      };

      // Update localStorage
      const existingTransactions = JSON.parse(localStorage.getItem(`transactions_${userId}`) || '[]');
      existingTransactions.push(transaction);
      localStorage.setItem(`transactions_${userId}`, JSON.stringify(existingTransactions));

      // Update user balance
      const updatedUser = {
        ...userData,
        walletBalance: userData.walletBalance + amount
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Refresh data
      refreshAuth();
      initializeUserData();

      return true;
    } catch (error) {
      console.error('Error adding coins:', error);
      return false;
    }
  };

  const getUserTransactions = (filter: 'all' | 'spent' | 'added' = 'all'): Transaction[] => {
    if (filter === 'all') return userStats.transactions;
    return userStats.transactions.filter(t => t.type === filter);
  };

  const getRecentActivity = (): (Transaction | ServiceBooking)[] => {
    const allActivity: (Transaction | ServiceBooking)[] = [
      ...userStats.transactions.map(t => ({ ...t, activityType: 'transaction' })),
      ...userStats.activeBookings.map(b => ({ ...b, activityType: 'booking' }))
    ];

    return allActivity
      .sort((a, b) => {
        const dateA = 'date' in a ? new Date(a.date) : new Date(a.bookedAt);
        const dateB = 'date' in b ? new Date(b.date) : new Date(b.bookedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  };

  const refreshUserData = () => {
    if (userData) {
      initializeUserData();
    }
  };

  const value: UserDataContextType = {
    userStats,
    bookService,
    addCoins,
    getUserTransactions,
    getRecentActivity,
    refreshUserData
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};