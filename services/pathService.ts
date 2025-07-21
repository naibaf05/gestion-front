import { apiService } from "./api"
import type { Path, ApiResponse, InfoAdicional, ProgPath } from "@/types"

export class PathService {
  async getData(): Promise<Path[]> {
    const response = await apiService.get<ApiResponse<Path[]>>(`/rutas`)
    return response.data
  }

  async getAll(): Promise<Path[]> {
    const response = await apiService.get<ApiResponse<Path[]>>(`/rutas/all`)
    return response.data
  }

  async getActivos(): Promise<Path[]> {
    const response = await apiService.get<ApiResponse<Path[]>>(`/rutas/activas`)
    return response.data
  }

  async getRutasDia(fecha: string): Promise<Path[]> {
    const response = await apiService.get<ApiResponse<Path[]>>(`/rutas/dia?fecha=${fecha}`)
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

  async getInfoAdicional(fecha: string): Promise<InfoAdicional> {
    const response = await apiService.get<ApiResponse<InfoAdicional>>(`/rutas/info-adicional?fecha=${fecha}`)
    return response.data
  }
}

export const pathService = new PathService()