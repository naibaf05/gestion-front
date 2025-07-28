import { apiService } from "./api";
import type { ApiResponse } from "@/types";

export class CertificatesService {
    async getCertificadoPDF(): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/pdf`);
        return response.data;
    }
}

export const certificatesService = new CertificatesService();
