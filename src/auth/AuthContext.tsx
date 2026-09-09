import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  cadastrar as apiCadastrar,
  login as apiLogin,
  logout as apiLogout,
  type CadastroInput,
  fetchMe,
  getToken,
} from '../lib/api';

interface User {
  id: number;
  nome: string;
  email: string;
  papel: string;
  permissoes: string[];
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<User>;
  cadastrar: (input: CadastroInput) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => apiLogout())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const data = await apiLogin(email, senha);
    setUser(data.user);
    return data.user;
  }, []);

  const cadastrar = useCallback(async (input: CadastroInput) => {
    const data = await apiCadastrar(input);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, cadastrar, logout }),
    [user, loading, login, cadastrar, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
