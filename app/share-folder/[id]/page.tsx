"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Share, Copy, Mail } from "lucide-react"
import Link from "next/link"

export default function ShareFolderPage({ params }: { params: { id: string } }) {
  const [shareLink] = useState(`https://dashboard.osi.com/shared/folder/${params.id}`)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("Berikut adalah folder dokumen peserta olimpiade.")

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
  }

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
          <h1 className="text-2xl font-bold">Bagikan Folder</h1>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share className="w-5 h-5 text-blue-600" />
                Link Berbagi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Link Folder</Label>
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly className="rounded-sm" />
                  <Button onClick={copyToClipboard} variant="outline" className="rounded-sm bg-transparent">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                Kirim via Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Penerima</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email penerima"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Pesan (Opsional)</Label>
                <Textarea
                  id="message"
                  placeholder="Tambahkan pesan untuk penerima"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-sm"
                />
              </div>

              <Button className="w-full rounded-sm" disabled={!email}>
                <Mail className="w-4 h-4 mr-2" />
                Kirim Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
