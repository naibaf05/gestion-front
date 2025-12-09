import { apiService } from "./api"
import type { Cliente, Sede, ApiResponse } from "@/types"

export class ClientService {
  // Clientes
  async getClientes(): Promise<Cliente[]> {
    const response = await apiService.get<ApiResponse<Cliente[]>>(`/clientes`)

    response.data.forEach((element) => {
      if (element.datosJsonString && typeof element.datosJsonString === "string") {
        element.datosJson = JSON.parse(element.datosJsonString);
        if (element.datosJson.tiposClienteIds) {
          element.tiposClienteIds = element.datosJson.tiposClienteIds;
        }
      }
    });
    return response.data
  }

  async getClientesActivos(): Promise<Cliente[]> {
    const response = await apiService.get<ApiResponse<Cliente[]>>(`/clientes/activos`)
    return response.data
  }

  async getCliente(id: string): Promise<Cliente> {
    const response = await apiService.get<ApiResponse<Cliente>>(`/clientes/${id}`)
    return response.data
  }

  async createCliente(cliente: Partial<Cliente>): Promise<ApiResponse<Cliente>> {
    cliente.datosJson.tiposClienteIds = cliente.tiposClienteIds;
    cliente.datosJsonString = JSON.stringify(cliente.datosJson);
    const response = await apiService.post<ApiResponse<Cliente>>("/clientes", cliente)
    return response
  }

  async updateCliente(id: string, cliente: Partial<Cliente>): Promise<ApiResponse<Cliente>> {
    cliente.datosJson.tiposClienteIds = cliente.tiposClienteIds;
    cliente.datosJsonString = JSON.stringify(cliente.datosJson);
    const response = await apiService.put<ApiResponse<Cliente>>(`/clientes/${id}`, cliente)
    return response
  }

  async deleteCliente(id: string): Promise<void> {
    await apiService.delete(`/clientes/${id}`)
  }

  async toggleClienteStatus(id: string): Promise<Cliente> {
    const response = await apiService.patch<ApiResponse<Cliente>>(`/clientes/${id}/toggle-status`)
    return response.data
  }

  // Sedes
  async getSedes(): Promise<Sede[]> {
    const response = await apiService.get<ApiResponse<Sede[]>>(`/sedes`)

    response.data.forEach((sede: Sede) => {
      if (sede.frecuencias) {
        sede.frecuencias.forEach((frecuencia: any) => {
          frecuencia.week = parseInt(frecuencia.semana);
          frecuencia.day = frecuencia.dia;
          frecuencia.item = {
            id: frecuencia.rutaId,
            nombre: frecuencia.rutaNombre,
          }
        });
      }
    });
    return response.data
  }

  async getSedesActivas(): Promise<Sede[]> {
    const response = await apiService.get<ApiResponse<Sede[]>>(`/sedes/activas`)
    return response.data
  }

  async getSede(id: string): Promise<Sede> {
    const response = await apiService.get<ApiResponse<Sede>>(`/sedes/${id}`)
    return response.data
  }

  async getSedesUpdateTarifas(fechaInicio: string, fechaFin: string): Promise<Sede[]> {
    const response = await apiService.get<ApiResponse<Sede[]>>(`/sedes/update-tarifas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
    return response.data
  }

  async createSede(sede: Partial<Sede>): Promise<ApiResponse<Sede>> {
    const response = await apiService.post<ApiResponse<Sede>>("/sedes", sede)
    return response
  }

  async updateSede(id: string, sede: Partial<Sede>): Promise<ApiResponse<Sede>> {
    const response = await apiService.put<ApiResponse<Sede>>(`/sedes/${id}`, sede)
    return response
  }

  async deleteSede(id: string): Promise<void> {
    await apiService.delete(`/sedes/${id}`)
  }

  async toggleSedeStatus(id: string): Promise<Sede> {
    const response = await apiService.patch<ApiResponse<Sede>>(`/sedes/${id}/toggle-status`)
    return response.data
  }

  async updateCoord(id: string, user: Partial<Sede>): Promise<Sede> {
    const response = await apiService.patch<ApiResponse<Sede>>(`/sedes/updateCoord/${id}`, user)
    return response.data
  }
}

export const clientService = new ClientService()
