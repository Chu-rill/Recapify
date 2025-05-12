import api from '../lib/axios';
import { AuthResponse } from '../types';

export const authService = {
  // Register a new user
  async signup(username: string, email: string, password: string, phone?: string) {
    const response = await api.post<AuthResponse>('/auth/signup', {
      username,
      email,
      password,
      phone,
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },
  
  // Login with email and password
  async login(email: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },
  
  // Logout user
  logout() {
    localStorage.removeItem('token');
  },
  
  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
  
  // Get current user profile
  async getCurrentUser() {
    const response = await api.get<AuthResponse>('/users');
    return response.data;
  },
  
  // Delete user account
  async deleteAccount() {
    const response = await api.delete<AuthResponse>('/users');
    localStorage.removeItem('token');
    return response.data;
  },
};