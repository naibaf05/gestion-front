"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authService } from "@/services/authService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useConfig } from "@/contexts/ConfigContext"

export default function ResetPasswordPageInner() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [token, setToken] = useState("")

  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { config } = useConfig()

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (tokenParam) {
      setToken(tokenParam)
      setIsValidToken(true) // En un caso real, aquí validarías el token con el backend
    } else {
      setIsValidToken(false)
    }
  }, [searchParams])

  const validatePassword = (password) => {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    }
  }

  const passwordValidation = validatePassword(password)
  const passwordsMatch = password === confirmPassword && confirmPassword !== ""

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!passwordValidation.isValid) {
      toast({
        title: "Contraseña inválida",
        description: "La contraseña no cumple con los requisitos de seguridad",
        variant: "destructive",
      })
      return
    }

    if (!passwordsMatch) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Por favor verifica que ambas contraseñas sean iguales",
        variant: "destructive",
      })
      return
    }

    if (!token) {
      toast({
        title: "Token inválido",
        description: "El enlace de restablecimiento no es válido",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await authService.resetPassword(token, password)
      setResetSuccess(true)
      toast({
        title: "Contraseña restablecida",
        description: "Tu contraseña ha sido restablecida exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo restablecer la contraseña. El enlace puede haber expirado.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Token inválido o no presente
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Enlace Inválido</CardTitle>
              <CardDescription>El enlace de restablecimiento no es válido o ha expirado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  El enlace que has usado no es válido o ha expirado. Por favor solicita un nuevo enlace de
                  restablecimiento.
                </p>
                <div className="space-y-2">
                  <Link href="/forgot-password">
                    <Button className="w-full bg-primary hover:bg-primary-hover">Solicitar Nuevo Enlace</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="w-full bg-transparent">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Inicio de Sesión
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Contraseña restablecida exitosamente
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Contraseña Restablecida</CardTitle>
              <CardDescription>Tu contraseña ha sido actualizada exitosamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                <Link href="/login">
                  <Button className="w-full bg-primary hover:bg-primary-hover">Iniciar Sesión</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Cargando validación del token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Validando enlace...</p>
        </div>
      </div>
    )
  }

  // Formulario de restablecimiento
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          {config?.logo && (
            <img className="mx-auto h-12 w-auto" src={config.logo || "/placeholder.svg"} alt={config.companyName} />
          )}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Restablecer Contraseña</h2>
          <p className="mt-2 text-sm text-gray-600">Ingresa tu nueva contraseña</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nueva Contraseña</CardTitle>
            <CardDescription>Crea una contraseña segura para tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu nueva contraseña"
                    className={!passwordValidation.isValid && password ? "border-red-300" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Indicadores de requisitos de contraseña */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs space-y-1">
                      <div
                        className={`flex items-center ${passwordValidation.minLength ? "text-green-600" : "text-red-600"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${passwordValidation.minLength ? "bg-green-600" : "bg-red-600"}`}
                        />
                        Mínimo 8 caracteres
                      </div>
                      <div
                        className={`flex items-center ${passwordValidation.hasUpperCase ? "text-green-600" : "text-red-600"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${passwordValidation.hasUpperCase ? "bg-green-600" : "bg-red-600"}`}
                        />
                        Al menos una mayúscula
                      </div>
                      <div
                        className={`flex items-center ${passwordValidation.hasLowerCase ? "text-green-600" : "text-red-600"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${passwordValidation.hasLowerCase ? "bg-green-600" : "bg-red-600"}`}
                        />
                        Al menos una minúscula
                      </div>
                      <div
                        className={`flex items-center ${passwordValidation.hasNumbers ? "text-green-600" : "text-red-600"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${passwordValidation.hasNumbers ? "bg-green-600" : "bg-red-600"}`}
                        />
                        Al menos un número
                      </div>
                      <div
                        className={`flex items-center ${passwordValidation.hasSpecialChar ? "text-green-600" : "text-red-600"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${passwordValidation.hasSpecialChar ? "bg-green-600" : "bg-red-600"}`}
                        />
                        Al menos un carácter especial
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    className={confirmPassword && !passwordsMatch ? "border-red-300" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {confirmPassword && !passwordsMatch && (
                  <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>
                )}

                {confirmPassword && passwordsMatch && (
                  <p className="mt-1 text-xs text-green-600">Las contraseñas coinciden</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover"
                disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restableciendo...
                  </>
                ) : (
                  "Restablecer Contraseña"
                )}
              </Button>

              <div className="text-center">
                <Link href="/login">
                  <Button variant="ghost" className="text-sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio de sesión
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}