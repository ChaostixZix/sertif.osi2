"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Folder, FileText, ImageIcon, Download } from "lucide-react"
import Link from "next/link"

export default function OpenFolderPage({ params }: { params: { id: string } }) {
  const files = [
    { name: "Sertifikat_OSI2_2025.pdf", type: "pdf", size: "2.4 MB" },
    { name: "Formulir_Pendaftaran.pdf", type: "pdf", size: "1.2 MB" },
    { name: "Foto_Peserta.jpg", type: "image", size: "856 KB" },
    { name: "Kartu_Peserta.pdf", type: "pdf", size: "945 KB" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="rounded-sm bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Folder Peserta</h1>
        </div>

        <Card className="max-w-4xl mx-auto rounded-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-600" />
              BELEZZAQUEEN KALILA INDARYANTO
            </CardTitle>
            <p className="text-muted-foreground">OSI 2 - Bahasa Inggris - SMP</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    {file.type === "pdf" ? (
                      <FileText className="w-8 h-8 text-red-500" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{file.size}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-sm bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button className="rounded-sm">
                <Download className="w-4 h-4 mr-2" />
                Download Semua File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
