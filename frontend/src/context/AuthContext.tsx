import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  company_id: string | null;
}

interface Company {
  company_id: string;
  company_name: string;
  invite_code: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface SignupData {
  email: string;
  password: string;
  full_name: string;
  signup_type: 'personal' | 'join_company' | 'create_company';
  company_name?: string;
  invite_code?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const api = axios.create({ baseURL: API_URL, timeout: 120000 });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedCompany = localStorage.getItem('company');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedCompany) {
        setCompany(JSON.parse(savedCompany));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const data = res.data;

    if (data.success) {
      setUser(data.user);
      setCompany(data.company);
      setToken(data.token);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.company) {
        localStorage.setItem('company', JSON.stringify(data.company));
      }
    } else {
      throw new Error(data.message || 'Login failed');
    }
  };

  const signup = async (signupData: SignupData) => {
    const res = await api.post('/api/auth/signup', signupData);
    const data = res.data;

    if (data.success) {
      setUser(data.user);
      setCompany(data.company);
      setToken(data.token);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.company) {
        localStorage.setItem('company', JSON.stringify(data.company));
      }
    } else {
      throw new Error(data.message || 'Signup failed');
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user && !!token,
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
