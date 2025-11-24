"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/services/authService"

interface PasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    displayName?: string
    userId?: string
    clientId?: string
    onSuccess: () => void
}

export function PasswordDialog({
    open,
    onOpenChange,
    displayName,
    userId,
    clientId,
    onSuccess
}: PasswordDialogProps) {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleSave = async () => {
        // Validaciones
        if (!userId && !clientId) {
            toast({
                title: "Error",
                description: "Se requiere un userId o un clientId",
                variant: "destructive",
            })
            return
        }

        if (!newPassword.trim()) {
            toast({
                title: "Error",
                description: "La nueva contraseña es requerida",
                variant: "destructive",
            })
            return
        }

        if (newPassword.length < 6) {
            toast({
                title: "Error",
                description: "La contraseña debe tener al menos 6 caracteres",
                variant: "destructive",
            })
            return
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "Las contraseñas no coinciden",
                variant: "destructive",
            })
            return
        }

        try {
            setLoading(true)

            await authService.adminSetPassword(newPassword, { userId, clientId })

            toast({
                title: "Contraseña actualizada",
                description: `La contraseña de ${displayName ?? "la cuenta"} ha sido actualizada exitosamente`,
            })

            handleClose()
            onSuccess()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "No se pudo actualizar la contraseña",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setNewPassword("")
        setConfirmPassword("")
        setShowNewPassword(false)
        setShowConfirmPassword(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <p className="text-sm text-gray-600">
                        Cuenta: <span className="font-medium">{displayName ?? "Sin nombre"}</span>
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Ingresa la nueva contraseña"
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirma la nueva contraseña"
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-sm text-red-600">
                            Las contraseñas no coinciden
                        </p>
                    )}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || (!userId && !clientId)}
                        className="bg-primary hover:bg-primary-hover"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}