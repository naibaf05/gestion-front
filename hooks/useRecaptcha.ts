"use client"

import { useCallback } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"

/**
 * Hook que envuelve useGoogleReCaptcha y simplifica la ejecución del token.
 * Uso: const { getToken } = useRecaptcha()
 *       const token = await getToken("login")
 */
export function useRecaptcha() {
  const { executeRecaptcha } = useGoogleReCaptcha()

  const getToken = useCallback(
    async (action: string): Promise<string> => {
      if (!executeRecaptcha) {
        throw new Error("La verificación de seguridad no está lista. Por favor espera un momento e intenta de nuevo.")
      }
      const token = await executeRecaptcha(action)
      if (!token) {
        throw new Error("No se pudo obtener el token de verificación. Por favor intenta de nuevo.")
      }
      return token
    },
    [executeRecaptcha]
  )

  return { getToken }
}
