import { apiService } from "./api";
import type { ApiResponse, Vehicle } from "@/types";

export class VehicleService {
    async getVehicles(): Promise<Vehicle[]> {
        const response = await apiService.get<ApiResponse<Vehicle[]>>(`/vehicles`);

        response.data.forEach((element) => {
            if (element.datosJsonString && typeof element.datosJsonString === "string") {
                element.datosJson = JSON.parse(element.datosJsonString);
            }
        });
        return response.data;
    }

    async getVehiclesActivos(): Promise<Vehicle[]> {
        const response = await apiService.get<ApiResponse<Vehicle[]>>('/vehicles/activos')
        return response.data
      }

    async createVehicle(vehicle: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
        vehicle.datosJsonString = JSON.stringify(vehicle.datosJson);
        const response = await apiService.post<ApiResponse<Vehicle>>("/vehicles", vehicle);
        return response;
    }

    async updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
        vehicle.datosJsonString = JSON.stringify(vehicle.datosJson);
        const response = await apiService.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, vehicle);
        return response;
    }

    async toggleVehicleStatus(id: string): Promise<Vehicle> {
        const response = await apiService.patch<ApiResponse<Vehicle>>(`/vehicles/${id}/toggle-status`);
        return response.data;
    }
}

export const vehicleService = new VehicleService();
