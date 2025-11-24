import { apiService } from "./api"
import type { AuthResponse, LoginCredentials, ApiResponse } from "@/types"

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>("/auth/login", credentials)
    if (response) {
      apiService.setToken(response.data.accessToken)
    }

    return response.data
  }

  async logout(): Promise<void> {
    try {
      await apiService.post("/auth/logout")
    } finally {
      apiService.removeToken()
    }
  }

  async getCurrentUser(): Promise<AuthResponse> {
    const response = await apiService.get<ApiResponse<AuthResponse>>("/auth/me")
    return response.data
  }

  async forgotPassword(email: string): Promise<void> {
    await apiService.post("/auth/forgot-password", { email })
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiService.post("/auth/reset-password", { token, password })
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>("/auth/refresh")

    if (response.success && response.data.accessToken) {
      apiService.setToken(response.data.accessToken)
    }

    return response.data
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.post("/auth/change-password", {
      currentPassword,
      newPassword,
    })
  }

  // Admin or privileged action to set a password for a user or client
  async adminSetPassword(newPassword: string, options: { userId?: string; clientId?: string }): Promise<void> {
    const { userId, clientId } = options
    await apiService.post("/auth/admin/set-password", {
      userId,
      clientId,
      newPassword,
    })
  }
}

export const authService = new AuthService()
