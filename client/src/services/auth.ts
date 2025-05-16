import api from "../lib/axios";
import { AuthResponse } from "../types";

export const authService = {
  // Register a new user
  async signup(
    username: string,
    email: string,
    password: string,
    phone?: string
  ) {
    const response = await api.post<AuthResponse>("/auth/signup", {
      username,
      email,
      password,
      phone,
    });

    // if (response.data.token) {
    //   localStorage.setItem("token", response.data.token);
    // }

    return response.data;
  },

  // Login with email and password
  async login(email: string, password: string) {
    const response = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response.data;
  },

  // Validate OTP
  async validateOTP(email: string, OTP: string) {
    const response = await api.post<AuthResponse>("/auth/validateOTP", {
      email,
      OTP,
    });
    if (response.data.token) {
      console.log(response);
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },
  // Resend OTP
  async resendOTP(email: string) {
    const response = await api.post<AuthResponse>("/auth/resendOTP", {
      email,
    });
    return response.data;
  },

  // Login with Google
  async loginWithGoogle(): Promise<void> {
    const redirectUrl = `${api.defaults.baseURL}/oauth/google`;
    console.log("Redirecting to:", redirectUrl);
    window.location.href = redirectUrl; // Or your specific Google OAuth initiation endpoint
  },

  async handleGoogleCallback(token: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/oauth/google/callback", {
      token,
    }); // Adjust the endpoint as needed
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  // Logout user
  logout() {
    localStorage.removeItem("token");
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem("token");
  },

  // Get current user profile
  async getCurrentUser() {
    const response = await api.get<AuthResponse>("/users");
    return response.data;
  },

  // Delete user account
  async deleteAccount() {
    const response = await api.delete<AuthResponse>("/users");
    localStorage.removeItem("token");
    return response.data;
  },
};
