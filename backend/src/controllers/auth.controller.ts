import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { createApiResponse, getClientIp, getUserAgent } from '../utils/helpers';
import { asyncHandler } from '../middleware/error.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { name, email, password, role } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await this.authService.register(
      { name, email, password, role },
      ipAddress,
      userAgent
    );

    res.status(201).json(
      createApiResponse(true, 'User registered successfully', result)
    );
  });

  login = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await this.authService.login(email, password, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'Login successful', result)
    );
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    res.json(
      createApiResponse(true, 'Profile retrieved successfully', req.user)
    );
  });

  updatePassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    await this.authService.updatePassword(
      req.user!.id,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent
    );

    res.json(
      createApiResponse(true, 'Password updated successfully')
    );
  });

  verifyEmail = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    await this.authService.verifyEmail(req.user!.id);

    res.json(
      createApiResponse(true, 'Email verified successfully')
    );
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    await this.authService.logout(req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'Logout successful')
    );
  });
}