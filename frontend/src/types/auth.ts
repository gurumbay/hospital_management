import type { UserRole as ApiUserRole } from '../api/generated';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  father_name?: string | null;
  role: ApiUserRole;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
