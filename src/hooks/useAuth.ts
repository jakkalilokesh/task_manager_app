import { useState, useEffect } from 'react';
import { User, AuthState } from '../types';

// Simulating AWS Cognito integration
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setAuthState({
        user: JSON.parse(savedUser),
        loading: false,
        error: null
      });
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate AWS Cognito authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real implementation, this would come from Cognito
      const mockUsers = [
        { email: 'demo@student.com', password: 'demo123', name: 'Alex Johnson' },
        { email: 'test@student.com', password: 'test123', name: 'Sam Smith' }
      ];
      
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      const userData: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: user.email,
        name: user.name,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setAuthState({ user: userData, loading: false, error: null });
      return true;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
      return false;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate AWS Cognito user registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setAuthState({ user: userData, loading: false, error: null });
      return true;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }));
      return false;
    }
  };

  const signOut = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userTasks');
    setAuthState({ user: null, loading: false, error: null });
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut
  };
};