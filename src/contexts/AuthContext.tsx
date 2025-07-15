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
    const result = await FirebaseAuthService.signUp(email, password, displayName, role);
    setUserData(result.userData);
    // Store in localStorage for immediate access
    localStorage.setItem('user', JSON.stringify(result.userData));
    localStorage.setItem('token', await result.user.getIdToken());
    return result;
  };

  const signIn = async (email: string, password: string) => {
    const result = await FirebaseAuthService.signIn(email, password);
    setUserData(result.userData);
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(result.userData));
    localStorage.setItem('token', await result.user.getIdToken());
    return result;
  };

  const signInWithGoogle = async (role: 'user' | 'org' = 'user') => {
    const result = await FirebaseAuthService.signInWithGoogle(role);
    setUserData(result.userData);
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(result.userData));
    localStorage.setItem('token', await result.user.getIdToken());
    return result;
  };

  const resetPassword = (email: string) => {
    return FirebaseAuthService.resetPassword(email);
  };

  const logout = async () => {
    await FirebaseAuthService.signOut();
    setUserData(null);
  };

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
          localStorage.setItem('token', token);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  const getToken = async (): Promise<string | null> => {
    return await FirebaseAuthService.getToken();
  };

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChange(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          // Get fresh token and update localStorage
          const token = await user.getIdToken();
          localStorage.setItem('token', token);
          
          // If we don't have userData, fetch it from backend
          if (!userData) {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              setUserData(data.data);
              localStorage.setItem('user', JSON.stringify(data.data));
            } else {
              // If profile fetch fails, user might not exist in backend
              console.warn('Failed to fetch user profile from backend');
            }
          }
        } catch (error) {
          console.error('Failed to handle auth state change:', error);
        }
      } else {
        setCurrentUser(null);
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