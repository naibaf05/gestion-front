import { apiService } from "./api";
import type { ApiResponse, VisitaCantidad, VisitaRecol } from "@/types";

export class VisitService {
    async create(vehicle: Partial<VisitaRecol>): Promise<VisitaRecol> {
        const response = await apiService.post<ApiResponse<VisitaRecol>>("/visitas", vehicle);
        return response.data;
    }

    async update(id: string, vehicle: Partial<VisitaRecol>): Promise<VisitaRecol> {
        const response = await apiService.put<ApiResponse<VisitaRecol>>(`/visitas/${id}`, vehicle);
        return response.data;
    }

    async getId(id: string): Promise<VisitaRecol> {
        const response = await apiService.get<ApiResponse<VisitaRecol>>(`/visitas/${id}`);
        return response.data;
    }

    async createCantidad(vehicle: Partial<VisitaCantidad>): Promise<VisitaCantidad> {
        const response = await apiService.post<ApiResponse<VisitaCantidad>>("/visitas/cantidades", vehicle);
        return response.data;
    }

    async updateCantidad(id: string, vehicle: Partial<VisitaCantidad>): Promise<VisitaCantidad> {
        const response = await apiService.put<ApiResponse<VisitaCantidad>>(`/visitas/cantidades/${id}`, vehicle);
        return response.data;
    }

    async getCantidades(): Promise<VisitaCantidad[]> {
        const response = await apiService.get<ApiResponse<VisitaCantidad[]>>(`/visitas/cantidades`);
        return response.data;
    }
}

export const visitService = new VisitService();
