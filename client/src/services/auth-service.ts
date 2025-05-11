import api from "./api";
import { SignupRequest, LoginRequest, AuthResponse, User } from "../types/auth";

export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/v1/auth/signup", data);
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }
  return response.data;
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/v1/auth/login", data);
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }
  return response.data;
};

export const googleAuth = async (token: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/v1/auth/google", {
    token,
  });
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem("token");
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<{
    statusCode: number;
    message: string;
    data: User;
  }>("/api/v1/users");
  return response.data.data;
};

export const deleteAccount = async (): Promise<User> => {
  const response = await api.delete<{
    statusCode: number;
    message: string;
    data: User;
  }>("/api/v1/users");
  return response.data.data;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("token");
};
