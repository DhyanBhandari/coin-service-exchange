// src/contexts/UserDataContext.tsx - Simplified without transactions
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

export interface UserStats {
  totalSpent: number;
  servicesUsed: number;
  memberSince: string;
  status: 'active' | 'suspended';
  activeBookings: ServiceBooking[];
}

interface UserDataContextType {
  userStats: UserStats;
  bookService: (service: any) => Promise<boolean>;
  addCoins: (amount: number, method: string) => Promise<boolean>;
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
    servicesUsed: 0,
    memberSince: '',
    status: 'active' as 'active',
    activeBookings: []
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
      const totalSpent = activeBookings.reduce((sum, booking) => sum + booking.price, 0);

      const newUserStats: UserStats = {
        totalSpent,
        servicesUsed,
        memberSince: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }) : 'Jan 2024',
        status: (userData?.isActive ? 'active' : 'suspended') as 'active' | 'suspended',
        activeBookings
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
      const existingBookings = JSON.parse(localStorage.getItem(`bookings_${userId}`) || '[]');
      
      // Ensure arrays are valid
      const safeBookings = Array.isArray(existingBookings) ? existingBookings : [];
      
      const servicesUsed = safeBookings.filter((b: ServiceBooking) => b.status === 'active').length;
      const totalSpent = safeBookings.reduce((sum: number, b: ServiceBooking) => sum + (b.price || 0), 0);
      
      const localUserStats: UserStats = {
        totalSpent,
        servicesUsed,
        memberSince: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }) : 'Jan 2024',
        status: (userData?.isActive ? 'active' : 'suspended') as 'active' | 'suspended',
        activeBookings: safeBookings
      };
      
      setUserStats(localUserStats);
    } catch (error) {
      console.error('Error initializing local user data:', error);
      // Set default empty state
      setUserStats({
        totalSpent: 0,
        servicesUsed: 0,
        memberSince: 'Jan 2024',
        status: 'active',
        activeBookings: []
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

        // Update localStorage safely
        const existingBookings = JSON.parse(localStorage.getItem(`bookings_${userId}`) || '[]');
        
        const safeBookings = Array.isArray(existingBookings) ? existingBookings : [];
        
        safeBookings.push(booking);
        
        localStorage.setItem(`bookings_${userId}`, JSON.stringify(safeBookings));

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

      // Simply refresh the data after payment is completed
      // The payment verification on the backend handles the actual coin addition
      await refreshAuth();
      await fetchUserData();
      return true;

    } catch (error) {
      console.error('Error adding coins:', error);
      return false;
    }
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
    refreshUserData,
    loading
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};