import { useState, useEffect } from 'react';
import { User } from 'safehaven-shared';
import { getApiService } from '../services/apiService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const TOKEN_STORAGE_KEY = 'safehaven_dashboard_token';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        
        if (storedToken) {
          const apiService = getApiService();
          apiService.setToken(storedToken);
          
          // Verify token is still valid
          const user = await apiService.verifyToken();
          
          if (user) {
            setAuthState({
              user,
              token: storedToken,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            // Token is invalid, clear it
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            apiService.clearToken();
            setAuthState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        } else {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const apiService = getApiService();
      const authResponse = await apiService.login(email, password);
      
      if (authResponse?.token && authResponse?.user) {
        localStorage.setItem(TOKEN_STORAGE_KEY, authResponse.token);
        
        setAuthState({
          user: authResponse.user,
          token: authResponse.token,
          isAuthenticated: true,
          isLoading: false
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    
    const apiService = getApiService();
    apiService.clearToken();
    
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  return {
    ...authState,
    login,
    logout
  };
}
