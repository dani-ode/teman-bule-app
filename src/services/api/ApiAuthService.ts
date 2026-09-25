import { IAuthService } from '@/domain/auth/IAuthService';
import { LoginCredentials, RegisterCredentials } from '@/domain/auth/auth.types';
import { HttpTransport, decode } from '@/core/network/HttpTransport';
import { AccessTokenStore } from '@/core/auth/AccessTokenStore';
import { IRefreshTokenStorage } from '@/core/storage/SecureRefreshTokenStorage';
import {
  genericAcceptedResponseSchema,
  googleStartResponseSchema,
  tokenPairResponseSchema,
} from './dto/auth.dto';

/**
 * HTTP auth adapter. The refresh token is persisted to native secure storage;
 * the access token lives only in memory. Web cookie transport is handled by
 * the backend; the native client uses the JSON refresh body (FE-02).
 */
export class ApiAuthService implements IAuthService {
  constructor(
    private readonly http: HttpTransport,
    private readonly tokenStore: AccessTokenStore,
    private readonly refreshStorage: IRefreshTokenStorage,
  ) {}

  private async persistTokenPair(data: unknown): Promise<void> {
    const pair = decode(tokenPairResponseSchema, data);
    this.tokenStore.set(pair.access_token);
    await this.refreshStorage.save(pair.refresh_token);
  }

  public async register(credentials: RegisterCredentials): Promise<void> {
    const data = await this.http.request({
      method: 'POST',
      path: '/auth/register',
      body: { email: credentials.email, password: credentials.password },
      anonymous: true,
      skipAuthRefresh: true,
    });
    decode(genericAcceptedResponseSchema, data);
  }

  public async verifyEmail(token: string): Promise<void> {
    const data = await this.http.request({
      method: 'POST',
      path: '/auth/email:verify',
      body: { token },
      anonymous: true,
      skipAuthRefresh: true,
    });
    decode(genericAcceptedResponseSchema, data);
  }

  public async resendVerification(email: string): Promise<void> {
    const data = await this.http.request({
      method: 'POST',
      path: '/auth/email:resend',
      body: { email },
      anonymous: true,
      skipAuthRefresh: true,
    });
    decode(genericAcceptedResponseSchema, data);
  }

  public async forgotPassword(email: string): Promise<void> {
    const data = await this.http.request({
      method: 'POST',
      path: '/auth/password:forgot',
      body: { email },
      anonymous: true,
      skipAuthRefresh: true,
    });
    decode(genericAcceptedResponseSchema, data);
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const data = await this.http.request({
      method: 'POST',
      path: '/auth/password:reset',
      body: { token, new_password: newPassword },
      anonymous: true,
      skipAuthRefresh: true,
    });
    decode(genericAcceptedResponseSchema, data);
  }

  public async login(credentials: LoginCredentials): Promise<void> {
    const data = await this.http.request({
      method: 'POST',
      path: '/auth/login',
      body: { email: credentials.email, password: credentials.password },
      anonymous: true,
      skipAuthRefresh: true,
    });
    await this.persistTokenPair(data);
  }

  public async refresh(): Promise<void> {
    const refreshToken = await this.refreshStorage.load();
    if (!refreshToken) {
      throw new Error('No refresh token available.');
    }
    const data = await this.http.request({
      method: 'POST',
      path: '/auth/refresh',
      body: { refresh_token: refreshToken },
      anonymous: true,
      skipAuthRefresh: true,
    });
    await this.persistTokenPair(data);
  }

  public async logout(): Promise<void> {
    const refreshToken = await this.refreshStorage.load();
    try {
      if (refreshToken) {
        await this.http.request({
          method: 'POST',
          path: '/auth/logout',
          body: { refresh_token: refreshToken },
          skipAuthRefresh: true,
        });
      }
    } finally {
      this.tokenStore.clear();
      await this.refreshStorage.clear();
    }
  }

  public async logoutAll(): Promise<void> {
    try {
      await this.http.request({ method: 'POST', path: '/auth/logout-all', body: {} });
    } finally {
      this.tokenStore.clear();
      await this.refreshStorage.clear();
    }
  }

  public async startGoogleLogin(): Promise<string> {
    const data = await this.http.request({
      method: 'GET',
      path: '/auth/google/start',
      anonymous: true,
      skipAuthRefresh: true,
    });
    return decode(googleStartResponseSchema, data).authorization_url;
  }

  public async linkGoogle(): Promise<string> {
    const data = await this.http.request({
      method: 'POST',
      path: '/me/identities/google:link',
      body: {},
    });
    return decode(googleStartResponseSchema, data).authorization_url;
  }

  public async unlinkGoogle(): Promise<void> {
    await this.http.request({ method: 'DELETE', path: '/me/identities/google' });
  }
}
