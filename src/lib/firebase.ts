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
      const backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/firebase-register`, {
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
        const errorData = await backendResponse.json();
        throw new Error(errorData.message || 'Failed to create user in backend');
      }
      
      const userData = await backendResponse.json();
      return { user, userData: userData.data };
      
    } catch (error: any) {
      // Clean up Firebase user if backend creation fails
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      throw new Error(error.message);
    }
  }
  
  // Sign in existing user with email/password
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user data from your backend
      const backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/firebase-login`, {
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
        const errorData = await backendResponse.json();
        throw new Error(errorData.message || 'Failed to authenticate with backend');
      }
      
      const userData = await backendResponse.json();
      return { user, userData: userData.data };
      
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  
  // Sign in with Google
  static async signInWithGoogle(role: 'user' | 'org' = 'user') {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in backend first
      let backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/firebase-login`, {
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
        backendResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/firebase-register`, {
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
          const errorData = await backendResponse.json();
          throw new Error(errorData.message || 'Failed to create user in backend');
        }
      }
      
      userData = await backendResponse.json();
      return { user, userData: userData.data };
      
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  
  // Reset password
  static async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error: any) {
      throw new Error(error.message);
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
      throw new Error(error.message);
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
      return await user.getIdToken(true);
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