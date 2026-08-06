import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Ações padrão de linha (editar / excluir) usadas em todas as listas.
 * A exclusão sempre passa por confirmação. Registros com histórico vinculado
 * são bloqueados no banco de dados, que devolve a mensagem explicativa.
 */
export function RowActions({
  onEdit,
  onDelete,
  deleting,
  label,
  description,
  hideEdit,
  hideDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  label?: string;
  description?: string;
  hideEdit?: boolean;
  hideDelete?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {!hideEdit && onEdit && (
        <Button variant="ghost" size="icon" aria-label="Editar" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
      )}
      {!hideDelete && onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{label ?? "Excluir registro?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {description ??
                  "Esta ação não pode ser desfeita. Se houver histórico vinculado, a exclusão será bloqueada e você poderá apenas inativar o registro."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting}
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
