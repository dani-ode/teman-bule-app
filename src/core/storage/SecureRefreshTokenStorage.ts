import * as SecureStore from 'expo-secure-store';

/**
 * Native refresh-token storage adapter.
 *
 * Blueprint auth-security.md: on native, opaque refresh token may be kept in
 * secure storage (FE-02 transport decision: backend returns refresh token in
 * the login/refresh JSON body alongside the HttpOnly web cookie, so the
 * native client persists it here). Access token stays in memory only.
 */
export interface IRefreshTokenStorage {
  load(): Promise<string | null>;
  save(token: string): Promise<void>;
  clear(): Promise<void>;
}

const REFRESH_TOKEN_KEY = 'temanbule.refresh_token.v1';

export class SecureRefreshTokenStorage implements IRefreshTokenStorage {
  public async load(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public async save(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  }

  public async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // Idempotent cleanup: missing key is not a failure.
    }
  }
}
