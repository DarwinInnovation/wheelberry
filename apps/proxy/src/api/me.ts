import { Router } from 'express';
import type { IUser } from '../db/index.js';

export const meRouter = Router();

meRouter.get('/', (req, res) => {
  const user = req.user as IUser;
  res.json({
    email: user.email,
    name: user.name,
    role: user.role,
  });
});
