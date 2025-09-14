'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, Info, Search as SearchIcon, Download, FilePlus2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import type { Participant } from '@/lib/sheets';
import { generateAndUploadCertificate, generateCertificatePdf } from '@/lib/actions';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pageSize, setPageSize] = React.useState(10);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const [isBulkProcessing, setIsBulkProcessing] = React.useState(false);

  async function handleBulkDownload() {
    try {
      setIsBulkProcessing(true);
      const selected = table.getSelectedRowModel().rows.map((r) => r.original as unknown as Participant);
      if (!selected.length) return;

      for (const participant of selected) {
        const result = await generateCertificatePdf(participant);
        if (result.success && result.pdfBuffer) {
          const blob = new Blob([result.pdfBuffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const safeName = (participant['Nama Lengkap'] || 'participant').toString().replace(/\s+/g, '-');
          link.download = `certificate-${safeName}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          toast.error(`Gagal membuat PDF untuk ${participant['Nama Lengkap'] || 'Peserta'}`);
        }
      }
      toast.success(`Unduhan PDF selesai untuk ${selected.length} peserta`);
    } catch (e) {
      toast.error('Terjadi kesalahan saat unduh massal');
    } finally {
      setIsBulkProcessing(false);
    }
  }

  async function handleBulkGenerate() {
    try {
      setIsBulkProcessing(true);
      const selected = table.getSelectedRowModel().rows.map((r) => r.original as unknown as Participant);
      if (!selected.length) return;

      for (const participant of selected) {
        if (!participant.isFolderExists || !participant.FolderId) {
          toast.info(`Lewati: belum ada folder untuk ${participant['Nama Lengkap'] || 'Peserta'}`);
          continue;
        }
        const result = await generateAndUploadCertificate(participant);
        if (result.success) {
          toast.success(`Sertifikat diunggah: ${participant['Nama Lengkap'] || 'Peserta'}`);
        } else {
          toast.error(result.message);
        }
      }
      // Opsional: refresh untuk memuat status terbaru
      // window.location.reload();
    } catch (e) {
      toast.error('Terjadi kesalahan saat generate massal');
    } finally {
      setIsBulkProcessing(false);
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 py-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari peserta (nama, email, instansi)"
              aria-label="Cari peserta"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-10 w-[320px]"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Kolom <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              setGlobalFilter('');
              setColumnFilters([]);
            }}
            disabled={!globalFilter && columnFilters.length === 0}
            title="Bersihkan pencarian dan filter"
          >
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>
            Tips: Ketik sebagian nama atau email untuk cepat menemukan peserta.
          </span>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="[&>tr:nth-child(odd)]:bg-muted/30">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-36 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-muted p-2">
                      <SearchIcon className="h-4 w-4" />
                    </div>
                    <div className="text-sm">Tidak ada hasil yang cocok</div>
                    <div className="text-xs">Coba ubah kata kunci atau bersihkan filter.</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-3 mb-2 rounded-md border bg-muted/50">
          <div className="text-sm font-medium">
            {table.getFilteredSelectedRowModel().rows.length} baris dipilih
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={handleBulkDownload} disabled={isBulkProcessing}>
                    <Download className="mr-2 h-4 w-4" />
                    Unduh PDF
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Unduh PDF untuk semua yang dipilih</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" onClick={handleBulkGenerate} disabled={isBulkProcessing}>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Buat & Unggah
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Buat dan unggah sertifikat ke Drive</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            Dipilih {table.getFilteredSelectedRowModel().rows.length} dari {table.getFilteredRowModel().rows.length} baris.
          </span>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <span>Baris per halaman</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[84px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Sebelumnya"
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Berikutnya"
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
