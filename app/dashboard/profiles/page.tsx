"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, PowerSquare, ListTodo, Eye, History } from "lucide-react"
import { userService } from "@/services/userService"
import type { Profile } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { ProfileDialog } from "@/components/dialogs/ProfileDialog"
import { PermsDialog } from "@/components/dialogs/PermsDialog"
import type { ColumnDef } from "@tanstack/react-table"
import { ButtonTooltip } from "@/components/ui/button-tooltip"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useAuth } from "@/contexts/AuthContext"
import { HistorialDialog } from "@/components/dialogs/HistorialDialog"

export default function UsersPage() {
  const { user, logout } = useAuth();

  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialId, setHistorialId] = useState<string>("");
  const [historialLabel, setHistorialLabel] = useState<string>("");

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [permsDialogOpen, setPermsDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [dialogReadOnly, setDialogReadOnly] = useState(false)
  const [profileToToggle, setProfileToToggle] = useState<string | null>(null)
  const { toast } = useToast()

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

  const loadData = async () => {
    try {
      setLoading(true)
      const [profilesData] = await Promise.all([
        userService.getProfilesTable()
      ])
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
    setSelectedProfile(null)
    setDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleEdit = (profile: Profile) => {
    setSelectedProfile(profile)
    setDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleView = (profile: Profile) => {
    setSelectedProfile(profile)
    setDialogReadOnly(true)
    setDialogOpen(true)
  }

  const handlePerms = (profile: Profile) => {
    setSelectedProfile(profile)
    setPermsDialogOpen(true)
  }

  const handleHistorial = (id: string, nombre: string) => {
    setHistorialId(id);
    setHistorialLabel(`Perfil [${nombre}]`);
    setHistorialOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    setProfileToToggle(id)
    setConfirmDialogOpen(true)
  }

  const confirmToggleStatus = async () => {
    if (!profileToToggle) return

    try {
      await userService.togglRolesStatus(profileToToggle)
      toast({
        title: "Estado actualizado",
        description: "El estado del perfil ha sido actualizado exitosamente",
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
      setProfileToToggle(null)
    }
  }

  const cancelToggleStatus = () => {
    setProfileToToggle(null)
  }

  const columns: ColumnDef<Profile>[] = [
    {
      width: "150px",
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      width: "400px",
      accessorKey: "descripcion",
      header: "Descripción",
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
        const prof = row.original
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {hasPermission("profiles.edit") ?
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(prof)} tooltipContent="Editar">
                    <Edit className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleToggleStatus(prof.id)}
                    className={prof.activo ? "new-text-green-600" : "new-text-red-600"} tooltipContent="Cambiar estado">
                    <PowerSquare className="h-4 w-4" />
                  </ButtonTooltip>
                </>
                :
                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleView(prof)} tooltipContent="Ver">
                  <Eye className="h-4 w-4" />
                </ButtonTooltip>
              }
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
                  {hasPermission("profiles.permissions") && (
                    <DropdownMenuItem onClick={() => handlePerms(prof)} className="text-blue-600">
                      <ListTodo className="h-4 w-4" />
                      Permisos
                    </DropdownMenuItem>
                  )}
                  {hasPermission("users.historial") && (
                    <DropdownMenuItem onClick={() => handleHistorial(prof.id, prof.nombre)}>
                      <History className="h-4 w-4" />
                      Historial
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>
        )
      },
    },
  ]

  if (!hasPermission("profiles.view")) {
    return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver perfiles.</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando perfiles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Perfiles</h1>
          <p className="text-gray-600">Gestiona los perfiles del sistema</p>
        </div>
        {hasPermission("profiles.edit") && (
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Perfil
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <DataTable columns={columns} data={profiles} searchKey="nombre" searchPlaceholder="Buscar por nombre..." />
        </CardContent>
      </Card>

      <ProfileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={selectedProfile}
        onSuccess={loadData}
        readOnly={dialogReadOnly}
      />

      {selectedProfile && (
        <PermsDialog
          open={permsDialogOpen}
          onOpenChange={setPermsDialogOpen}
          profile={selectedProfile}
          onSuccess={loadData}
        />
      )}

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Cambiar estado del perfil"
        description="¿Estás seguro de que deseas cambiar el estado de este perfil? Esta acción afectará a todos los usuarios asociados."
        confirmText="Cambiar Estado"
        cancelText="Cancelar"
        onConfirm={confirmToggleStatus}
        onCancel={cancelToggleStatus}
        variant="default"
      />

      <HistorialDialog
        open={historialOpen}
        onOpenChange={setHistorialOpen}
        tipo="Rol"
        id={historialId}
        label={historialLabel}
      />
    </div>
  )
}