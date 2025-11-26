"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Eye, PowerSquare, History, Key } from "lucide-react"
import { userService } from "@/services/userService"
import type { User, Profile } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { UserDialog } from "@/components/dialogs/UserDialog"
import { HistorialDialog } from "@/components/dialogs/HistorialDialog"
import { ButtonTooltip } from "@/components/ui/button-tooltip"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table"
import { useAuth } from "@/contexts/AuthContext"
import { PasswordDialog } from "@/components/dialogs/PasswordDialog"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function UsersPage() {
  const { user, logout } = useAuth();

  const [users, setUsers] = useState<User[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogReadOnly, setDialogReadOnly] = useState(false)
  const [historialOpen, setHistorialOpen] = useState(false)
  const [historialId, setHistorialId] = useState<string>("")
  const [historialLabel, setHistorialLabel] = useState<string>("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [userToToggle, setUserToToggle] = useState<string | null>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos);
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false
    if (user.perfil?.nombre === "ADMIN") return true
    return user.permisos[permission] === true
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create' && profiles.length > 0) {
      handleCreate()
      window.history.replaceState({}, '', '/dashboard/users')
    }
  }, [searchParams, profiles])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, profilesData] = await Promise.all([
        userService.getUsers(),
        userService.getProfiles()
      ])
      setUsers(usersData)
      setProfiles(profilesData)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleEdit = (employee: User) => {
    setSelectedUser(employee)
    setDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleView = (employee: User) => {
    setSelectedUser(employee)
    setDialogReadOnly(true)
    setDialogOpen(true)
  }

  const handleToggleStatus = (id: string) => {
    setUserToToggle(id)
    setConfirmDialogOpen(true)
  }

  const confirmToggleStatus = async () => {
    if (!userToToggle) return
    try {
      await userService.toggleUserStatus(userToToggle)
      toast({
        title: "Estado actualizado",
        description: "El estado del usuario ha sido actualizado",
        variant: "success",
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setUserToToggle(null)
      setConfirmDialogOpen(false)
    }
  }

  const cancelToggleStatus = () => {
    setUserToToggle(null)
    setConfirmDialogOpen(false)
  }

  const handleHistorial = (id: string, nombre: string, apellido: string) => {
    setHistorialId(id)
    setHistorialLabel(`Usuario [${nombre} ${apellido}]`)
    setHistorialOpen(true)
  }

  const handleChangePassword = (user: User) => {
    setSelectedUser(user)
    setPasswordDialogOpen(true)
  }

  const columns: ColumnDef<User>[] = [
    {
      width: "200px",
      accessorKey: "nombreCompleto",
      header: "Nombre",
    },
    {
      width: "120px",
      accessorKey: "documento",
      header: "Documento",
    },
    {
      width: "250px",
      accessorKey: "email",
      header: "Email",
    },
    {
      width: "120px",
      accessorKey: "telefono",
      header: "Teléfono",
    },
    {
      width: "200px",
      accessorKey: "nombrePerfiles",
      header: "Perfil",
    },
    {
      width: "100px",
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => {
        return (
          <Badge variant={row.getValue("activo") ? "default" : "secondary"}>
            {row.getValue("activo") ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    {
      width: "180px",
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const employee = row.original
        const canEdit = hasPermission("users.edit")
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {canEdit ? (
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(employee)} tooltipContent="Editar">
                    <Edit className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleToggleStatus(employee.id)}
                    className={employee.activo ? "new-text-green-600" : "new-text-red-600"}
                    tooltipContent={employee.activo ? "Desactivar" : "Activar"}
                  >
                    <PowerSquare className="h-4 w-4" />
                  </ButtonTooltip>
                  <DropdownMenu>
                    <Tooltip>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <span className="sr-only">Más acciones</span>
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <circle cx="5" cy="12" r="2" fill="currentColor" />
                            <circle cx="12" cy="12" r="2" fill="currentColor" />
                            <circle cx="19" cy="12" r="2" fill="currentColor" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <TooltipContent>Más acciones</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleChangePassword(employee)} className="text-blue-600">
                        <Key className="h-4 w-4" />
                        Cambiar Contraseña
                      </DropdownMenuItem>
                      {hasPermission("users.historial") && (
                        <DropdownMenuItem onClick={() => handleHistorial(employee.id, employee.nombre, employee.apellido)}>
                          <History className="h-4 w-4" />
                          Historial
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleView(employee)} tooltipContent="Ver">
                    <Eye className="h-4 w-4" />
                  </ButtonTooltip>
                  {hasPermission("users.historial") && (
                    <ButtonTooltip variant="ghost" size="sm" onClick={() => handleHistorial(employee.id, employee.nombre, employee.apellido)} tooltipContent="Historial">
                      <History className="h-4 w-4" />
                    </ButtonTooltip>
                  )}
                </>
              )}
            </div>
          </TooltipProvider>
        )
      },
    },
  ]

  if (!hasPermission("users.view")) {
    return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver usuarios.</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">Gestiona los usuarios del sistema</p>
        </div>
        {hasPermission("users.edit") && (
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <DataTable columns={columns} data={users} searchKey="nombre" searchPlaceholder="Buscar por nombre..." />
        </CardContent>
      </Card>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        profiles={profiles}
        onSuccess={loadData}
        readOnly={dialogReadOnly}
      />

      <HistorialDialog
        open={historialOpen}
        onOpenChange={setHistorialOpen}
        tipo="Usuario"
        id={historialId}
        label={historialLabel}
      />

      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        displayName={selectedUser?.nombre || ""}
        userId={selectedUser?.id || ""}
        onSuccess={loadData}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Cambiar estado del usuario"
        description="¿Estás seguro de que deseas cambiar el estado de este usuario?"
        confirmText="Cambiar Estado"
        cancelText="Cancelar"
        onConfirm={confirmToggleStatus}
        onCancel={cancelToggleStatus}
        variant="default"
      />
    </div>
  )
}