import { apiService } from "./api"
import type { User, Profile, ApiResponse } from "@/types"

export class UserService {
  async getUsers(): Promise<User[]> {
    const response = await apiService.get<ApiResponse<User[]>>(`/users`)
    return response.data
  }

  async getUsersActivos(): Promise<User[]> {
    const response = await apiService.get<ApiResponse<User[]>>('/users/activos')
    response.data.forEach((element) => {
      element.nombreCompleto = `${element.nombre} ${element.apellido} - ${element.documento}`;
    });
    return response.data
  }

  async getUser(id: string): Promise<User> {
    const response = await apiService.get<ApiResponse<User>>(`/users/${id}`)
    return response.data
  }

  async createUser(user: Partial<User>): Promise<User> {
    const response = await apiService.post<ApiResponse<User>>("/users", user)
    return response.data
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const response = await apiService.put<ApiResponse<User>>(`/users/${id}`, user)
    return response.data
  }

  async deleteUser(id: string): Promise<void> {
    await apiService.delete(`/users/${id}`)
  }

  async toggleUserStatus(id: string): Promise<User> {
    const response = await apiService.patch<ApiResponse<User>>(`/users/${id}/toggle-status`)
    return response.data
  }

  // Perfiles
  async getProfilesTable(): Promise<Profile[]> {
    const response = await apiService.get<ApiResponse<Profile[]>>(`/roles/all`)
    response.data.forEach((element) => {
      if (element.permisos && typeof element.permisos === "string") {
        element.permisos = JSON.parse(element.permisos);
      }
    });
    return response.data
  }

  async getProfiles(): Promise<Profile[]> {
    const response = await apiService.get<ApiResponse<Profile[]>>("/roles")
    response.data.forEach((element) => {
      if (element.permisos && typeof element.permisos === "string") {
        element.permisos = JSON.parse(element.permisos);
      }
    });
    return response.data
  }

  async getProfile(id: string): Promise<Profile> {
    const response = await apiService.get<ApiResponse<Profile>>(`/roles/${id}`)
    return response.data
  }

  async createProfile(profile: Partial<Profile>): Promise<Profile> {
    const response = await apiService.post<ApiResponse<Profile>>("/roles", profile)
    return response.data
  }

  async updateProfile(id: string, profile: Partial<Profile>): Promise<Profile> {
    const response = await apiService.put<ApiResponse<Profile>>(`/roles/${id}`, profile)
    return response.data
  }

  async togglRolesStatus(id: string): Promise<User> {
    const response = await apiService.patch<ApiResponse<User>>(`/roles/${id}/toggle-status`)
    return response.data
  }
}

export const userService = new UserService()
