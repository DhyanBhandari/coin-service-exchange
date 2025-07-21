import { Request, Response } from 'express';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users, passwordResetTokens } from '../models/schema';
import { getDb } from '../config/database';
import { eq, and, gt } from 'drizzle-orm';
import { createApiResponse, sanitizeUser } from '../utils/helpers';
import { logActivity } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

// Firebase Register - Create user from Firebase auth
export const firebaseRegister = async (req: AuthRequest, res: Response) => {
  try {
    const { uid, email, name, role = 'user', emailVerified } = req.body;
    const firebaseUser = req.firebaseUser;

    // Verify that the Firebase UID matches
    if (firebaseUser.uid !== uid) {
      return res.status(400).json(
        createApiResponse(false, null, 'Firebase UID mismatch')
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
        createApiResponse(false, null, 'User already exists')
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
        createApiResponse(false, null, 'Email already registered')
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
        emailVerified: emailVerified || false,
        isActive: true,
        walletBalance: role === 'user' ? '0.00' : '0.00',
      })
      .returning();

    const user = newUser[0];
    const sanitizedUser = sanitizeUser(user);

    // Log activity
    try {
      await logActivity(user.id, 'user_registered', 'user', {
        email,
        role,
        firebaseUid: uid
      });
    } catch (auditError) {
      console.error('Audit logging failed:', auditError);
      // Continue without failing the registration
    }

    res.status(201).json(
      createApiResponse(true, sanitizedUser, 'User registered successfully')
    );
  } catch (error: any) {
    console.error('Firebase register error:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Registration failed')
    );
  }
};

// Firebase Login - Authenticate existing Firebase user
export const firebaseLogin = async (req: AuthRequest, res: Response) => {
  try {
    const { uid, email, emailVerified } = req.body;
    const firebaseUser = req.firebaseUser;

    // Verify that the Firebase UID matches
    if (firebaseUser.uid !== uid) {
      return res.status(400).json(
        createApiResponse(false, null, 'Firebase UID mismatch')
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
        createApiResponse(false, null, 'User not found')
      );
    }

    const user = userResult[0];

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json(
        createApiResponse(false, null, 'Account is suspended')
      );
    }

    // Update last login and email verification status if it changed
    const updateData: any = {
      lastLoginAt: new Date(),
      updatedAt: new Date()
    };

    if (user.emailVerified !== emailVerified) {
      updateData.emailVerified = emailVerified;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id));

    // Create updated user object
    const updatedUser = {
      ...user,
      ...updateData
    };

    const sanitizedUser = sanitizeUser(updatedUser);

    // Log activity
    try {
      await logActivity(user.id, 'user_login', 'user', {
        email,
        firebaseUid: uid
      });
    } catch (auditError) {
      console.error('Audit logging failed:', auditError);
      // Continue without failing the login
    }

    res.json(
      createApiResponse(true, sanitizedUser, 'Login successful')
    );
  } catch (error: any) {
    console.error('Firebase login error:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Login failed')
    );
  }
};

// Get user profile (works for both Firebase and traditional auth)
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(
        createApiResponse(false, null, 'Authentication required')
      );
    }

    const db = getDb();

    // Get user profile
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json(
        createApiResponse(false, null, 'User not found')
      );
    }

    const user = userResult[0];

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json(
        createApiResponse(false, null, 'Account is suspended')
      );
    }

    const sanitizedUser = sanitizeUser(user);

    res.json(
      createApiResponse(true, sanitizedUser, 'Profile retrieved successfully')
    );
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Failed to retrieve profile')
    );
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, phone, profileImage } = req.body;

    if (!userId) {
      return res.status(401).json(
        createApiResponse(false, null, 'Authentication required')
      );
    }

    const db = getDb();

    // Check if user exists
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json(
        createApiResponse(false, null, 'User not found')
      );
    }

    const user = userResult[0];

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json(
        createApiResponse(false, null, 'Account is suspended')
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    // Update user profile
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    // Get updated user
    const updatedUserResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const updatedUser = updatedUserResult[0];
    const sanitizedUser = sanitizeUser(updatedUser);

    // Log activity
    try {
      await logActivity(userId, 'profile_updated', 'user', {
        changes: updateData
      });
    } catch (auditError) {
      console.error('Audit logging failed:', auditError);
      // Continue without failing the update
    }

    res.json(
      createApiResponse(true, sanitizedUser, 'Profile updated successfully')
    );
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Failed to update profile')
    );
  }
};

// Traditional Register (for non-Firebase auth)
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role = 'user' } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json(
        createApiResponse(false, null, 'Email, password, and name are required')
      );
    }

    const db = getDb();

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json(
        createApiResponse(false, null, 'Email already registered')
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashedPassword,
        name,
        role: role as 'user' | 'org' | 'admin',
        emailVerified: false,
        isActive: true,
        walletBalance: role === 'user' ? '0.00' : '0.00',
      })
      .returning();

    const user = newUser[0];
    const sanitizedUser = sanitizeUser(user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Log activity
    try {
      await logActivity(user.id, 'user_registered', 'user', {
        email,
        role,
        method: 'traditional'
      });
    } catch (auditError) {
      console.error('Audit logging failed:', auditError);
      // Continue without failing the registration
    }

    res.status(201).json(
      createApiResponse(true, { user: sanitizedUser, token }, 'User registered successfully')
    );
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Registration failed')
    );
  }
};

// Traditional Login (for non-Firebase auth)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json(
        createApiResponse(false, null, 'Email and password are required')
      );
    }

    const db = getDb();

    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(401).json(
        createApiResponse(false, null, 'Invalid credentials')
      );
    }

    const user = userResult[0];

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json(
        createApiResponse(false, null, 'Account is suspended')
      );
    }

    // Check if user has a password (Firebase users might not have one)
    if (!user.passwordHash) {
      return res.status(401).json(
        createApiResponse(false, null, 'Invalid credentials')
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json(
        createApiResponse(false, null, 'Invalid credentials')
      );
    }

    // Update last login
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Create updated user object
    const updatedUser = {
      ...user,
      lastLoginAt: new Date(),
      updatedAt: new Date()
    };

    const sanitizedUser = sanitizeUser(updatedUser);

    // Log activity
    try {
      await logActivity(user.id, 'user_login', 'user', {
        email,
        method: 'traditional'
      });
    } catch (auditError) {
      console.error('Audit logging failed:', auditError);
      // Continue without failing the login
    }

    res.json(
      createApiResponse(true, { user: sanitizedUser, token }, 'Login successful')
    );
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Login failed')
    );
  }
};

// Change password (for traditional auth users)
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json(
        createApiResponse(false, null, 'Authentication required')
      );
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        createApiResponse(false, null, 'Current password and new password are required')
      );
    }

    const db = getDb();

    // Get user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json(
        createApiResponse(false, null, 'User not found')
      );
    }

    const user = userResult[0];

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json(
        createApiResponse(false, null, 'Account is suspended')
      );
    }

    // Check if user has a password (Firebase users might not have one)
    if (!user.passwordHash) {
      return res.status(400).json(
        createApiResponse(false, null, 'Password change not available for this account')
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      return res.status(401).json(
        createApiResponse(false, null, 'Current password is incorrect')
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
    try {
      await logActivity(userId, 'password_changed', 'user', {
        email: user.email
      });
    } catch (auditError) {
      console.error('Audit logging failed:', auditError);
      // Continue without failing the password change
    }

    res.json(
      createApiResponse(true, null, 'Password changed successfully')
    );
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Failed to change password')
    );
  }
};

// Forgot password function
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        createApiResponse(false, null, 'Email is required')
      );
    }

    const db = getDb();

    // Check if user exists
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success message for security
    const successMessage = 'If an account with that email exists, a password reset link has been sent.';

    if (userResult.length === 0) {
      return res.json(
        createApiResponse(true, null, successMessage)
      );
    }

    const user = userResult[0];

    // Don't send reset email for Firebase users
    if (user.firebaseUid) {
      return res.json(
        createApiResponse(true, null, successMessage)
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await db
      .insert(passwordResetTokens)
      .values({
        userId: user.id,
        token: resetToken,
        tokenHash: crypto.createHash('sha256').update(resetToken).digest('hex'),
        expiresAt,
        isUsed: false
      });

    // TODO: Send email with reset token
    // For now, just log it (in production, you'd send an email)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json(
      createApiResponse(true, null, successMessage)
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Failed to process password reset request')
    );
  }
};

// Reset password function
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json(
        createApiResponse(false, null, 'Token and new password are required')
      );
    }

    const db = getDb();

    // Find valid reset token
    const tokenResult = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.isUsed, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);

    if (tokenResult.length === 0) {
      return res.status(400).json(
        createApiResponse(false, null, 'Invalid or expired reset token')
      );
    }

    const resetTokenRecord = tokenResult[0];

    // Get user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, resetTokenRecord.userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json(
        createApiResponse(false, null, 'User not found')
      );
    }

    const user = userResult[0];

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({
        isUsed: true,
        updatedAt: new Date()
      })
      .where(eq(passwordResetTokens.id, resetTokenRecord.id));

    // Log activity
    try {
      await logActivity(user.id, 'password_reset', 'user', {
        email: user.email
      });
    } catch (auditError) {
      console.error('Audit logging failed:', auditError);
    }

    res.json(
      createApiResponse(true, null, 'Password reset successfully')
    );
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Failed to reset password')
    );
  }
};

// Logout (mainly for clearing server-side sessions if needed)
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      // Log activity
      try {
        await logActivity(userId, 'user_logout', 'user', {});
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
        // Continue without failing the logout
      }
    }

    res.json(
      createApiResponse(true, null, 'Logged out successfully')
    );
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json(
      createApiResponse(false, null, 'Logout failed')
    );
  }
};