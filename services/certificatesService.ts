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

    async getCertificadoExternaPDF(salidaExternaId: string, numero: string, fecha: string, notas: string): Promise<string> {
        const response = await apiService.get<ApiResponse<string>>(`/certificado/externa?salidaExternaId=${salidaExternaId}&numero=${numero}&fecha=${fecha}&notas=${encodeURIComponent(notas || "")}`);
        return response.data;
    }

    async getCertificadoRecoleccionPDF(certId: string, clienteId: string, sedeId: string, inicio: string, fin: string, num: string, fecha: string, notas: string): Promise<string> {
        notas = notas.replaceAll('\n', '**');
        const response = await apiService.get<ApiResponse<string>>(`/certificado/recoleccion?certId=${certId}&clienteId=${clienteId}&sedeId=${sedeId}&inicio=${inicio}&fin=${fin}&num=${num}&fecha=${fecha}&notas=${notas}`);
        return response.data;
    }

    async getCertificadoRecoleccionLlantasPDF(certId: string, clienteId: string, sedeId: string, inicio: string, fin: string, num: string, fecha: string, notas: string): Promise<string> {
        notas = notas.replaceAll('\n', '**');
        const response = await apiService.get<ApiResponse<string>>(`/certificado/llantas?certId=${certId}&clienteId=${clienteId}&sedeId=${sedeId}&inicio=${inicio}&fin=${fin}&num=${num}&fecha=${fecha}&notas=${notas}`);
        return response.data;
    }

    async getCertificadoProformaPDF(clienteId: string, sedeId: string, inicio: string, fin: string, fecha: string, notas: string): Promise<string> {
        notas = notas.replaceAll('\n', '**');
        const response = await apiService.get<ApiResponse<string>>(`/certificado/proforma?clienteId=${clienteId}&sedeId=${sedeId}&inicio=${inicio}&fin=${fin}&fecha=${fecha}&notas=${notas}`);
        return response.data;
    }

    async getCertificadoProformaExcel(clienteId: string, sedeId: string, inicio: string, fin: string, fecha: string, notas: string): Promise<string> {
        notas = notas.replaceAll('\n', '**');
        const response = await apiService.get<ApiResponse<string>>(`/certificado/proforma/excel?clienteId=${clienteId}&sedeId=${sedeId}&inicio=${inicio}&fin=${fin}&fecha=${fecha}&notas=${notas}`);
        return response.data;
    }

    async getCertificadoProformaSalidaPDF(sedeId: string, plantaDestinoId: string, inicio: string, fin: string, fecha: string, notas: string): Promise<string> {
        notas = notas.replaceAll('\n', '**');
        const response = await apiService.get<ApiResponse<string>>(`/certificado/proforma-salida?sedeId=${sedeId}&plantaDestinoId=${plantaDestinoId}&inicio=${inicio}&fin=${fin}&fecha=${fecha}&notas=${notas}`);
        return response.data;
    }

    async getCertificadoProformaSalidaExcel(sedeId: string, plantaDestinoId: string, inicio: string, fin: string, fecha: string, notas: string): Promise<string> {
        notas = notas.replaceAll('\n', '**');
        const response = await apiService.get<ApiResponse<string>>(`/certificado/proforma-salida/excel?sedeId=${sedeId}&plantaDestinoId=${plantaDestinoId}&inicio=${inicio}&fin=${fin}&fecha=${fecha}&notas=${notas}`);
        return response.data;
    }

    // Certificados
    async getCertificados(tipo: string, inicio: string, fin: string): Promise<Certificados[]> {
        const response = await apiService.get<ApiResponse<Certificados[]>>(`/certificado/${tipo}/${inicio}/${fin}`);
        response.data.forEach(cert => {
            cert.numMostrar = String(cert.tipo) === "5" ? (cert.numExterno || "") : "CFG" + String(cert.num).padStart(5, '0');
        });
        return response.data;
    }

    async getCertificadosCliente(tipo: string, clienteId: string, inicio: string, fin: string): Promise<Certificados[]> {
        const response = await apiService.get<ApiResponse<Certificados[]>>(`/certificado/cliente/${tipo}/${clienteId}/${inicio}/${fin}`);
        response.data.forEach(cert => {
            cert.numMostrar = String(cert.tipo) === "5" ? (cert.numExterno || "") : "CFG" + String(cert.num).padStart(5, '0');
        });
        return response.data;
    }

    async createCertificado(data: Partial<Certificados>): Promise<Certificados> {
        const response = await apiService.post<ApiResponse<Certificados>>('/certificado', data);
        return response.data;
    }

    async crearCertificadosExternosMasivo(ids: string[], numero: string, fecha: string, archivo: File): Promise<number> {
        const formData = new FormData();
        ids.forEach(id => formData.append('ids', id));
        formData.append('numero', numero);
        formData.append('fecha', fecha);
        formData.append('archivo', archivo);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/certificado/externas-masivo`, {
            method: 'POST',
            headers: { ...(typeof window !== 'undefined' && localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
            body: formData,
        });
        if (!response.ok) throw new Error((await response.json())?.message || "No se pudieron crear los certificados");
        const result = await response.json();
        return result.data;
    }

    async updateCertificado(id: string, data: Partial<Certificados>): Promise<Certificados> {
        const response = await apiService.put<ApiResponse<Certificados>>(`/certificado/${id}`, data);
        return response.data;
    }

    async toggleStatus(id: string): Promise<void> {
        await apiService.patch(`/certificado/${id}/toggle-status`);
    }

    async updateNotas(id: string, notas: string): Promise<Certificados> {
        const response = await apiService.patch<ApiResponse<Certificados>>(`/certificado/${id}/notas`, { notas });
        return response.data;
    }

    async getVisitasZip(sedeIds: string[], inicio: string, fin: string): Promise<string> {
        const response = await apiService.post<ApiResponse<string>>(
            `/certificado/visitas-zip?inicio=${inicio}&fin=${fin}`,
            sedeIds.map(id => Number(id))
        );
        return response.data;
    }

    async getCertificadosZip(certIds: string[]): Promise<string> {
        const response = await apiService.post<ApiResponse<string>>(
            `/certificado/certificados-zip`,
            certIds.map(id => Number(id))
        );
        return response.data;
    }

    async getCertificadosZipByFiltro(tipo: string, inicio: string, fin: string, sedeIds: string[]): Promise<string> {
        const response = await apiService.post<ApiResponse<string>>(
            `/certificado/certificados-zip-filtro?tipo=${tipo}&inicio=${inicio}&fin=${fin}`,
            sedeIds.map(id => Number(id))
        );
        return response.data;
    }
}

export const certificatesService = new CertificatesService();
