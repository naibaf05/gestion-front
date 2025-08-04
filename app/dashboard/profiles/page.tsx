"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, PowerSquare, ListTodo } from "lucide-react"
import { userService } from "@/services/userService"
import type { Profile } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { ProfileDialog } from "@/components/dialogs/ProfileDialog"
import { PermsDialog } from "@/components/dialogs/PermsDialog"
import type { ColumnDef } from "@tanstack/react-table"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ButtonTooltip } from "@/components/ui/button-tooltip"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [permsDialogOpen, setPermsDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [profileToToggle, setProfileToToggle] = useState<string | null>(null)
  const { toast } = useToast()

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
    setDialogOpen(true)
  }

  const handleEdit = (profile: Profile) => {
    setSelectedProfile(profile)
    setDialogOpen(true)
  }

  const handlePerms = (profile: Profile) => {
    setSelectedProfile(profile)
    setPermsDialogOpen(true)
  }

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
        variant: "default",
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
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
    },
    {
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
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const prof = row.original
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(prof)} tooltipContent="Editar">
                <Edit className="h-4 w-4" />
              </ButtonTooltip>
              <ButtonTooltip variant="ghost" size="sm" onClick={() => handlePerms(prof)} tooltipContent="Permisos">
                <ListTodo className="h-4 w-4" />
              </ButtonTooltip>
              <ButtonTooltip variant="ghost" size="sm" onClick={() => handleToggleStatus(prof.id)}
                className={prof.activo ? "new-text-green-600" : "new-text-red-600"} tooltipContent="Cambiar estado">
                <PowerSquare className="h-4 w-4" />
              </ButtonTooltip>
            </div>
          </TooltipProvider>
        )
      },
    },
  ]

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
        <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Perfil
        </Button>
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
    </div>
  )
}