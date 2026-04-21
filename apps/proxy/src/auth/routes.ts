import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Login page
router.get('/login', (req, res) => {
  res.render('login', { error: req.query.error });
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login?error=not_authorized' }),
  (_req, res) => {
    res.redirect('/');
  }
);

// Amazon OAuth
router.get('/amazon', passport.authenticate('amazon', { scope: ['profile'] }));
router.get(
  '/amazon/callback',
  passport.authenticate('amazon', { failureRedirect: '/auth/login?error=not_authorized' }),
  (_req, res) => {
    res.redirect('/');
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/auth/login');
  });
});

export { router as authRouter };
