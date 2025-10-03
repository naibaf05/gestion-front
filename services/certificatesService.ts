import { apiService } from "./api";
import type { ApiResponse, Certificados } from "@/types";

export class CertificatesService {
    // PDFs existentes
    async getCertificadoPDF(): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/pdf`);
        return response.data;
    }

    async getCertificadoRecoleccionPDF(sedeId: string, inicio: string, fin: string, num: string, fecha: string): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/recoleccion?sedeId=${sedeId}&inicio=${inicio}&fin=${fin}&num=${num}&fecha=${fecha}`);
        return response.data;
    }

    async getCertificadoProformaPDF(sedeId: string, inicio: string, fin: string, fecha: string, notas: string): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/proforma?sedeId=${sedeId}&inicio=${inicio}&fin=${fin}&fecha=${fecha}&notas=${notas}`);
        return response.data;
    }

    // Certificados
    async getCertificados(tipo: string): Promise<Certificados[]> {
        const response = await apiService.get<ApiResponse<Certificados[]>>(`/certificado/${tipo}`);
        return response.data;
    }

    async getCertificadosCliente(tipo: string, clienteId: string): Promise<Certificados[]> {
        const response = await apiService.get<ApiResponse<Certificados[]>>(`/certificado/cliente/${tipo}/${clienteId}`);
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
