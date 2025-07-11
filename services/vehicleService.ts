import { apiService } from "./api";
import type { ApiResponse, PaginatedResponse, Vehicle } from "@/types";

export class VehicleService {
    async getVehicles(page = 1, limit = 100): Promise<PaginatedResponse<Vehicle>> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        const response = await apiService.get<ApiResponse<PaginatedResponse<Vehicle>>>(`/vehicles?${params}`);
        return response.data;
    }

    async createVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
        const response = await apiService.post<ApiResponse<Vehicle>>("/vehicles", vehicle);
        return response.data;
    }

    async updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
        const response = await apiService.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, vehicle);
        return response.data;
    }

    async toggleVehicleStatus(id: string): Promise<Vehicle> {
        const response = await apiService.patch<ApiResponse<Vehicle>>(`/vehicles/${id}/toggle-status`);
        return response.data;
    }
}

export const vehicleService = new VehicleService();
