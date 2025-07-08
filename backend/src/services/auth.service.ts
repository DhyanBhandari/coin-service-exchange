import { db } from '@/config/database';
import { users } from '@/models/schema';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUser,
  AppError
} from '@/utils/helpers';
import { User } from '@/types';

export class AuthService {
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<{ user: User; token: string }> {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new AppError('User already exists with this email', 409);
    }

    const hashedPassword = await hashPassword(userData.password);

    const [newUser] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();

    const token = generateToken({ userId: newUser.id, role: newUser.role });
    
    return {
      user: sanitizeUser(newUser) as User,
      token
    };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.status === 'suspended') {
      throw new AppError('Account is suspended', 403);
    }

    const token = generateToken({ userId: user.id, role: user.role });

    return {
      user: sanitizeUser(user) as User,
      token
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ? sanitizeUser(user) as User : null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}