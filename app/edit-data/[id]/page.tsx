"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function EditDataPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState({
    nama: "BELEZZAQUEEN KALILA INDARYANTO",
    kompetisi: "OSI 2",
    kota: "MALANG",
    jenjang: "SMP",
    mataPelajaran: "Bahasa Inggris",
  })

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
          <h1 className="text-2xl font-bold">Edit Data Peserta</h1>
        </div>

        <Card className="max-w-2xl mx-auto rounded-sm">
          <CardHeader>
            <CardTitle>Form Edit Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Peserta</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="rounded-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kompetisi">Kompetisi</Label>
              <Select
                value={formData.kompetisi}
                onValueChange={(value) => setFormData({ ...formData, kompetisi: value })}
              >
                <SelectTrigger className="rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="OSI 2">OSI 2</SelectItem>
                  <SelectItem value="OMNI">OMNI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kota">Kota</Label>
              <Input
                id="kota"
                value={formData.kota}
                onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                className="rounded-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenjang">Jenjang</Label>
              <Select value={formData.jenjang} onValueChange={(value) => setFormData({ ...formData, jenjang: value })}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="SD">SD</SelectItem>
                  <SelectItem value="SMP">SMP</SelectItem>
                  <SelectItem value="SMA">SMA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mataPelajaran">Mata Pelajaran</Label>
              <Input
                id="mataPelajaran"
                value={formData.mataPelajaran}
                onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                className="rounded-sm"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/">
                <Button variant="outline" className="rounded-sm bg-transparent">
                  Batal
                </Button>
              </Link>
              <Button className="rounded-sm">
                <Save className="w-4 h-4 mr-2" />
                Simpan Perubahan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
