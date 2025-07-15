import { Request, Response } from 'express';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { users } from '../models/schema';
import { getDb } from '../config/database';
import { eq, and } from 'drizzle-orm';
import { createApiResponse, sanitizeUser } from '../utils/helpers';
import { logActivity } from '../services/audit.service';
import { any } from 'joi';

// Extend Request interface for Firebase user
interface AuthenticatedRequest extends Request {
  user?: any;
  firebaseUser?: any;
}

// Firebase Register - Create user from Firebase auth
export const firebaseRegister = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid, email, name, role = 'user', emailVerified } = req.body;
    const firebaseUser = req.firebaseUser;

    // Verify that the Firebase UID matches
    if (firebaseUser.uid !== uid) {
      return res.status(400).json(
        createApiResponse(false, 'Firebase UID mismatch')
      );
    }

    const db = getDb();

    // Check if user already exists with this Firebase UID
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json(
        createApiResponse(false, 'User already exists')
      );
    }

    // Check if user exists with this email (from previous non-Firebase registration)
    const existingEmailUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmailUser.length > 0) {
      return res.status(400).json(
        createApiResponse(false, 'Email already registered')
      );
    }

    // Create new user in database
    const newUser = await db
      .insert(users)
      .values({
        firebaseUid: uid,
        email,
        name,
        role: role as 'user' | 'org' | 'admin',
        emailVerified,
        isActive: true,
        walletBalance: role === 'user' ? '0.00' : undefined,
      })
      .returning();

    const user = newUser[0];
    const sanitizedUser = sanitizeUser(user);

    // Log activity
    await logActivity(user.id, 'user_registered', 'User registered via Firebase', {
      email,
      role,
      firebaseUid: uid
    });

    res.status(201).json(
      createApiResponse(true, 'User registered successfully', sanitizedUser)
    );
  } catch (error: any) {
    console.error('Firebase register error:', error);
    res.status(500).json(
      createApiResponse(false, 'Registration failed')
    );
  }
};

// Get user profile (works for both Firebase and traditional auth)
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json(
        createApiResponse(false, 'User not authenticated')
      );
    }

    const db = getDb();
    
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    const user = userResult[0];
    const sanitizedUser = sanitizeUser(user);

    res.json(
      createApiResponse(true, 'Profile retrieved successfully', sanitizedUser)
    );
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json(
      createApiResponse(false, 'Failed to get profile')
    );
  }
};

// Update password (for traditional auth users only)
export const updatePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    const db = getDb();

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    const user = userResult[0];

    // Check if user has Firebase auth (no password hash)
    if (!user.passwordHash) {
      return res.status(400).json(
        createApiResponse(false, 'Password change not available for Google sign-in accounts')
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json(
        createApiResponse(false, 'Current password is incorrect')
      );
    }

    // Hash new password
    const hashedNewPassword = await hash(newPassword, 12);

    // Update password
    await db
      .update(users)
      .set({ 
        passwordHash: hashedNewPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Log activity
    await logActivity(userId, 'password_changed', 'User changed password');

    res.json(
      createApiResponse(true, 'Password updated successfully')
    );
  } catch (error: any) {
    console.error('Update password error:', error);
    res.status(500).json(
      createApiResponse(false, 'Failed to update password')
    );
  }
};

// Logout (mainly for logging purposes)
export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (userId) {
      await logActivity(userId, 'user_logout', 'User logged out');
    }

    res.json(
      createApiResponse(true, 'Logged out successfully')
    );
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json(
      createApiResponse(false, 'Logout failed')
    );
  }
};

// Forgot password (for traditional auth only)
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const db = getDb();

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      // Don't reveal if email exists or not
      return res.json(
        createApiResponse(true, 'If an account with that email exists, a password reset link has been sent')
      );
    }

    const user = userResult[0];

    // Check if user has Firebase auth
    if (!user.passwordHash) {
      return res.json(
        createApiResponse(true, 'Please use the "Sign in with Google" option for this account')
      );
    }

    // TODO: Implement email sending logic
    // For now, just log the activity
    await logActivity(user.id, 'password_reset_requested', 'Password reset requested', {
      email
    });

    res.json(
      createApiResponse(true, 'If an account with that email exists, a password reset link has been sent')
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json(
      createApiResponse(false, 'Failed to process request')
    );
  }
};

// Reset password (for traditional auth only)
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // TODO: Implement token verification logic
    // This is a placeholder implementation

    res.json(
      createApiResponse(true, 'Password reset successfully')
    );
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json(
      createApiResponse(false, 'Failed to reset password')
    );
  }
};

// Firebase Login - Authenticate existing Firebase user
export const firebaseLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid, email, emailVerified } = req.body;
    const firebaseUser = req.firebaseUser;

    // Verify that the Firebase UID matches
    if (firebaseUser.uid !== uid) {
      return res.status(400).json(
        createApiResponse(false, 'Firebase UID mismatch')
      );
    }

    const db = getDb();

    // Find user by Firebase UID
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    const user = userResult[0];

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json(
        createApiResponse(false, 'Account is suspended')
      );
    }

    // Update email verification status if it changed
    if (user.emailVerified !== emailVerified) {
      await db
        .update(users)
        .set({ 
          emailVerified,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));
      
      user.emailVerified = emailVerified;
    }

    const sanitizedUser = sanitizeUser(user);

    // Log activity
    await logActivity(user.id, 'user_login', 'User logged in via Firebase', {
      email,
      firebaseUid: uid
    });

    res.json(
      createApiResponse(true, 'Login successful', sanitizedUser)
    );
  } catch (error: any) {
    console.error('Firebase login error:', error);
    res.status(500).json(
      createApiResponse(false, 'Login failed')
    );
  }
};

// Traditional register (keep for backward compatibility)
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role = 'user' } = req.body;

    const db = getDb();

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json(
        createApiResponse(false, 'User already exists')
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashedPassword,
        name,
        role: role as 'user' | 'org' | 'admin',
        emailVerified: false,
        isActive: true,
        walletBalance: role === 'user' ? '0.00' : undefined,
      })
      .returning();

    const user = newUser[0];
    const sanitizedUser:any = sanitizeUser(user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Log activity
    await logActivity(user.id, 'user_registered', 'User registered', {
      email,
      role
    });

    res.status(201).json(
      createApiResponse(true, 'User registered successfully', { user: sanitizedUser , token })
    );
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json(
      createApiResponse(false, 'Registration failed')
    );
  }
};

// Traditional login (keep for backward compatibility)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const db = getDb();

    // Find user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(401).json(
        createApiResponse(false, 'Invalid credentials')
      );
    }

    const user = userResult[0];

    // Check if user has a password (Firebase users might not)
    if (!user.passwordHash) {
      return res.status(401).json(
        createApiResponse(false, 'Please use Google sign-in for this account')
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json(
        createApiResponse(false, 'Invalid credentials')
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json(
        createApiResponse(false, 'Account is suspended')
      );
    }

    const sanitizedUser = sanitizeUser(user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Log activity
    await logActivity(user.id, 'user_login', 'User logged in', {
      email
    });

    res.json(
      createApiResponse(true, 'Login successful', { user: sanitizedUser , token })
    );
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json(
      createApiResponse(false, 'Login failed')
    );
  }
};