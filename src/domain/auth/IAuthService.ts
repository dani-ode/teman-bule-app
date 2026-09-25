import {
  LoginCredentials,
  RegisterCredentials,
} from './auth.types';

/**
 * Auth service port. Infrastructure implements; domain has no React/SDK
 * dependencies. All failures surface as typed ClientError throws.
 */
export interface IAuthService {
  register(credentials: RegisterCredentials): Promise<void>;
  verifyEmail(token: string): Promise<void>;
  resendVerification(email: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  /** Returns the user id on success; tokens handled by the session coordinator. */
  login(credentials: LoginCredentials): Promise<void>;
  /** Single-flight refresh; rotates refresh token. */
  refresh(): Promise<void>;
  logout(): Promise<void>;
  logoutAll(): Promise<void>;
  /** Google web/system-browser flow start URL (FE-02 native handoff pending). */
  startGoogleLogin(): Promise<string>;
  linkGoogle(): Promise<string>;
  unlinkGoogle(): Promise<void>;
}
