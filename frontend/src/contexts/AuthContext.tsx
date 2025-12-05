import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import AuthService from '../services/auth/authService';
import type { AuthContextType, LoginRequest, User } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = AuthService.getAccessToken();
      if (token) {
        try {
          const userData = AuthService.getCurrentUserFromStorage();
          if (userData) {
            const user: User = {
              id: userData.id,
              username: userData.username,
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
              father_name: userData.father_name,
              role: userData.role || 'doctor',
              is_active: userData.is_active ?? true,
            };
            setUser(user);
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          AuthService.logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      // Call AuthService login which handles token saving
      await AuthService.login(credentials.username, credentials.password);

      // Fetch and save user information to localStorage
      const userData = await AuthService.getCurrentUser();
      if (userData) {
        const user: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          father_name: userData.father_name,
          role: userData.role || 'doctor',
          is_active: userData.is_active ?? true,
        };
        setUser(user);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      AuthService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      // Fetch latest user data and update AuthService storage
      const userData = await AuthService.getCurrentUser();
      const user: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        father_name: userData.father_name,
        role: userData.role || 'doctor',
        is_active: userData.is_active ?? true,
      };
      setUser(user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
