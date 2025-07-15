import { signInWithPopup, sendPasswordResetEmail, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

class FirebaseAuthService {
  // ... existing code ...

  async signInWithGoogle(role: 'user' | 'org' = 'user') {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Try to login first
      try {
        const loginResponse = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified
          })
        });

        if (loginResponse.ok) {
          const data = await loginResponse.json();
          return { userData: data.data, isNewUser: false };
        }

        // If login fails with 404, try to register
        if (loginResponse.status === 404) {
          const registerResponse = await fetch(`${API_BASE_URL}/auth/firebase-register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email?.split('@')[0] || 'User',
              role,
              emailVerified: user.emailVerified
            })
          });

          if (!registerResponse.ok) {
            const errorText = await registerResponse.text();
            throw new Error(errorText || 'Registration failed');
          }

          const data = await registerResponse.json();
          return { userData: data.data, isNewUser: true };
        }

        const errorText = await loginResponse.text();
        throw new Error(errorText || 'Authentication failed');

      } catch (fetchError) {
        console.error('API call failed:', fetchError);
        throw new Error('Unable to connect to server');
      }

    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();