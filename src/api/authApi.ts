import httpClient from "./httpClient";
import type { UserProfile } from "../context/AuthContext";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  role: string;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await httpClient.post<AuthResponse>("/auth/login", credentials);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await httpClient.post<AuthResponse>("/auth/register", data);
  return response.data;
}