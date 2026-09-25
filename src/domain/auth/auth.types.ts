/**
 * Auth domain types. Client treats decoded JWT as opaque; backend validates
 * every request (auth-security.md).
 */

export interface AuthSession {
  /** True when a valid access token is held in memory. */
  readonly authenticated: boolean;
  readonly userId: string | null;
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface RegisterCredentials {
  readonly email: string;
  readonly password: string;
}

export type AuthFlowState =
  | { readonly status: 'bootstrapping' }
  | { readonly status: 'unauthenticated' }
  | { readonly status: 'authenticated'; readonly userId: string };
