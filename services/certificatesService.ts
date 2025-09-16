import { apiService } from "./api";
import type { ApiResponse, Certificados } from "@/types";

export class CertificatesService {
    // PDFs existentes
    async getCertificadoPDF(): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/pdf`);
        return response.data;
    }

    async getCertificadoRecoleccionPDF(): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/recoleccion`);
        return response.data;
    }

    // Certificados de Llantas
    async getCertificados(tipo: string): Promise<Certificados[]> {
        const response = await apiService.get<ApiResponse<Certificados[]>>(`/certificado/${tipo}`);
        return response.data;
    }

    async createCertificado(data: Partial<Certificados>): Promise<Certificados> {
        const response = await apiService.post<ApiResponse<Certificados>>('/certificado', data);
        return response.data;
    }

    async toggleStatus(id: string): Promise<void> {
        await apiService.patch(`/certificado/${id}/toggle-status`);
    }
}

export const certificatesService = new CertificatesService();
