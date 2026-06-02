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
        console.warn("reCAPTCHA no está listo todavía")
        return ""
      }
      return executeRecaptcha(action)
    },
    [executeRecaptcha]
  )

  return { getToken }
}
