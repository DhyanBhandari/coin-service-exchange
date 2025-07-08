import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { createApiResponse, AppError } from '@/utils/helpers';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, role } = req.body;
      
      const result = await this.authService.register({
        name,
        email,
        password,
        role
      });

      res.status(201).json(
        createApiResponse(true, 'User registered successfully', result)
      );
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          createApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          createApiResponse(false, 'Internal server error')
        );
      }
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      const result = await this.authService.login(email, password);

      res.status(200).json(
        createApiResponse(true, 'Login successful', result)
      );
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          createApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          createApiResponse(false, 'Internal server error')
        );
      }
    }
  };

  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      
      res.status(200).json(
        createApiResponse(true, 'Profile retrieved successfully', { user })
      );
    } catch (error) {
      res.status(500).json(
        createApiResponse(false, 'Internal server error')
      );
    }
  };

  refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      
      const token = generateToken({ userId: user.id, role: user.role });
      
      res.status(200).json(
        createApiResponse(true, 'Token refreshed successfully', { token })
      );
    } catch (error) {
      res.status(500).json(
        createApiResponse(false, 'Internal server error')
      );
    }
  };
}