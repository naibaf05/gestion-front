import { apiService } from "./api"
import type { ApiResponse, Rate } from "@/types"

export class RateService {
  async getTable(idSede: string): Promise<Rate[]> {
    const response = await apiService.get<ApiResponse<Rate[]>>(`/rates/all/${idSede}`)
    return response.data
  }

  async getActivos(): Promise<Rate[]> {
    const response = await apiService.get<ApiResponse<Rate[]>>('/rates/activos')
    return response.data
  }

  async get(id: string): Promise<Rate> {
    const response = await apiService.get<ApiResponse<Rate>>(`/rates/${id}`)
    return response.data
  }

  async create(rate: Partial<Rate>): Promise<Rate> {
    const response = await apiService.post<ApiResponse<Rate>>("/rates", rate)
    return response.data
  }

  async update(id: string, rate: Partial<Rate>): Promise<Rate> {
    const response = await apiService.put<ApiResponse<Rate>>(`/rates/${id}`, rate)
    return response.data
  }

  async toggleStatus(id: string): Promise<Rate> {
    const response = await apiService.patch<ApiResponse<Rate>>(`/rates/${id}/toggle-status`)
    return response.data
  }
}

export const rateService = new RateService()
