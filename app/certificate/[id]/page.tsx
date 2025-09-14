"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Share, Award } from "lucide-react"
import Link from "next/link"

export default function CertificatePage({ params }: { params: { id: string } }) {
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
          <h1 className="text-2xl font-bold">Sertifikat Peserta</h1>
        </div>

        <Card className="max-w-4xl mx-auto rounded-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Sertifikat Olimpiade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className="relative w-full aspect-[297/210] mx-auto bg-cover bg-center bg-no-repeat rounded-sm shadow-lg"
              style={{
                backgroundImage: `url('/certificate-landscape-bg.jpg')`,
              }}
            >
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 rounded-sm">
                <div className="h-full flex flex-col justify-center items-center p-12 text-center space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100">SERTIFIKAT PENGHARGAAN</h2>
                    <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-lg text-slate-600 dark:text-slate-300">Diberikan kepada:</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 border-b-2 border-slate-300 dark:border-slate-600 pb-2">
                      BELEZZAQUEEN KALILA INDARYANTO
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <p className="text-slate-600 dark:text-slate-300">Atas partisipasinya dalam</p>
                    <h4 className="text-2xl font-semibold text-purple-700 dark:text-purple-300">
                      OSI 2 - Bahasa Inggris
                    </h4>
                    <p className="text-lg text-slate-600 dark:text-slate-300">Tingkat SMP - Kota Malang</p>
                  </div>

                  <div className="mt-auto pt-8 flex justify-between items-end w-full">
                    <div className="text-left">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Tanggal: 9 April 2025</p>
                    </div>
                    <div className="text-right">
                      <div className="w-32 border-b border-slate-400 mb-2"></div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Penyelenggara</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button className="rounded-sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" className="rounded-sm bg-transparent">
                <Share className="w-4 h-4 mr-2" />
                Bagikan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
