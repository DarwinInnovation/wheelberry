import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchMe, type UserInfo } from '@/api/client';

interface AuthState {
  user: UserInfo | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    fetchMe()
      .then((user) => setState({ user, loading: false }))
      .catch(() => {
        window.location.href = '/auth/login';
      });
  }, []);

  if (state.loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
