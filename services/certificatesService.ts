import { apiService } from "./api";
import type { ApiResponse, Certificados } from "@/types";

export class CertificatesService {
    // PDFs existentes
    async getCertificadoPDF(): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/pdf`);
        return response.data;
    }

    async getCertificadoVisitaPDF(visitaId: string): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/visita?visitaId=${visitaId}`);
        return response.data;
    }

    async getCertificadoSalidaPDF(id: string): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/salida?id=${id}`);
        return response.data;
    }

    async getCertificadoRecoleccionPDF(certId: string, clienteId: string, sedeId: string, inicio: string, fin: string, num: string, fecha: string): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/recoleccion?certId=${certId}&clienteId=${clienteId}&sedeId=${sedeId}&inicio=${inicio}&fin=${fin}&num=${num}&fecha=${fecha}`);
        return response.data;
    }

    async getCertificadoRecoleccionLlantasPDF(certId: string, clienteId: string, sedeId: string, inicio: string, fin: string, num: string, fecha: string): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/llantas?certId=${certId}&clienteId=${clienteId}&sedeId=${sedeId}&inicio=${inicio}&fin=${fin}&num=${num}&fecha=${fecha}`);
        return response.data;
    }

    async getCertificadoProformaPDF(clienteId: string, sedeId: string, inicio: string, fin: string, fecha: string, notas: string): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/proforma?clienteId=${clienteId}&sedeId=${sedeId}&inicio=${inicio}&fin=${fin}&fecha=${fecha}&notas=${notas}`);
        return response.data;
    }

    async getCertificadoProformaExcel(clienteId: string, sedeId: string, inicio: string, fin: string, fecha: string, notas: string): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/proforma/excel?clienteId=${clienteId}&sedeId=${sedeId}&inicio=${inicio}&fin=${fin}&fecha=${fecha}&notas=${notas}`);
        return response.data;
    }

    // Certificados
    async getCertificados(tipo: string): Promise<Certificados[]> {
        const response = await apiService.get<ApiResponse<Certificados[]>>(`/certificado/${tipo}`);
        response.data.forEach(cert => {
            cert.numMostrar = "CFG" + String(cert.num).padStart(5, '0');
        });
        return response.data;
    }

    async getCertificadosCliente(tipo: string, clienteId: string): Promise<Certificados[]> {
        const response = await apiService.get<ApiResponse<Certificados[]>>(`/certificado/cliente/${tipo}/${clienteId}`);
        response.data.forEach(cert => {
            cert.numMostrar = "CFG" + String(cert.num).padStart(5, '0');
        });
        return response.data;
    }

    async createCertificado(data: Partial<Certificados>): Promise<Certificados> {
        const response = await apiService.post<ApiResponse<Certificados>>('/certificado', data);
        return response.data;
    }

    async updateCertificado(id: string, data: Partial<Certificados>): Promise<Certificados> {
        const response = await apiService.put<ApiResponse<Certificados>>(`/certificado/${id}`, data);
        return response.data;
    }

    async toggleStatus(id: string): Promise<void> {
        await apiService.patch(`/certificado/${id}/toggle-status`);
    }
}

export const certificatesService = new CertificatesService();
