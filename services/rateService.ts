import { apiService } from "./api"
import type { User, Profile, ApiResponse, PaginatedResponse, Rate } from "@/types"

export class RateService {
  async getTable(idSede: string, page = 1, limit = 10, search?: string): Promise<PaginatedResponse<Rate>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    })

    const response = await apiService.get<ApiResponse<PaginatedResponse<Rate>>>(`/rates/all/${idSede}?${params}`)
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
