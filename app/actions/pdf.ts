'use server'

import { Participant } from '@/lib/sheets';

/**
 * Server action to render certificate HTML
 * This creates HTML string manually without JSX to avoid Next.js restrictions
 */
export async function renderCertificateHTML(participantData: Participant): Promise<string> {
  const participantName = participantData['Nama Lengkap'] || 'Nama Peserta';
  const timestamp = participantData['Timestamp'] ? new Date(participantData['Timestamp']).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Tanggal Program';
  const instansi = participantData['Instansi'] || 'Instansi Peserta';
  const jabatan = participantData['Jabatan'] || 'Jabatan Peserta';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate - ${participantName}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          body { margin: 0; }
          .print\\:p-12 { padding: 3rem !important; }
          .print\\:text-7xl { font-size: 4.5rem !important; }
          .print\\:text-3xl { font-size: 1.875rem !important; }
          .print\\:text-2xl { font-size: 1.5rem !important; }
          .print\\:text-xl { font-size: 1.25rem !important; }
          .print\\:text-lg { font-size: 1.125rem !important; }
          .print\\:text-base { font-size: 1rem !important; }
          .print\\:text-5xl { font-size: 3rem !important; }
          .print\\:mt-16 { margin-top: 4rem !important; }
          .print\\:mt-20 { margin-top: 5rem !important; }
          .print\\:hidden { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-4xl mx-auto px-4">
          <!-- Certificate Preview -->
          <div class="bg-white shadow-lg rounded-lg overflow-hidden">
            <!-- Certificate Content -->
            <div class="relative bg-gradient-to-br from-blue-50 to-indigo-100 p-8 print:p-12">
              <!-- Background Pattern -->
              <div class="absolute inset-0 opacity-5">
                <div class="absolute top-10 left-10 w-32 h-32 border-4 border-blue-300 rounded-full"></div>
                <div class="absolute top-20 right-20 w-24 h-24 border-4 border-indigo-300 rounded-full"></div>
                <div class="absolute bottom-20 left-20 w-28 h-28 border-4 border-purple-300 rounded-full"></div>
                <div class="absolute bottom-10 right-10 w-20 h-20 border-4 border-blue-300 rounded-full"></div>
              </div>

              <!-- Certificate Border -->
              <div class="relative border-4 border-gold-500 border-double p-8 print:p-12 bg-white">
                <!-- Header -->
                <div class="text-center mb-8">
                  <div class="text-6xl font-bold text-blue-800 mb-4 print:text-7xl">
                    SERTIFIKAT
                  </div>
                  <div class="text-2xl text-gray-700 mb-2 print:text-3xl">
                    Penyelesaian Program
                  </div>
                  <div class="text-xl text-gray-600 print:text-2xl">
                    Digital Marketing & E-Commerce
                  </div>
                </div>

                <!-- Main Content -->
                <div class="text-center mb-8">
                  <div class="text-lg text-gray-700 mb-6 print:text-xl">
                    Diberikan kepada:
                  </div>
                  <div class="text-4xl font-bold text-blue-800 mb-8 print:text-5xl">
                    ${participantName}
                  </div>
                  <div class="text-lg text-gray-700 mb-4 print:text-xl">
                    Atas partisipasi dan penyelesaian program:
                  </div>
                  <div class="text-2xl font-semibold text-indigo-700 mb-6 print:text-3xl">
                    Digital Marketing & E-Commerce
                  </div>
                  <div class="text-lg text-gray-700 mb-4 print:text-xl">
                    Yang diselenggarakan pada:
                  </div>
                  <div class="text-xl font-semibold text-gray-800 print:text-2xl">
                    ${timestamp}
                  </div>
                </div>

                <!-- Footer -->
                <div class="flex justify-between items-end mt-12 print:mt-16">
                  <div class="text-center">
                    <div class="text-sm text-gray-600 mb-2 print:text-base">
                      Instansi
                    </div>
                    <div class="font-semibold text-gray-800 print:text-lg">
                      ${instansi}
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-sm text-gray-600 mb-2 print:text-base">
                      Jabatan
                    </div>
                    <div class="font-semibold text-gray-800 print:text-lg">
                      ${jabatan}
                    </div>
                  </div>
                </div>

                <!-- Signature Area -->
                <div class="text-center mt-16 print:mt-20">
                  <div class="text-sm text-gray-600 mb-8 print:text-base">
                    Jakarta, ${currentDate}
                  </div>
                  <div class="inline-block">
                    <div class="text-sm text-gray-600 mb-2 print:text-base">
                      Direktur Program
                    </div>
                    <div class="font-bold text-gray-800 print:text-lg">
                      Dr. John Doe, M.M.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
}

/**
 * Server action to generate PDF buffer from HTML content
 */
export async function generatePdfBuffer(htmlContent: string): Promise<Buffer> {
  let puppeteer: any;
  let chromium: any;

  try {
    // Dynamic imports for serverless compatibility
    puppeteer = await import('puppeteer-core');
    chromium = await import('@sparticuz/chromium');
  } catch (error) {
    console.error('Failed to import PDF dependencies:', error);
    throw new Error('PDF generation dependencies not available');
  }

  let browser: any = null;
  
  try {
    // Configure browser for serverless environment
    const browserArgs = [
      ...chromium.default.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ];

    browser = await puppeteer.default.launch({
      args: browserArgs,
      executablePath: await chromium.default.executablePath(),
      headless: chromium.default.headless,
    });

    const page = await browser.newPage();
    
    // Set content and wait for it to load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Generate PDF with appropriate settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}