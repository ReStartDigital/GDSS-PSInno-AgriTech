import { UserRole } from "../constants/roles.enum";

/** The shape of the decoded JWT access token payload. */
export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  type: "access";
}

/** The shape of the decoded short-lived registration token payload (post-OTP, pre-PIN). */
export interface RegistrationTokenPayload {
  sub: string; // user id
  phone: string;
  type: "registration";
}

declare global {
   
  namespace Express {
    interface Request {
      requestId: string;
      /** Set by `authenticate` middleware after verifying a full access token. */
      user?: AccessTokenPayload;
      /** Set by `requireRegistrationToken` middleware — distinct from `user` on purpose,
       *  so a registration token can never accidentally be treated as a full login session. */
      registration?: RegistrationTokenPayload;
    }
  }
}

export {};
