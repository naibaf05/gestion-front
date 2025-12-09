import { apiService } from "./api"
import type { ApiResponse, Rate } from "@/types"

export class RateService {
  async getTable(idSede: string): Promise<Rate[]> {
    const response = await apiService.get<ApiResponse<Rate[]>>(`/rates/all/${idSede}`)
    return response.data
  }

  async getDataActivos(sedeId: string, tResiduoId: string): Promise<Rate[]> {
    const response = await apiService.get<ApiResponse<Rate[]>>(`/rates/all/activos/${sedeId}/${tResiduoId}`)
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

  async create(rate: Partial<Rate>): Promise<ApiResponse<Rate>> {
    const response = await apiService.post<ApiResponse<Rate>>("/rates", rate)
    return response
  }

  async update(id: string, rate: Partial<Rate>): Promise<ApiResponse<Rate>> {
    const response = await apiService.put<ApiResponse<Rate>>(`/rates/${id}`, rate)
    return response
  }

  async updateTarifas(fechaInicio: string, fechaFin: string, sedeIds: string[]): Promise<ApiResponse<Rate>> {
    const rate = { fechaInicio, fechaFin, sedeIds };
    const response = await apiService.put<ApiResponse<Rate>>(`/rates/updateTarifas`, rate)
    return response
  }

  async toggleStatus(id: string): Promise<ApiResponse<Rate>> {
    const response = await apiService.patch<ApiResponse<Rate>>(`/rates/${id}/toggle-status`)
    return response
  }
}

export const rateService = new RateService()
