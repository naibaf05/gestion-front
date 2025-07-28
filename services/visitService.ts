import { apiService } from "./api";
import type { ApiResponse, VisitaCantidad, VisitaRecol } from "@/types";

export class VisitService {
    async create(obj: Partial<VisitaRecol>): Promise<VisitaRecol> {
        const response = await apiService.post<ApiResponse<VisitaRecol>>("/visitas", obj);
        return response.data;
    }

    async update(id: string, obj: Partial<VisitaRecol>): Promise<VisitaRecol> {
        const response = await apiService.put<ApiResponse<VisitaRecol>>(`/visitas/${id}`, obj);
        return response.data;
    }

    async getId(id: string): Promise<VisitaRecol> {
        const response = await apiService.get<ApiResponse<VisitaRecol>>(`/visitas/${id}`);
        return response.data;
    }

    async createCantidad(obj: Partial<VisitaCantidad>): Promise<VisitaCantidad> {
        const response = await apiService.post<ApiResponse<VisitaCantidad>>("/visitas/cantidades", obj);
        return response.data;
    }

    async updateCantidad(id: string, obj: Partial<VisitaCantidad>): Promise<VisitaCantidad> {
        const response = await apiService.put<ApiResponse<VisitaCantidad>>(`/visitas/cantidades/${id}`, obj);
        return response.data;
    }

    async getCantidades(visitaRecolId: string): Promise<VisitaCantidad[]> {
        const response = await apiService.get<ApiResponse<VisitaCantidad[]>>(`/visitas/cantidades/${visitaRecolId}`);
        return response.data;
    }
}

export const visitService = new VisitService();
