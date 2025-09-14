"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Share, Loader2 } from "lucide-react"
import { shareFolderWithParticipant } from "@/lib/actions"
import { toast } from "sonner"
import type { Participant } from "@/lib/sheets"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ShareFolderButtonProps {
  participant: Participant
  onSuccess?: (folderId: string) => void
  onRefresh?: () => void
}

export function ShareFolderButton({ participant, onSuccess, onRefresh }: ShareFolderButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleShareFolder = () => {
    startTransition(async () => {
      try {
        const result = await shareFolderWithParticipant(participant)
        
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
        console.error('Error sharing folder:', error)
        toast.error("Failed to share folder. Please try again.")
      }
    })
  }

  const canShare = participant.isFolderExists && !participant.isShared && participant.FolderId

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleShareFolder}
            disabled={isPending || !canShare}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-sm"
            title={
              !participant.isFolderExists 
                ? "No folder to share" 
                : participant.isShared 
                ? "Folder sudah dibagikan" 
                : "Bagikan Folder"
            }
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {!participant.isFolderExists
            ? 'Buat folder terlebih dahulu'
            : participant.isShared
            ? 'Folder sudah dibagikan'
            : 'Bagikan folder ke email peserta'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
