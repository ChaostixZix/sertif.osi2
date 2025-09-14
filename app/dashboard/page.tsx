import { getParticipants } from '@/lib/sheets';
import { DataTable } from './data-table';
import { columns } from './columns';

/**
 * Dashboard Page - Server Component
 * Fetches participant data from Google Sheets and displays it in a data table
 */
export default async function DashboardPage() {
  // Fetch initial data from Google Sheets
  const { data: participants, error } = await getParticipants();

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-2">Gagal Memuat Data</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Sertifikat</h1>
        <p className="text-gray-600">
          Kelola data peserta dan proses pembuatan sertifikat dengan cepat dan mudah.
        </p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Data Peserta ({participants?.length || 0})
            </h2>
            <p className="text-sm text-gray-500">
              Menampilkan data peserta dari Google Sheets. Gunakan kolom pencarian dan menu Kolom untuk menyesuaikan tampilan.
            </p>
          </div>
          
          {participants && participants.length > 0 ? (
            <DataTable columns={columns} data={participants} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Belum ada data peserta</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
