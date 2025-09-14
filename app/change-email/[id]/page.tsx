"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, Save } from "lucide-react"
import Link from "next/link"

export default function ChangeEmailPage({ params }: { params: { id: string } }) {
  const [currentEmail, setCurrentEmail] = useState("yes.iam.egs@gmail.com")
  const [newEmail, setNewEmail] = useState("")

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
          <h1 className="text-2xl font-bold">Ubah Email Peserta</h1>
        </div>

        <Card className="max-w-2xl mx-auto rounded-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Form Ubah Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentEmail">Email Saat Ini</Label>
              <Input
                id="currentEmail"
                value={currentEmail}
                disabled
                className="bg-slate-50 dark:bg-slate-800 rounded-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newEmail">Email Baru</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="Masukkan email baru"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="rounded-sm"
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-sm border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Perhatian:</strong> Setelah email diubah, peserta akan menerima notifikasi di email baru dan
                email lama akan dinonaktifkan.
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/">
                <Button variant="outline" className="rounded-sm bg-transparent">
                  Batal
                </Button>
              </Link>
              <Button className="rounded-sm" disabled={!newEmail}>
                <Save className="w-4 h-4 mr-2" />
                Ubah Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
