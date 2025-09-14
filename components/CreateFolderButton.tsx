"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Folder, Loader2 } from "lucide-react"
import { createParticipantFolder } from "@/lib/actions"
import { toast } from "sonner"
import type { Participant } from "@/lib/sheets"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CreateFolderButtonProps {
  participant: Participant
  onSuccess?: (folderId: string) => void
  onRefresh?: () => void
}

export function CreateFolderButton({ participant, onSuccess, onRefresh }: CreateFolderButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleCreateFolder = () => {
    startTransition(async () => {
      try {
        const result = await createParticipantFolder(participant)
        
        if (result.success) {
          toast.success(result.message)
          if (result.folderId && onSuccess) {
            onSuccess(result.folderId)
          }
          if (onRefresh) {
            onRefresh()
          }
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        console.error('Error creating folder:', error)
        toast.error("Failed to create folder. Please try again.")
      }
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCreateFolder}
            disabled={isPending || participant.isFolderExists}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-sm"
            title={participant.isFolderExists ? "Folder sudah dibuat" : "Buat Folder"}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Folder className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {participant.isFolderExists ? 'Folder sudah dibuat' : 'Buat folder di Google Drive'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
