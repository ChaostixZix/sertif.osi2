import { getParticipantById } from '@/lib/sheets';

interface CertificatePreviewPageProps {
  params: {
    id: string;
  };
}

/**
 * Certificate Preview Page
 * Displays a preview of the certificate with participant data
 */
export default async function CertificatePreviewPage({ params }: CertificatePreviewPageProps) {
  const { id } = params;

  // Fetch participant data
  const { data: participant, error } = await getParticipantById(id);

  if (error || !participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Participant not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Certificate Preview */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Certificate Content */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 p-8 print:p-12">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-10 left-10 w-32 h-32 border-4 border-blue-300 rounded-full"></div>
              <div className="absolute top-20 right-20 w-24 h-24 border-4 border-indigo-300 rounded-full"></div>
              <div className="absolute bottom-20 left-20 w-28 h-28 border-4 border-purple-300 rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-20 h-20 border-4 border-blue-300 rounded-full"></div>
            </div>

            {/* Certificate Border */}
            <div className="relative border-4 border-gold-500 border-double p-8 print:p-12 bg-white">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-blue-800 mb-4 print:text-7xl">
                  SERTIFIKAT
                </div>
                <div className="text-2xl text-gray-700 mb-2 print:text-3xl">
                  Penyelesaian Program
                </div>
                <div className="text-xl text-gray-600 print:text-2xl">
                  Digital Marketing & E-Commerce
                </div>
              </div>

              {/* Main Content */}
              <div className="text-center mb-8">
                <div className="text-lg text-gray-700 mb-6 print:text-xl">
                  Diberikan kepada:
                </div>
                <div className="text-4xl font-bold text-blue-800 mb-8 print:text-5xl">
                  {participant['Nama Lengkap'] || 'Nama Peserta'}
                </div>
                <div className="text-lg text-gray-700 mb-4 print:text-xl">
                  Atas partisipasi dan penyelesaian program:
                </div>
                <div className="text-2xl font-semibold text-indigo-700 mb-6 print:text-3xl">
                  Digital Marketing & E-Commerce
                </div>
                <div className="text-lg text-gray-700 mb-4 print:text-xl">
                  Yang diselenggarakan pada:
                </div>
                <div className="text-xl font-semibold text-gray-800 print:text-2xl">
                  {participant['Timestamp'] ? new Date(participant['Timestamp']).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Tanggal Program'}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end mt-12 print:mt-16">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2 print:text-base">
                    Instansi
                  </div>
                  <div className="font-semibold text-gray-800 print:text-lg">
                    {participant['Instansi'] || 'Instansi Peserta'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2 print:text-base">
                    Jabatan
                  </div>
                  <div className="font-semibold text-gray-800 print:text-lg">
                    {participant['Jabatan'] || 'Jabatan Peserta'}
                  </div>
                </div>
              </div>

              {/* Signature Area */}
              <div className="text-center mt-16 print:mt-20">
                <div className="text-sm text-gray-600 mb-8 print:text-base">
                  Jakarta, {new Date().toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="inline-block">
                  <div className="text-sm text-gray-600 mb-2 print:text-base">
                    Direktur Program
                  </div>
                  <div className="font-bold text-gray-800 print:text-lg">
                    Dr. John Doe, M.M.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Button - Hidden in Print */}
        <div className="text-center mt-8 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-colors duration-200"
          >
            🖨️ Print Certificate
          </button>
        </div>
      </div>
    </div>
  );
}