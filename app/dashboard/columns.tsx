'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Participant } from '@/lib/sheets';
import { generateCertificatePdf, generateAndUploadCertificate } from '@/lib/actions';

// Function to handle PDF download
async function handleDownloadPdf(participant: Participant) {
  try {
    const result = await generateCertificatePdf(participant);
    
    if (result.success && result.pdfBuffer) {
      // Create blob and download
      const blob = new Blob([result.pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${participant['Nama Lengkap']?.replace(/\s+/g, '-') || 'participant'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert(`Gagal membuat PDF: ${result.message}`);
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Terjadi kesalahan saat mengunduh PDF. Coba lagi.');
  }
}

// Function to handle generate and upload certificate
async function handleGenerateAndUploadCertificate(participant: Participant) {
  try {
    const result = await generateAndUploadCertificate(participant);
    
    if (result.success) {
      alert(`✅ ${result.message}`);
      // Refresh the page to show updated data
      window.location.reload();
    } else {
      alert(`❌ ${result.message}`);
    }
  } catch (error) {
    console.error('Error generating and uploading certificate:', error);
    alert('Terjadi kesalahan saat membuat sertifikat. Coba lagi.');
  }
}

export const columns: ColumnDef<Participant>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'Nama Lengkap',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nama Lengkap
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue('Nama Lengkap') as string;
      return <div className="font-medium">{name || '-'}</div>;
    },
  },
  {
    accessorKey: 'Email',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const email = row.getValue('Email') as string;
      return <div className="text-sm">{email || '-'}</div>;
    },
  },
  {
    accessorKey: 'Nomor Telepon',
    header: 'Nomor Telepon',
    cell: ({ row }) => {
      const phone = row.getValue('Nomor Telepon') as string;
      return <div className="text-sm">{phone || '-'}</div>;
    },
  },
  {
    accessorKey: 'Instansi',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Instansi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const instansi = row.getValue('Instansi') as string;
      return <div className="text-sm">{instansi || '-'}</div>;
    },
  },
  {
    accessorKey: 'Jabatan',
    header: 'Jabatan',
    cell: ({ row }) => {
      const jabatan = row.getValue('Jabatan') as string;
      return <div className="text-sm">{jabatan || '-'}</div>;
    },
  },
  {
    accessorKey: 'Timestamp',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Waktu Kirim
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const timestamp = row.getValue('Timestamp') as string;
      return <div className="text-sm text-gray-500">{timestamp || '-'}</div>;
    },
  },
  {
    accessorKey: 'FolderId',
    header: 'Folder ID',
    cell: ({ row }) => {
      const folderId = row.getValue('FolderId') as string;
      return (
        <div className="text-sm font-mono">
          {folderId ? (
            <Badge variant="outline" className="text-xs">
              {folderId.substring(0, 8)}...
            </Badge>
          ) : (
            '-'
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'isShared',
    header: 'Dibagikan',
    cell: ({ row }) => {
      const isShared = row.getValue('isShared') as boolean;
      return (
        <Badge variant={isShared ? 'default' : 'secondary'}>
          {isShared ? 'Ya' : 'Tidak'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'isFolderExists',
    header: 'Folder Ada',
    cell: ({ row }) => {
      const isFolderExists = row.getValue('isFolderExists') as boolean;
      return (
        <Badge variant={isFolderExists ? 'default' : 'destructive'}>
          {isFolderExists ? 'Ya' : 'Tidak'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'isCertificateGenerated',
    header: 'Sertifikat',
    cell: ({ row }) => {
      const isCertificateGenerated = row.getValue('isCertificateGenerated') as boolean;
      const certificateLink = row.getValue('certificateLink') as string;
      
      if (isCertificateGenerated && certificateLink) {
        return (
          <div className="flex items-center gap-2">
            <Badge variant="default">Sudah Dibuat</Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(certificateLink, '_blank')}
                    title="Buka sertifikat di tab baru"
                  >
                    Lihat
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Buka sertifikat di tab baru</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      }
      
      return (
        <Badge variant="secondary">Belum Dibuat</Badge>
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const participant = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Aksi lainnya">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Aksi lainnya</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(participant.Email || '')}
            >
              Salin email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.open(`/certificate/${participant.rowIndex}/preview`, '_blank')}
            >
              Lihat pratinjau sertifikat
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDownloadPdf(participant)}
            >
              <Download className="mr-2 h-4 w-4" />
              Unduh PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleGenerateAndUploadCertificate(participant)}
              disabled={!participant.isFolderExists || !participant.FolderId}
            >
              Buat & Unggah Sertifikat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit data peserta</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
