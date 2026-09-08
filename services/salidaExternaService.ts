import { apiService } from "./api"
import type { ApiResponse, SalidaExterna, SalidaExternaCantidad } from "@/types"

export class SalidaExternaService {
  async getSalidasExternas(inicio: string, fin: string): Promise<SalidaExterna[]> {
    const response = await apiService.get<ApiResponse<SalidaExterna[]>>(`/salidas-externas?inicio=${inicio}&fin=${fin}`)

    response.data.forEach((salida) => {
      salida.salida = salida.plantaNombre || salida.sedeSalidaNombre || ""
      salida.destino = salida.sedeNombre || salida.plantaDestinoNombre || ""
    })

    return response.data
  }

  async getSalidaExterna(id: string): Promise<SalidaExterna> {
    const response = await apiService.get<ApiResponse<SalidaExterna>>(`/salidas-externas/${id}`)
    return response.data
  }

  async createSalidaExterna(salida: Partial<SalidaExterna>): Promise<SalidaExterna> {
    const response = await apiService.post<ApiResponse<SalidaExterna>>("/salidas-externas", salida)
    return response.data
  }

  async updateSalidaExterna(id: string, salida: Partial<SalidaExterna>): Promise<SalidaExterna> {
    const response = await apiService.put<ApiResponse<SalidaExterna>>(`/salidas-externas/${id}`, salida)
    return response.data
  }

  async deleteSalidaExterna(id: string): Promise<void> {
    await apiService.delete(`/salidas-externas/${id}`)
  }

  async updateFirma(id: string, firma: string): Promise<void> {
    await apiService.patch(`/salidas-externas/${id}/firma`, { firma })
  }

  async createCantidad(obj: Partial<SalidaExternaCantidad>): Promise<SalidaExternaCantidad> {
    const response = await apiService.post<ApiResponse<SalidaExternaCantidad>>("/salidas-externas/cantidades", obj)
    return response.data
  }

  async updateCantidad(id: string, obj: Partial<SalidaExternaCantidad>): Promise<SalidaExternaCantidad> {
    const response = await apiService.put<ApiResponse<SalidaExternaCantidad>>(`/salidas-externas/cantidades/${id}`, obj)
    return response.data
  }

  async getCantidades(salidaExternaId: string): Promise<SalidaExternaCantidad[]> {
    const response = await apiService.get<ApiResponse<SalidaExternaCantidad[]>>(`/salidas-externas/cantidades/${salidaExternaId}`)
    for (const cantidad of response.data) {
      if (cantidad.unidadMedida) {
        cantidad.cantidadUnidad = cantidad.cantidad + " " + cantidad.unidadMedida
      } else {
        cantidad.cantidadUnidad = cantidad.cantidad
      }
    }
    return response.data
  }

  async deleteCantidad(id: string): Promise<void> {
    await apiService.delete(`/salidas-externas/cantidades/${id}`)
  }
}

export const salidaExternaService = new SalidaExternaService()
