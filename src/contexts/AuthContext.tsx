// src/contexts/AuthContext.tsx - Updated with real API integration
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { FirebaseAuthService } from '../lib/firebase';
import { api } from '../lib/api';

interface UserData {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: 'user' | 'org' | 'admin';
  walletBalance: number;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role?: 'user' | 'org') => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: (role?: 'user' | 'org') => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const signUp = async (email: string, password: string, displayName: string, role: 'user' | 'org' = 'user') => {
    try {
      const result = await FirebaseAuthService.signUp(email, password, displayName, role);
      
      // Sync user data from API response
      if (result.userData) {
        const syncedUserData = {
          ...result.userData,
          walletBalance: parseFloat(result.userData.walletBalance || '0')
        };
        setUserData(syncedUserData);
        localStorage.setItem('user', JSON.stringify(syncedUserData));
      }
      
      const token = await result.user.getIdToken();
      localStorage.setItem('token', token);
      
      return result;
    } catch (error: any) {
      console.error('Signup error in context:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await FirebaseAuthService.signIn(email, password);
      
      // Sync user data from API response
      if (result.userData) {
        const syncedUserData = {
          ...result.userData,
          walletBalance: parseFloat(result.userData.walletBalance || '0')
        };
        setUserData(syncedUserData);
        localStorage.setItem('user', JSON.stringify(syncedUserData));
      }
      
      const token = await result.user.getIdToken();
      localStorage.setItem('token', token);
      
      return result;
    } catch (error: any) {
      console.error('Signin error in context:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (role: 'user' | 'org' = 'user') => {
    try {
      const result = await FirebaseAuthService.signInWithGoogle(role);
      
      // Sync user data from API response
      if (result.userData) {
        const syncedUserData = {
          ...result.userData,
          walletBalance: parseFloat(result.userData.walletBalance || '0')
        };
        setUserData(syncedUserData);
        localStorage.setItem('user', JSON.stringify(syncedUserData));
      }
      
      const token = await result.user.getIdToken();
      localStorage.setItem('token', token);
      
      return result;
    } catch (error: any) {
      console.error('Google signin error in context:', error);
      throw error;
    }
  };

  const resetPassword = (email: string) => {
    return FirebaseAuthService.resetPassword(email);
  };

  const logout = async () => {
    try {
      await FirebaseAuthService.signOut();
      setUserData(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
    } catch (error) {
      console.error('Logout error:', error);
      setUserData(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(true);
        const response = await api.auth.getProfile();
        
        if (response.success && response.data) {
          const syncedUserData = {
            ...(response.data as UserData),
            walletBalance: parseFloat((response.data as UserData).walletBalance?.toString() || '0')

          };
          setUserData(syncedUserData);
          localStorage.setItem('user', JSON.stringify(syncedUserData));
          localStorage.setItem('token', token);
        } else {
          console.warn('Failed to refresh user data:', response);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  const getToken = async (): Promise<string | null> => {
    try {
      return await FirebaseAuthService.getToken();
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChange(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const token = await user.getIdToken();
          localStorage.setItem('token', token);
          
          // Always fetch fresh user data from API when auth state changes
          try {
            const response = await api.auth.getProfile();
            
            if (response.success && response.data) {
              const syncedUserData = {
                ...(response.data as UserData),
                   walletBalance: parseFloat((response.data as UserData).walletBalance?.toString() || '0')
              };
              setUserData(syncedUserData);
              localStorage.setItem('user', JSON.stringify(syncedUserData));
            } else {
              console.warn('Failed to fetch user profile from backend:', response);
              // Try to use localStorage data as fallback
              const storedUserData = localStorage.getItem('user');
              if (storedUserData) {
                const parsedUserData = JSON.parse(storedUserData);
                setUserData({
                  ...parsedUserData,
                  walletBalance: parseFloat(parsedUserData.walletBalance || '0')
                });
              }
            }
          } catch (fetchError) {
            console.error('Error fetching user profile:', fetchError);
            // Use localStorage as fallback
            const storedUserData = localStorage.getItem('user');
            if (storedUserData) {
              const parsedUserData = JSON.parse(storedUserData);
              setUserData({
                ...parsedUserData,
                walletBalance: parseFloat(parsedUserData.walletBalance || '0')
              });
            }
          }
        } catch (error) {
          console.error('Failed to handle auth state change:', error);
        }
      } else {
        setUserData(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('auth');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auto-refresh token and user data every 30 minutes
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(async () => {
        try {
          await refreshUserData();
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    logout,
    refreshUserData,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};