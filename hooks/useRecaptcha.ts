"use client"

import { useCallback, useEffect, useRef } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"

const MAX_ESPERA_MS = 6000
const INTERVALO_MS = 250

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Hook que envuelve useGoogleReCaptcha y simplifica la ejecución del token.
 * Uso: const { getToken } = useRecaptcha()
 *       const token = await getToken("login")
 */
export function useRecaptcha() {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const executeRecaptchaRef = useRef(executeRecaptcha)

  useEffect(() => {
    executeRecaptchaRef.current = executeRecaptcha
  }, [executeRecaptcha])

  const getToken = useCallback(async (action: string): Promise<string> => {
    let esperado = 0

    // El script de reCAPTCHA puede tardar unos segundos en cargar, sobre todo
    // en la primera visita a una página pública (sin sesión previa).
    while (!executeRecaptchaRef.current && esperado < MAX_ESPERA_MS) {
      await esperar(INTERVALO_MS)
      esperado += INTERVALO_MS
    }

    if (!executeRecaptchaRef.current) {
      throw new Error("La verificación de seguridad no está lista. Por favor espera un momento e intenta de nuevo.")
    }

    const token = await executeRecaptchaRef.current(action)
    if (!token) {
      throw new Error("No se pudo obtener el token de verificación. Por favor intenta de nuevo.")
    }
    return token
  }, [])

  return { getToken }
}
