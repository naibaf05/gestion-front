import type { ApiResponse, PublicValidationResult } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

async function publicGet(endpoint: string, recaptchaToken: string): Promise<ApiResponse<PublicValidationResult>> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-Recaptcha-Token": recaptchaToken,
        },
    });

    const json = await response.json();

    if (!response.ok) {
        throw json;
    }

    return json;
}

export const publicValidationService = {
    getCertificado(numero: string, recaptchaToken: string): Promise<ApiResponse<PublicValidationResult>> {
        return publicGet(`/public/validacion/certificado?numero=${encodeURIComponent(numero)}`, recaptchaToken);
    },
    getRemision(numero: string, recaptchaToken: string): Promise<ApiResponse<PublicValidationResult>> {
        return publicGet(`/public/validacion/remision?numero=${encodeURIComponent(numero)}`, recaptchaToken);
    },
};
