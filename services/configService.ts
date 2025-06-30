import { apiService } from "./api"
import type { AppConfig, ApiResponse } from "@/types"

export class ConfigService {
  async getConfig(): Promise<AppConfig> {
    const response = await apiService.get<ApiResponse<AppConfig>>("/config")
    return response.data
  }

  async updateConfig(config: Partial<AppConfig>): Promise<AppConfig> {
    const response = await apiService.put<ApiResponse<AppConfig>>("/config", config)
    return response.data
  }

  async uploadLogo(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("logo", file)

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config/logo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Error uploading logo")
    }

    const result = await response.json()
    return result.data.url
  }
}

export const configService = new ConfigService()
