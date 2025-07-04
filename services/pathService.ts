import { apiService } from "./api"
import type { Path, ApiResponse, PaginatedResponse } from "@/types"

export class PathService {
  async getData(page = 1, limit = 10, search?: string): Promise<PaginatedResponse<Path>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    })

    const response = await apiService.get<ApiResponse<PaginatedResponse<Path>>>(`/rutas?${params}`)
    return response.data
  }

  async getAll(): Promise<Path[]> {
    const response = await apiService.get<ApiResponse<Path[]>>(`/rutas/all`)
    return response.data
  }

  async get(id: string): Promise<Path> {
    const response = await apiService.get<ApiResponse<Path>>(`/rutas/${id}`)
    return response.data
  }

  async create(ruta: Partial<Path>): Promise<Path> {
    const response = await apiService.post<ApiResponse<Path>>("/rutas", ruta)
    return response.data
  }

  async update(id: string, ruta: Partial<Path>): Promise<Path> {
    const response = await apiService.put<ApiResponse<Path>>(`/rutas/${id}`, ruta)
    return response.data
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`/rutas/${id}`)
  }

  async toggleRutaStatus(id: string): Promise<Path> {
    const response = await apiService.patch<ApiResponse<Path>>(`/rutas/${id}/toggle-status`)
    return response.data
  }

  async createFrecuencias(list: any[], sedeId: string): Promise<String> {
    list.forEach((item) => {
      item.rutaId = item.item.id;
      item.sedeId = sedeId;
    });

    const response = await apiService.post<ApiResponse<String>>("/rutas/frecuencias", list)
    return response.data
  }
}

export const pathService = new PathService()