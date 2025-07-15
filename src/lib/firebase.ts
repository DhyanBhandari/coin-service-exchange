// src/lib/firebase.ts - Fixed Firebase Configuration
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Get the correct API URL
const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl || apiUrl === 'undefined') {
    console.warn('VITE_API_URL not set, using fallback');
    return 'http://localhost:5000/api/v1';
  }
  return apiUrl;
};

// Firebase Auth Service
export class FirebaseAuthService {
  
  // Sign up new user with email/password
  static async signUp(email: string, password: string, displayName: string, role: 'user' | 'org' = 'user') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with display name
      await updateProfile(user, { displayName });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user in your backend with Firebase UID
      const apiUrl = getApiUrl();
      const backendResponse = await fetch(`${apiUrl}/auth/firebase-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: displayName,
          role: role,
          emailVerified: user.emailVerified
        })
      });
      
      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error('Backend response error:', errorText);
        throw new Error(`Failed to create user in backend: ${backendResponse.status}`);
      }
      
      const userData = await backendResponse.json();
      return { user, userData: userData.data };
      
    } catch (error: any) {
      console.error('Firebase signup error:', error);
      
      // Clean up Firebase user if backend creation fails
      if (auth.currentUser && error.message.includes('backend')) {
        try {
          await auth.currentUser.delete();
        } catch (deleteError) {
          console.error('Failed to cleanup Firebase user:', deleteError);
        }
      }
      
      // Map Firebase errors to user-friendly messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }
      
      throw error;
    }
  }
  
  // Sign in existing user with email/password
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user data from your backend
      const apiUrl = getApiUrl();
      const backendResponse = await fetch(`${apiUrl}/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        })
      });
      
      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error('Backend login error:', errorText);
        throw new Error(`Failed to authenticate with backend: ${backendResponse.status}`);
      }
      
      const userData = await backendResponse.json();
      return { user, userData: userData.data };
      
    } catch (error: any) {
      console.error('Firebase signin error:', error);
      
      // Map Firebase errors to user-friendly messages
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later');
      }
      
      throw error;
    }
  }
  
  // Sign in with Google
  static async signInWithGoogle(role: 'user' | 'org' = 'user') {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in backend first
      const apiUrl = getApiUrl();
      let backendResponse = await fetch(`${apiUrl}/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        })
      });
      
      let userData;
      
      if (!backendResponse.ok) {
        // User doesn't exist, create new user
        backendResponse = await fetch(`${apiUrl}/auth/firebase-register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            role: role,
            emailVerified: user.emailVerified
          })
        });
        
        if (!backendResponse.ok) {
          const errorText = await backendResponse.text();
          console.error('Backend registration error:', errorText);
          throw new Error(`Failed to create user in backend: ${backendResponse.status}`);
        }
      }
      
      userData = await backendResponse.json();
      return { user, userData: userData.data };
      
    } catch (error: any) {
      console.error('Google signin error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked. Please allow pop-ups and try again');
      }
      
      throw error;
    }
  }
  
  // Reset password
  static async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if email exists for security
        return { success: true, message: 'If an account with that email exists, a password reset link has been sent' };
      }
      
      throw error;
    }
  }
  
  // Sign out
  static async signOut() {
    try {
      await signOut(auth);
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
      return { success: true };
    } catch (error: any) {
      console.error('Signout error:', error);
      throw error;
    }
  }
  
  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }
  
  // Get fresh token
  static async getToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      try {
        return await user.getIdToken(true);
      } catch (error) {
        console.error('Failed to get token:', error);
        return null;
      }
    }
    return null;
  }
  
  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
  
  // Check if user email is verified
  static isEmailVerified(): boolean {
    return auth.currentUser?.emailVerified || false;
  }
  
  // Resend email verification
  static async resendEmailVerification() {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  }
}