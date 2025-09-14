"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Edit } from "lucide-react"
import { updateParticipantAction } from "@/lib/actions"
import { toast } from "sonner"
import type { Participant } from "@/lib/sheets"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Form validation schema
const EditParticipantSchema = z.object({
  "Nama Lengkap": z.string().min(1, "Nama lengkap harus diisi"),
  "Email": z.string().email("Format email tidak valid").min(1, "Email harus diisi"),
  "Nomor Telepon": z.string().min(1, "Nomor telepon harus diisi"),
  "Instansi": z.string().min(1, "Instansi harus diisi"),
  "Jabatan": z.string().min(1, "Jabatan harus diisi"),
})

type EditParticipantFormData = z.infer<typeof EditParticipantSchema>

interface EditParticipantModalProps {
  participant: Participant
  onSuccess?: () => void
}

export function EditParticipantModal({ participant, onSuccess }: EditParticipantModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<EditParticipantFormData>({
    resolver: zodResolver(EditParticipantSchema),
    defaultValues: {
      "Nama Lengkap": participant["Nama Lengkap"] || "",
      "Email": participant.Email || "",
      "Nomor Telepon": participant["Nomor Telepon"] || "",
      "Instansi": participant.Instansi || "",
      "Jabatan": participant.Jabatan || "",
    },
  })

  const onSubmit = (data: EditParticipantFormData) => {
    startTransition(async () => {
      try {
        // Create updated participant data
        const updatedParticipant: Participant = {
          ...participant,
          ...data,
        }

        const result = await updateParticipantAction(updatedParticipant)

        if (result.success) {
          toast.success(result.message)
          setIsOpen(false)
          form.reset()
          if (onSuccess) {
            onSuccess()
          }
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        console.error('Error updating participant:', error)
        toast.error("Gagal mengupdate data participant. Silakan coba lagi.")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-sm"
                title="Edit Data"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit data peserta</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Data Peserta</DialogTitle>
          <DialogDescription>
            Ubah informasi peserta di bawah ini. Klik simpan untuk menyimpan perubahan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                {...form.register("Nama Lengkap")}
                disabled={isPending}
              />
              {form.formState.errors["Nama Lengkap"] && (
                <p className="text-sm text-red-600">
                  {form.formState.errors["Nama Lengkap"].message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("Email")}
                disabled={isPending}
              />
              {form.formState.errors.Email && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.Email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                {...form.register("Nomor Telepon")}
                disabled={isPending}
              />
              {form.formState.errors["Nomor Telepon"] && (
                <p className="text-sm text-red-600">
                  {form.formState.errors["Nomor Telepon"].message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Instansi</Label>
              <Input
                id="institution"
                {...form.register("Instansi")}
                disabled={isPending}
              />
              {form.formState.errors.Instansi && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.Instansi.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Jabatan</Label>
              <Input
                id="position"
                {...form.register("Jabatan")}
                disabled={isPending}
              />
              {form.formState.errors.Jabatan && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.Jabatan.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
