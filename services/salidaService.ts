import { apiService } from "./api"
import type { Salida, ApiResponse } from "@/types"

export class SalidaService {
  // Obtener todas las salidas
  async getSalidas(inicio: string, fin: string): Promise<Salida[]> {
    const response = await apiService.get<ApiResponse<Salida[]>>(`/salidas?inicio=${inicio}&fin=${fin}`)

    response.data.forEach((salida) => {
      salida.salida = salida.plantaNombre || salida.sedeSalidaNombre || ""
      salida.destino = salida.sedeNombre || salida.plantaDestinoNombre || ""
    });
    return response.data
  }

  // Obtener salidas activas
  async getSalidasActivas(): Promise<Salida[]> {
    const response = await apiService.get<ApiResponse<Salida[]>>(`/salidas/activas`)
    return response.data
  }

  // Obtener una salida por ID
  async getSalida(id: string): Promise<Salida> {
    const response = await apiService.get<ApiResponse<Salida>>(`/salidas/${id}`)
    return response.data
  }

  // Crear nueva salida
  async createSalida(salida: Partial<Salida>): Promise<Salida> {
    const response = await apiService.post<ApiResponse<Salida>>("/salidas", salida)
    return response.data
  }

  // Actualizar salida
  async updateSalida(id: string, salida: Partial<Salida>): Promise<Salida> {
    const response = await apiService.put<ApiResponse<Salida>>(`/salidas/${id}`, salida)
    return response.data
  }

  // Eliminar salida
  async deleteSalida(id: string): Promise<void> {
    await apiService.delete(`/salidas/${id}`)
  }

  // Cambiar estado activo/inactivo
  async toggleSalidaStatus(id: string): Promise<Salida> {
    const response = await apiService.patch<ApiResponse<Salida>>(`/salidas/${id}/toggle-status`)
    return response.data
  }

  // Obtener salidas por sede
  async getSalidasBySede(sedeId: string): Promise<Salida[]> {
    const response = await apiService.get<ApiResponse<Salida[]>>(`/salidas/sede/${sedeId}`)
    return response.data
  }

  // Obtener salidas por conductor
  async getSalidasByConductor(conductorId: string): Promise<Salida[]> {
    const response = await apiService.get<ApiResponse<Salida[]>>(`/salidas/conductor/${conductorId}`)
    return response.data
  }

  // Obtener salidas por rango de fechas
  async getSalidasByDateRange(fechaInicio: string, fechaFin: string): Promise<Salida[]> {
    const response = await apiService.get<ApiResponse<Salida[]>>(`/salidas/fecha-rango?inicio=${fechaInicio}&fin=${fechaFin}`)
    return response.data
  }
}

export const salidaService = new SalidaService()
