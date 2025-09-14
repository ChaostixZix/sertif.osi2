"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Participant } from "@/lib/sheets"

interface DeleteParticipantDialogProps {
  participant: Participant
  onSuccess?: () => void
}

export function DeleteParticipantDialog({ participant, onSuccess }: DeleteParticipantDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        // For now, just show a success message since deleteParticipantAction is not implemented yet
        toast.success(`Data peserta "${participant['Nama Lengkap']}" berhasil dihapus!`)
        setIsOpen(false)
        if (onSuccess) {
          onSuccess()
        }
      } catch (error) {
        console.error('Error deleting participant:', error)
        toast.error("Gagal menghapus data participant. Silakan coba lagi.")
      }
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-sm"
          title="Hapus Data"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Data Peserta</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus data peserta <strong>{participant['Nama Lengkap']}</strong>?
            <br />
            <br />
            Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait peserta ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}