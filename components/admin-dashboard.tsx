"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Award,
  Edit,
  Mail,
  Folder,
  Share,
  Users,
  Trophy,
  Calendar,
} from "lucide-react"
import Link from "next/link"

// Mock data based on user's example
const mockData = [
  {
    id: 1,
    timestamp: "9/4/2025 15:39:13",
    email: "yes.iam.egs@gmail.com",
    nama: "BELEZZAQUEEN KALILA INDARYANTO",
    kompetisi: "OSI 2",
    kota: "MALANG",
    jenjang: "SMP",
    mataPelajaran: "Bahasa Inggris",
  },
  {
    id: 2,
    timestamp: "9/4/2025 14:22:45",
    email: "student.champion@gmail.com",
    nama: "AHMAD RIZKI PRATAMA",
    kompetisi: "OMNI",
    kota: "JAKARTA",
    jenjang: "SMA",
    mataPelajaran: "Matematika",
  },
  {
    id: 3,
    timestamp: "9/4/2025 13:15:30",
    email: "brilliant.mind@yahoo.com",
    nama: "SARI DEWI KUSUMA",
    kompetisi: "OSI 2",
    kota: "SURABAYA",
    jenjang: "SMP",
    mataPelajaran: "IPA",
  },
  {
    id: 4,
    timestamp: "9/4/2025 12:08:17",
    email: "future.scientist@gmail.com",
    nama: "BUDI SANTOSO WIJAYA",
    kompetisi: "OMNI",
    kota: "BANDUNG",
    jenjang: "SMA",
    mataPelajaran: "Fisika",
  },
]

export function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = mockData.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kota.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = [
    { title: "Total Peserta", value: "1,247", icon: Users, color: "text-blue-600" },
    { title: "OSI 2", value: "687", icon: Trophy, color: "text-green-600" },
    { title: "OMNI", value: "560", icon: Award, color: "text-purple-600" },
    { title: "Hari Ini", value: "24", icon: Calendar, color: "text-orange-600" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-6 py-1">
          {" "}
          {/* reduced padding from py-2 to py-1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {" "}
              {/* reduced gap from gap-4 to gap-3 */}
              <img src="/logo.png" alt="OSI Logo" className="h-10 w-auto bg-black p-1 rounded-sm" />{" "}
              {/* reduced height from h-12 to h-10 */}
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">OSI 2 & OMNI Dashboard</h1>{" "}
                {/* reduced font size from text-2xl to text-lg */}
                <p className="text-muted-foreground text-xs">Kelola peserta olimpiade dengan mudah dan efisien</p>{" "}
                {/* reduced font size to text-xs */}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {" "}
              {/* reduced gap from gap-3 to gap-2 */}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button size="sm">
                <Users className="w-4 h-4 mr-2" />
                Tambah Peserta
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg bg-slate-900 rounded-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-sm bg-white/20 backdrop-blur-sm`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-200 uppercase tracking-wider">{stat.title}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-bold text-white group-hover:scale-105 transition-transform duration-200">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2 text-sm">
                      <span className="text-green-400 font-medium">+12%</span>
                      <span className="text-slate-300 ml-1">vs last month</span>
                    </div>
                  </div>
                  <div className="w-16 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-sm flex items-end justify-end p-1">
                    <div className="w-1 h-2 bg-blue-400 rounded-sm mr-0.5"></div>
                    <div className="w-1 h-4 bg-blue-400 rounded-sm mr-0.5"></div>
                    <div className="w-1 h-3 bg-blue-400 rounded-sm mr-0.5"></div>
                    <div className="w-1 h-6 bg-blue-400 rounded-sm"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Table Card */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl font-semibold">Data Peserta</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari peserta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 rounded-sm"
                  />
                </div>
                <Button variant="outline" size="sm" className="rounded-sm bg-transparent">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border overflow-hidden rounded-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900 hover:bg-slate-900 border-b-2 border-slate-700">
                    <TableHead className="font-semibold text-white py-4 bg-slate-900">Timestamp</TableHead>
                    <TableHead className="font-semibold text-white py-4 bg-slate-900">Email</TableHead>
                    <TableHead className="font-semibold text-white py-4 bg-slate-900">Nama Peserta</TableHead>
                    <TableHead className="font-semibold text-white py-4 bg-slate-900">Kompetisi</TableHead>
                    <TableHead className="font-semibold text-white py-4 bg-slate-900">Kota</TableHead>
                    <TableHead className="font-semibold text-white py-4 bg-slate-900">Jenjang</TableHead>
                    <TableHead className="font-semibold text-white py-4 bg-slate-900">Mata Pelajaran</TableHead>
                    <TableHead className="font-semibold text-white text-center py-4 bg-slate-900">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
                    >
                      <TableCell className="font-mono text-sm text-muted-foreground py-4">{item.timestamp}</TableCell>
                      <TableCell className="font-medium text-blue-600 py-4">{item.email}</TableCell>
                      <TableCell className="font-semibold py-4">{item.nama}</TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant={item.kompetisi === "OSI 2" ? "default" : "secondary"}
                          className={`rounded-sm ${
                            item.kompetisi === "OSI 2"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          }`}
                        >
                          {item.kompetisi}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium py-4">{item.kota}</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="rounded-sm">
                          {item.jenjang}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium py-4">{item.mataPelajaran}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/certificate/${item.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-sm"
                              title="Lihat Sertifikat"
                            >
                              <Award className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/edit-data/${item.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-sm"
                              title="Edit Data"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/change-email/${item.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-sm"
                              title="Ubah Email"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-sm"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-sm">
                              <DropdownMenuItem className="cursor-pointer" asChild>
                                <Link href={`/open-folder/${item.id}`}>
                                  <Folder className="w-4 h-4 mr-2" />
                                  Buka Folder
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" asChild>
                                <Link href={`/share-folder/${item.id}`}>
                                  <Share className="w-4 h-4 mr-2" />
                                  Bagikan Folder
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Menampilkan {filteredData.length} dari {mockData.length} peserta
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled className="rounded-sm bg-transparent">
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="bg-primary text-primary-foreground rounded-sm">
                  1
                </Button>
                <Button variant="outline" size="sm" className="rounded-sm bg-transparent">
                  2
                </Button>
                <Button variant="outline" size="sm" className="rounded-sm bg-transparent">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
