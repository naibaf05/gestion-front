"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { certificatesService } from "@/services/certificatesService";

interface NotasDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    certificadoId: string;
    notasActuales: string;
    onSuccess: () => void;
}

export function NotasDialog({
    open,
    onOpenChange,
    certificadoId,
    notasActuales,
    onSuccess,
}: NotasDialogProps) {
    const [notas, setNotas] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setNotas(notasActuales || "");
        }
    }, [open, notasActuales]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await certificatesService.updateNotas(certificadoId, notas);
            toast({
                title: "Éxito",
                description: "Las notas se actualizaron correctamente",
                variant: "success",
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "No se pudieron actualizar las notas",
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Notas</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="notas">Notas</Label>
                        <Textarea
                            id="notas"
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            placeholder="Ingrese las notas del certificado..."
                            rows={6}
                            className="resize-none"
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
