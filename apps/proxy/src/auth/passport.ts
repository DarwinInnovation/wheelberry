import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AmazonStrategy } from 'passport-amazon';
import { User, type IUser } from '../db/index.js';
import { Logger } from 'pino';

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

export function configurePassport(log: Logger) {
  // Serialize user ID into session
  passport.serializeUser((user, done) => {
    done(null, (user as IUser)._id.toString());
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Google OAuth 2.0
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            if (!email) {
              return done(null, false, { message: 'No email in Google profile' });
            }

            // Whitelist check: user must already exist in DB
            const user = await User.findOne({ email });
            if (!user) {
              log.warn(`Login rejected — email not whitelisted: ${email}`);
              return done(null, false, { message: 'User not authorized' });
            }

            // Update provider details on login
            user.provider = 'google';
            user.providerId = profile.id;
            user.lastLogin = new Date();
            await user.save();

            log.info(`Google login: ${email}`);
            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
    log.info('Google OAuth strategy configured');
  } else {
    log.warn('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google login disabled');
  }

  // Amazon OAuth 2.0
  if (process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET) {
    passport.use(
      new AmazonStrategy(
        {
          clientID: process.env.AMAZON_CLIENT_ID,
          clientSecret: process.env.AMAZON_CLIENT_SECRET,
          callbackURL: process.env.AMAZON_CALLBACK_URL || '/auth/amazon/callback',
          scope: ['profile'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile._json?.email?.toLowerCase() || profile.emails?.[0]?.value?.toLowerCase();
            if (!email) {
              return done(null, false, { message: 'No email in Amazon profile' });
            }

            // Whitelist check: user must already exist in DB
            const user = await User.findOne({ email });
            if (!user) {
              log.warn(`Login rejected — email not whitelisted: ${email}`);
              return done(null, false, { message: 'User not authorized' });
            }

            // Update provider details on login
            user.provider = 'amazon';
            user.providerId = profile.id;
            user.lastLogin = new Date();
            await user.save();

            log.info(`Amazon login: ${email}`);
            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
    log.info('Amazon OAuth strategy configured');
  } else {
    log.warn('AMAZON_CLIENT_ID / AMAZON_CLIENT_SECRET not set — Amazon login disabled');
  }
}
