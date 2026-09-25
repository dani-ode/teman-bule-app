import { AuthFlowState } from '@/domain/auth/auth.types';
import { IAuthService } from '@/domain/auth/IAuthService';
import { AccessTokenStore } from '@/core/auth/AccessTokenStore';
import { IRefreshTokenStorage } from '@/core/storage/SecureRefreshTokenStorage';

/**
 * Session coordinator: owns auth lifecycle, single source of truth for
 * auth state. Single-flight refresh is implemented in HttpTransport and
 * delegated here. Logout clears tokens and notifies subscribers so the
 * composition root can purge per-user caches and disconnect media.
 */
export type AuthStateListener = (state: AuthFlowState) => void;

export class SessionCoordinator {
  private state: AuthFlowState = { status: 'bootstrapping' };
  private readonly listeners = new Set<AuthStateListener>();
  private logoutListeners = new Set<() => void>();

  constructor(
    private readonly authService: IAuthService,
    private readonly tokenStore: AccessTokenStore,
    private readonly refreshStorage: IRefreshTokenStorage,
  ) {}

  public getState(): AuthFlowState {
    return this.state;
  }

  public subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public onLogout(listener: () => void): () => void {
    this.logoutListeners.add(listener);
    return () => this.logoutListeners.delete(listener);
  }

  private setState(state: AuthFlowState): void {
    this.state = state;
    for (const listener of this.listeners) listener(state);
  }

  /** Restore session from stored refresh token at app bootstrap. */
  public async bootstrap(): Promise<void> {
    const refreshToken = await this.refreshStorage.load();
    if (!refreshToken) {
      this.setState({ status: 'unauthenticated' });
      return;
    }
    try {
      await this.authService.refresh();
      this.setState({ status: 'authenticated', userId: 'me' });
    } catch {
      this.tokenStore.clear();
      await this.refreshStorage.clear();
      this.setState({ status: 'unauthenticated' });
    }
  }

  public async login(email: string, password: string): Promise<void> {
    await this.authService.login({ email, password });
    this.setState({ status: 'authenticated', userId: 'me' });
  }

  /** Called by HttpTransport single-flight on 401. Returns new access token. */
  public async refresh(): Promise<string> {
    await this.authService.refresh();
    const token = this.tokenStore.get();
    if (!token) {
      throw new Error('Refresh did not yield an access token.');
    }
    return token;
  }

  /** Terminal session cleanup invoked by transport on refresh failure. */
  public onSessionExpired(): void {
    this.tokenStore.clear();
    void this.refreshStorage.clear();
    this.runLogoutCleanup();
    this.setState({ status: 'unauthenticated' });
  }

  public async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } finally {
      this.runLogoutCleanup();
      this.setState({ status: 'unauthenticated' });
    }
  }

  public async logoutAll(): Promise<void> {
    try {
      await this.authService.logoutAll();
    } finally {
      this.runLogoutCleanup();
      this.setState({ status: 'unauthenticated' });
    }
  }

  private runLogoutCleanup(): void {
    for (const listener of this.logoutListeners) {
      try {
        listener();
      } catch {
        // Cleanup must be idempotent and must not block logout.
      }
    }
  }
}
