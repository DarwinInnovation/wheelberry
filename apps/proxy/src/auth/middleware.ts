import { type Request, type Response, type NextFunction } from 'express';
import type { IUser } from '../db/index.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as IUser)?.role === 'admin') {
    return next();
  }
  res.status(403).send('Forbidden');
}
