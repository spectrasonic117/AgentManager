import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User, LoginCredentials, RegisterData } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const REMEMBER_KEY = 'auth_remember';

const TOKEN_EXPIRY_LONG = 7 * 24 * 60 * 60 * 1000;
const TOKEN_EXPIRY_SHORT = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getExpiryTime = useCallback((rememberMe: boolean): number => {
    return rememberMe ? TOKEN_EXPIRY_LONG : TOKEN_EXPIRY_SHORT;
  }, []);

  const saveSession = useCallback((token: string, userData: User, rememberMe: boolean) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    const expiryTime = Date.now() + getExpiryTime(rememberMe);

    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(userData));
    storage.setItem(`${TOKEN_KEY}_expiry`, expiryTime.toString());
  }, [getExpiryTime]);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(`${TOKEN_KEY}_expiry`);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(`${TOKEN_KEY}_expiry`);
  }, []);

  const loadSession = useCallback(() => {
    try {
      const rememberMe = localStorage.getItem(REMEMBER_KEY) === 'true';

      const token = rememberMe
        ? localStorage.getItem(TOKEN_KEY)
        : sessionStorage.getItem(TOKEN_KEY);

      const expiryStr = rememberMe
        ? localStorage.getItem(`${TOKEN_KEY}_expiry`)
        : sessionStorage.getItem(`${TOKEN_KEY}_expiry`);

      if (!token || !expiryStr) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        clearSession();
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const userDataStr = rememberMe
        ? localStorage.getItem(USER_KEY)
        : sessionStorage.getItem(USER_KEY);

      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Error loading session:', err);
      clearSession();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async ({ username, password, rememberMe = false }: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(username, password);

      if (!response.success || !response.user) {
        setError(response.error || 'Error al iniciar sesión');
        return;
      }

      const token = `mock_token_${Date.now()}`;
      saveSession(token, response.user, rememberMe);
      setUser(response.user);
      setIsAuthenticated(true);

      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, 'true');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ username, password, email }: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register({ username, password, email });

      if (!response.success) {
        setError(response.error || 'Error al registrar usuario');
        return;
      }

      await login({ username, password, rememberMe: false });
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
