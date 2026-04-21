// Type declarations for passport-amazon (no @types package available)
declare module 'passport-amazon' {
  import { Strategy as PassportStrategy } from 'passport';

  interface AmazonStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string | string[];
  }

  interface AmazonProfile {
    id: string;
    displayName: string;
    emails?: Array<{ value: string }>;
    _json: {
      user_id: string;
      name: string;
      email: string;
    };
  }

  type VerifyCallback = (err: Error | null, user?: Express.User | false, info?: object) => void;

  type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: AmazonProfile,
    done: VerifyCallback
  ) => void;

  class Strategy extends PassportStrategy {
    constructor(options: AmazonStrategyOptions, verify: VerifyFunction);
    name: string;
  }
}
