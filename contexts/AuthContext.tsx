"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, LoginCredentials } from "@/types"
import { authService } from "@/services/authService"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  availableRoles: User["roles"] | null
  chooseRole: (roleId: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [availableRoles, setAvailableRoles] = useState<User["roles"] | null>(null)
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        const currentUser = await authService.getCurrentUser()
        const u = currentUser.user
        const roles = Array.isArray(u?.roles) ? u.roles : null
        if (roles && roles.length > 0) {
          roles.forEach((r: any) => {
            if (r.permisos && typeof r.permisos === "string") {
              try { r.permisos = JSON.parse(r.permisos) } catch { }
            }
          })
          const selectedRoleId = localStorage.getItem("selectedRoleId")
          const role = roles.find(r => String(r.id) === String(selectedRoleId)) || roles[0]
          const newUser: User = { ...u, perfil: role, permisos: role.permisos }
          setUser(newUser)
        } else {
          setUser(u)
        }
      }
    } catch (error) {
      localStorage.removeItem("token")
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true)
      const response = await authService.login(credentials)
      const u = response.user
      // Si llegan roles múltiples, permitir selección
      const roles = Array.isArray(u?.roles) ? u.roles : null
      if (roles && roles.length > 0) {
        // Parsear permisos si llegan como string
        roles.forEach((r: any) => {
          if (r.permisos && typeof r.permisos === "string") {
            try { r.permisos = JSON.parse(r.permisos) } catch { }
          }
        })

        if (roles.length === 1) {
          const role = roles[0]
          const newUser: User = { ...u, perfil: role, permisos: role.permisos }
          setUser(newUser)
          try { localStorage.setItem("selectedRoleId", String(role.id)) } catch { }
          toast({
            title: "Inicio de sesión exitoso",
            description: `Bienvenido, ${u.nombre} ${u.apellido}`,
          })
          router.push("/dashboard")
        } else {
          // Guardar usuario pendiente y lista de roles para que UI seleccione
          setPendingUser(u)
          setAvailableRoles(roles)
          toast({
            title: "Selecciona un perfil",
            description: "Tu cuenta tiene múltiples perfiles; elige uno para continuar",
          })
        }
      } else {
        // Sin roles (compatibilidad): continuar como antes
        setUser(u)
        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido, ${u.nombre} ${u.apellido}`,
        })
        router.push("/dashboard")
      }
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: "Credenciales inválidas",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const chooseRole = (roleId: string) => {
    if (!pendingUser || !availableRoles) return
    const role = availableRoles.find(r => String(r.id) === String(roleId))
    if (!role) return
    const newUser: User = { ...pendingUser, perfil: role, permisos: role.permisos }
    setUser(newUser)
    setPendingUser(null)
    setAvailableRoles(null)
    try { localStorage.setItem("selectedRoleId", String(role.id)) } catch { }
    router.push("/dashboard")
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error("Error during logout: ", error)
    } finally {
      setUser(null)
      router.push("/login")
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    availableRoles,
    chooseRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
