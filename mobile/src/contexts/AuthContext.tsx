import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loginWithPassword } from '../services/auth.service';
import { LoginPayload, Session } from '../types/auth';

const SESSION_STORAGE_KEY = 'trackit.session';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedSession = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);

        if (storedSession) {
          setSession(JSON.parse(storedSession) as Session);
        }
      } catch {
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      login: async (payload) => {
        const nextSession = await loginWithPassword(payload);

        await SecureStore.setItemAsync(
          SESSION_STORAGE_KEY,
          JSON.stringify(nextSession),
        );
        setSession(nextSession);
      },
      logout: async () => {
        await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
        setSession(null);
      },
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
