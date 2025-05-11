export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  data: {
    id: string;
    username: string;
    email: string;
    phone: string;
    role: string;
    isVerified?: boolean;
  };
  token?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
}
