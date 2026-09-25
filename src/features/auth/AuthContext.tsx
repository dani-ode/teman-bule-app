import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthFlowState } from '@/domain/auth/auth.types';
import { SessionCoordinator } from '@/core/auth/SessionCoordinator';

/**
 * Auth context exposes the session coordinator's state and actions to the
 * tree. Client route guards are UX only; backend validates ownership (R05).
 */
interface AuthContextValue {
  readonly state: AuthFlowState;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  readonly session: SessionCoordinator;
  readonly children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ session, children }) => {
  const [state, setState] = useState<AuthFlowState>(session.getState());

  useEffect(() => session.subscribe(setState), [session]);

  const login = useCallback(
    (email: string, password: string) => session.login(email, password),
    [session],
  );
  const logout = useCallback(() => session.logout(), [session]);
  const logoutAll = useCallback(() => session.logoutAll(), [session]);

  const value = useMemo(
    () => ({ state, login, logout, logoutAll }),
    [state, login, logout, logoutAll],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return ctx;
};
