import { apiService } from "./api"
import type { ApiResponse, RateParam } from "@/types"

export class RateParamService {
  async getTable(parametrizacionId: string): Promise<RateParam[]> {
    const response = await apiService.get<ApiResponse<RateParam[]>>(`/rates-param/all/${parametrizacionId}`)
    return response.data
  }

  async get(id: string): Promise<RateParam> {
    const response = await apiService.get<ApiResponse<RateParam>>(`/rates-param/${id}`)
    return response.data
  }

  async create(rate: Partial<RateParam>): Promise<ApiResponse<RateParam>> {
    const response = await apiService.post<ApiResponse<RateParam>>("/rates-param", rate)
    return response
  }

  async update(id: string, rate: Partial<RateParam>): Promise<ApiResponse<RateParam>> {
    const response = await apiService.put<ApiResponse<RateParam>>(`/rates-param/${id}`, rate)
    return response
  }

  async toggleStatus(id: string): Promise<ApiResponse<RateParam>> {
    const response = await apiService.patch<ApiResponse<RateParam>>(`/rates-param/${id}/toggle-status`)
    return response
  }
}

export const rateParamService = new RateParamService()
