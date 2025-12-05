import axios from 'axios';
import { getHospitalManagementSystem } from '../../api/generated';
import type { LoginRequest, Token, UserResponse } from '../../api/generated';

class AuthService {
  // Login user and save token
  static async login(username: string, password: string): Promise<Token> {
    const request: LoginRequest = { username, password };
    
    try {
      // Use generated API function
      const response = await getHospitalManagementSystem().loginApiV1AuthLoginPost(request);
      const token = response.data;

      // Save token to localStorage
      localStorage.setItem('access_token', token.access_token);

      // Update global axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.access_token}`;

      return token;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Get current user information and save to localStorage
  static async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await getHospitalManagementSystem().getCurrentUserInfoApiV1AuthMeGet();
      const user = response.data as UserResponse;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Logout user
  static logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Get current user from localStorage
  static getCurrentUserFromStorage(): UserResponse | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get access token from localStorage
  static getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
}

export default AuthService;
