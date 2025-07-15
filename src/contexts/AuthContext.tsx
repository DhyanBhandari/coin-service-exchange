// src/contexts/AuthContext.tsx - Fixed with better error handling
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { FirebaseAuthService } from '../lib/firebase';

interface UserData {
  id: number;
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
      setUserData(result.userData);
      // Store in localStorage for immediate access
      localStorage.setItem('user', JSON.stringify(result.userData));
      localStorage.setItem('token', await result.user.getIdToken());
      return result;
    } catch (error: any) {
      console.error('Signup error in context:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await FirebaseAuthService.signIn(email, password);
      setUserData(result.userData);
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(result.userData));
      localStorage.setItem('token', await result.user.getIdToken());
      return result;
    } catch (error: any) {
      console.error('Signin error in context:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (role: 'user' | 'org' = 'user') => {
    try {
      const result = await FirebaseAuthService.signInWithGoogle(role);
      setUserData(result.userData);
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(result.userData));
      localStorage.setItem('token', await result.user.getIdToken());
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
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state anyway
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
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        
        const response = await fetch(`${apiUrl}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
          localStorage.setItem('token', token);
        } else {
          console.warn('Failed to refresh user data:', response.status);
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
          // Get fresh token and update localStorage
          const token = await user.getIdToken();
          localStorage.setItem('token', token);
          
          // Try to get user data from localStorage first
          const storedUserData = localStorage.getItem('user');
          if (storedUserData) {
            const parsedUserData = JSON.parse(storedUserData);
            setUserData(parsedUserData);
          }
          
          // If we don't have userData or if it's stale, fetch from backend
          if (!userData || !storedUserData) {
            try {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
              const response = await fetch(`${apiUrl}/auth/profile`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                setUserData(data.data);
                localStorage.setItem('user', JSON.stringify(data.data));
              } else {
                console.warn('Failed to fetch user profile from backend:', response.status);
                // If backend fails but we have a Firebase user, create minimal user data
                if (!storedUserData) {
                  const fallbackUserData = {
                    id: 0,
                    firebaseUid: user.uid,
                    email: user.email || '',
                    name: user.displayName || user.email?.split('@')[0] || 'User',
                    role: 'user' as const,
                    walletBalance: 0,
                    emailVerified: user.emailVerified,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  setUserData(fallbackUserData);
                  localStorage.setItem('user', JSON.stringify(fallbackUserData));
                }
              }
            } catch (fetchError) {
              console.error('Error fetching user profile:', fetchError);
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

  // Auto-refresh token every 45 minutes
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(async () => {
        try {
          const token = await currentUser.getIdToken(true);
          localStorage.setItem('token', token);
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      }, 45 * 60 * 1000); // 45 minutes

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