import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: {
    (email: string, password: string): Promise<User>;
    (token: string): Promise<User>;
  };
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async (jwt: string) => {
    localStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
    const currentUser = await api.getMe();
    setUser(currentUser);
    return currentUser;
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    restoreSession(stored)
      .catch((err) => {
        console.error(err);
        clearSession();
      })
      .finally(() => setIsLoading(false));
  }, [clearSession, restoreSession]);

  const loginWithCredentials = async (email: string, password: string) => {
    const result = await api.login({ email, password });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const loginWithToken = async (jwt: string) => {
    const currentUser = await restoreSession(jwt);
    setIsLoading(false);
    return currentUser;
  };

  const login = (async (emailOrToken: string, password?: string) => {
    if (password === undefined) {
      return loginWithToken(emailOrToken);
    }
    return loginWithCredentials(emailOrToken, password);
  }) as AuthContextType['login'];

  const signup = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const result = await api.signup({ email, password, firstName, lastName });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const logout = () => {
    api.logout();
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
