"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  Save, 
  TestTube, 
  FileJson, 
  FolderOpen, 
  Sheet,
  AlertCircle,
  CheckCircle,
  Settings
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminConfigPage() {
  const [isPending, startTransition] = useTransition()
  const [serviceAccountFile, setServiceAccountFile] = useState<File | null>(null)
  const [serviceAccountConfig, setServiceAccountConfig] = useState("")
  const [sheetsConfig, setSheetsConfig] = useState([
    { id: 1, name: "OSI 2", sheetId: "", range: "Sheet1!A1:Z1000", active: true },
    { id: 2, name: "OMNI", sheetId: "", range: "Sheet1!A1:Z1000", active: true }
  ])
  const [driveConfig, setDriveConfig] = useState({
    parentFolderId: "",
    maxDepthLevel: 3,
    searchStrategy: 'BFS' as 'BFS' | 'DFS',
    folderMappingEnabled: true
  })
  const [loading, setLoading] = useState(true)
  const [cacheStats, setCacheStats] = useState({
    cacheSize: 0,
    isExpired: false,
    lastUpdate: new Date(),
    status: 'empty'
  })

  // Load existing configuration on mount
  useEffect(() => {
    loadExistingConfig()
    loadCacheStats()
  }, [])

  const loadCacheStats = async () => {
    try {
      const response = await fetch('/api/admin/folder-cache')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setCacheStats(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error)
    }
  }

  const loadExistingConfig = async () => {
    try {
      const response = await fetch('/api/admin/config')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const config = result.data
          
          if (config.sheets && config.sheets.length > 0) {
            setSheetsConfig(config.sheets)
          }
          
          if (config.drive) {
            setDriveConfig(config.drive)
          }
          
          if (config.serviceAccount && config.serviceAccount.private_key !== '[CONFIGURED]') {
            setServiceAccountConfig(JSON.stringify(config.serviceAccount, null, 2))
          }
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      toast.error("Failed to load existing configuration")
    } finally {
      setLoading(false)
    }
  }

  const handleServiceAccountUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File upload triggered:', event.target.files)
    const file = event.target.files?.[0]
    
    if (!file) {
      console.log('No file selected')
      return
    }
    
    console.log('File selected:', file.name, file.type, file.size)
    
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      setServiceAccountFile(file)
      
      // Read file content
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const parsed = JSON.parse(content)
          
          // Validate service account format
          if (parsed.type === 'service_account' && parsed.private_key && parsed.client_email) {
            setServiceAccountConfig(content)
            toast.success("Service account file loaded successfully")
          } else {
            toast.error("Invalid service account file format")
          }
        } catch (error) {
          console.error('Parse error:', error)
          toast.error("Failed to parse service account file")
        }
      }
      reader.onerror = () => {
        console.error('File read error')
        toast.error("Failed to read file")
      }
      reader.readAsText(file)
    } else {
      toast.error("Please select a valid JSON file")
    }
  }

  const handleSaveConfig = () => {
    startTransition(async () => {
      try {
        let serviceAccount = null
        
        // Parse service account if provided
        if (serviceAccountConfig.trim()) {
          try {
            serviceAccount = JSON.parse(serviceAccountConfig)
          } catch (error) {
            toast.error("Invalid service account JSON format")
            return
          }
        }
        
        const config = {
          serviceAccount,
          sheets: sheetsConfig,
          drive: driveConfig
        }
        
        const adminSecret = prompt("Enter admin secret key:")
        if (!adminSecret) {
          toast.error("Admin secret key is required")
          return
        }
        
        const response = await fetch('/api/admin/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
          },
          body: JSON.stringify(config)
        })
        
        const result = await response.json()
        
        if (result.success) {
          toast.success("Configuration saved successfully")
        } else {
          toast.error(result.error || "Failed to save configuration")
        }
      } catch (error) {
        console.error('Save error:', error)
        toast.error("Failed to save configuration")
      }
    })
  }

  const handleTestConnection = () => {
    startTransition(async () => {
      try {
        const adminSecret = prompt("Enter admin secret key:")
        if (!adminSecret) {
          toast.error("Admin secret key is required")
          return
        }
        
        const response = await fetch('/api/admin/config', {
          method: 'PUT',
          headers: {
            'X-Admin-Secret': adminSecret
          }
        })
        
        const result = await response.json()
        
        if (result.success) {
          toast.success("Connection test successful")
        } else {
          toast.error(result.error || "Connection test failed")
        }
      } catch (error) {
        console.error('Test error:', error)
        toast.error("Connection test failed")
      }
    })
  }

  const handlePreloadCache = () => {
    startTransition(async () => {
      try {
        const adminSecret = prompt("Enter admin secret key:")
        if (!adminSecret) {
          toast.error("Admin secret key is required")
          return
        }
        
        const response = await fetch('/api/admin/folder-cache/preload', {
          method: 'POST',
          headers: {
            'X-Admin-Secret': adminSecret
          }
        })
        
        const result = await response.json()
        
        if (result.success) {
          toast.success(result.message)
          loadCacheStats() // Refresh cache stats
        } else {
          toast.error(result.error || "Failed to preload cache")
        }
      } catch (error) {
        console.error('Preload error:', error)
        toast.error("Failed to preload cache")
      }
    })
  }

  const handleClearCache = () => {
    startTransition(async () => {
      try {
        const adminSecret = prompt("Enter admin secret key:")
        if (!adminSecret) {
          toast.error("Admin secret key is required")
          return
        }
        
        const response = await fetch('/api/admin/folder-cache', {
          method: 'DELETE',
          headers: {
            'X-Admin-Secret': adminSecret
          }
        })
        
        const result = await response.json()
        
        if (result.success) {
          toast.success("Cache cleared successfully")
          loadCacheStats() // Refresh cache stats
        } else {
          toast.error(result.error || "Failed to clear cache")
        }
      } catch (error) {
        console.error('Clear cache error:', error)
        toast.error("Failed to clear cache")
      }
    })
  }

  const addSheet = () => {
    const newId = Math.max(...sheetsConfig.map(s => s.id)) + 1
    setSheetsConfig([...sheetsConfig, {
      id: newId,
      name: `Sheet ${newId}`,
      sheetId: "",
      range: "Sheet1!A1:Z1000",
      active: true
    }])
  }

  const removeSheet = (id: number) => {
    setSheetsConfig(sheetsConfig.filter(sheet => sheet.id !== id))
  }

  const updateSheet = (id: number, field: string, value: string) => {
    setSheetsConfig(sheetsConfig.map(sheet => 
      sheet.id === id ? { ...sheet, [field]: value } : sheet
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Settings className="h-8 w-8 text-slate-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Konfigurasi Admin</h1>
                <p className="text-muted-foreground">Kelola pengaturan Google Services dan integrasi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/admin">
                  Kembali ke Dashboard
                </Link>
              </Button>
              <Button 
                onClick={handleTestConnection}
                disabled={isPending}
                variant="outline"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {isPending ? "Testing..." : "Test Connection"}
              </Button>
              <Button 
                onClick={handleSaveConfig}
                disabled={isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {isPending ? "Saving..." : "Save Config"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="documentation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documentation" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Dokumentasi
            </TabsTrigger>
            <TabsTrigger value="service-account" className="flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              Service Account
            </TabsTrigger>
            <TabsTrigger value="sheets" className="flex items-center gap-2">
              <Sheet className="w-4 h-4" />
              Google Sheets
            </TabsTrigger>
            <TabsTrigger value="drive" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Google Drive
            </TabsTrigger>
          </TabsList>

          {/* Documentation Tab */}
          <TabsContent value="documentation">
            <div className="space-y-6">
              {/* Google Sheets Documentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sheet className="w-5 h-5" />
                    📊 Struktur Google Sheets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Required Columns */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-green-800 bg-green-50 p-2 rounded">
                        ✅ Kolom Wajib (Required Columns)
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Sistem mendeteksi kolom secara case-insensitive:
                      </p>
                      
                      <div className="space-y-3">
                        <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                          <h4 className="font-medium">1. Kolom Nama</h4>
                          <p className="text-xs text-muted-foreground">Mendeteksi berbagai variasi:</p>
                          <ul className="text-xs mt-1 list-disc list-inside text-slate-600">
                            <li>"Nama Peserta"</li>
                            <li>"Nama", "Nama Lengkap"</li>
                            <li>"Name", "Full Name"</li>
                            <li>"Participant Name"</li>
                          </ul>
                        </div>
                        
                        <div className="p-3 border-l-4 border-purple-500 bg-purple-50">
                          <h4 className="font-medium">2. Kolom Email</h4>
                          <p className="text-xs text-muted-foreground">Mendeteksi berbagai variasi:</p>
                          <ul className="text-xs mt-1 list-disc list-inside text-slate-600">
                            <li>"Email Address", "Email"</li>
                            <li>"E-mail", "Gmail"</li>
                            <li>"Participant Email"</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {/* Optional & Auto Columns */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-orange-800 bg-orange-50 p-2 rounded">
                        🔧 Kolom Opsional & Otomatis
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                          <h4 className="font-medium">3. FolderId (Opsional)</h4>
                          <p className="text-xs text-muted-foreground">
                            Google Drive folder ID. Jika kosong, sistem akan mencari berdasarkan nama.
                          </p>
                        </div>
                        
                        <div className="p-3 border-l-4 border-gray-500 bg-gray-50">
                          <h4 className="font-medium">Kolom Auto-Added:</h4>
                          <ul className="text-xs mt-1 list-disc list-inside text-slate-600">
                            <li><strong>isShared</strong> - Status sharing (TRUE/FALSE)</li>
                            <li><strong>isFolderExists</strong> - Status keberadaan folder</li>
                            <li><strong>LastLog</strong> - Timestamp operasi terakhir</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Example Structure */}
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">📋 Contoh Struktur Sheet:</h3>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                      <div className="whitespace-pre">
{`| Nama Peserta     | Email Address    | FolderId | isShared | isFolderExists | LastLog     |
|------------------|------------------|----------|----------|----------------|-------------|
| John Doe         | john@gmail.com   | 1ABC...  | TRUE     | TRUE           | [timestamp] |
| Jane Smith       | jane@gmail.com   |          | FALSE    | TRUE           | [timestamp] |`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Drive Structure Documentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    📁 Struktur Parent Folder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Hierarchy */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-blue-800 bg-blue-50 p-2 rounded">
                        🏗️ Hierarki Folder yang Didukung
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Sistem mendukung struktur folder hingga 3 level kedalaman:
                      </p>
                      
                      <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm">
                        <div className="whitespace-pre text-xs">
{`📁 Parent Folder (Level 0)
├── 📁 Kabupaten/Kota (Level 1)
│   ├── 📁 Peserta 1 (Level 2)
│   ├── 📁 Peserta 2 (Level 2)
│   └── 📁 Peserta 3 (Level 2)
└── 📁 Kabupaten/Kota Lain (Level 1)
    ├── 📁 Peserta 4 (Level 2)
    └── 📁 Peserta 5 (Level 2)`}
                        </div>
                      </div>
                    </div>
                    
                    {/* Search Logic */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-purple-800 bg-purple-50 p-2 rounded">
                        🔍 Cara Kerja Pencarian Folder
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="p-3 border-l-4 border-green-500 bg-green-50">
                          <p className="text-sm"><strong>1. Jika ada FolderId</strong></p>
                          <p className="text-xs text-muted-foreground">→ Langsung gunakan ID tersebut</p>
                        </div>
                        
                        <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                          <p className="text-sm"><strong>2. Jika tidak ada FolderId</strong></p>
                          <p className="text-xs text-muted-foreground">→ Cari berdasarkan nama peserta:</p>
                          <ul className="text-xs mt-1 list-disc list-inside text-slate-600 ml-2">
                            <li>Coba mapping lokal (cache)</li>
                            <li>Fallback ke API search dengan BFS</li>
                            <li>Mencari hingga 3 level kedalaman</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Optimization */}
                  <div>
                    <h3 className="font-semibold text-yellow-800 bg-yellow-50 p-2 rounded mb-3">
                      ⚡ Optimasi Pencarian
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-3 border rounded">
                        <h4 className="font-medium text-sm">Folder Mapping</h4>
                        <p className="text-xs text-muted-foreground">Cache mapping folder untuk performa optimal</p>
                      </div>
                      <div className="p-3 border rounded">
                        <h4 className="font-medium text-sm">Case-insensitive</h4>
                        <p className="text-xs text-muted-foreground">Pencarian tidak case-sensitive</p>
                      </div>
                      <div className="p-3 border rounded">
                        <h4 className="font-medium text-sm">Fuzzy Matching</h4>
                        <p className="text-xs text-muted-foreground">Menghilangkan prefix seperti "Muhammad", "Dr."</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Example Structure */}
                  <div>
                    <h3 className="font-semibold mb-3">🌟 Contoh Struktur Folder yang Ideal:</h3>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm">
                      <div className="whitespace-pre text-xs">
{`📁 Sertifikat Pelatihan 2024
├── 📁 Jakarta
│   ├── 📁 Ahmad Fauzi
│   ├── 📁 Siti Nurhaliza
│   └── 📁 Budi Santoso
├── 📁 Bandung
│   ├── 📁 Dewi Sartika
│   └── 📁 Muhammad Ali
└── 📁 Surabaya
    ├── 📁 Fatimah Zahra
    └── 📁 Abdul Rahman`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <strong>Sistem ini dirancang untuk fleksibel</strong> dengan berbagai struktur folder dan dapat menangani ribuan peserta dengan multi-worker architecture untuk performa optimal.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Service Account Tab */}
          <TabsContent value="service-account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="w-5 h-5" />
                  Service Account Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label htmlFor="service-account-file" className="cursor-pointer block">
                        <span className="mt-2 block text-sm font-medium text-gray-900 hover:text-gray-700">
                          Upload Service Account JSON File
                        </span>
                      </Label>
                      <Input
                        id="service-account-file"
                        type="file"
                        accept=".json"
                        onChange={handleServiceAccountUpload}
                        className="mt-2 cursor-pointer file:cursor-pointer w-full"
                        style={{ pointerEvents: 'auto' }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      JSON file from Google Cloud Console
                    </p>
                  </div>
                </div>

                {serviceAccountFile && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-800">
                      File loaded: {serviceAccountFile.name}
                    </span>
                  </div>
                )}

                <div>
                  <Label htmlFor="service-account-config">Service Account Configuration (JSON)</Label>
                  <Textarea
                    id="service-account-config"
                    value={serviceAccountConfig}
                    onChange={(e) => setServiceAccountConfig(e.target.value)}
                    placeholder="Service account JSON will appear here..."
                    className="h-40 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    This configuration will be securely stored and encrypted
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google Sheets Tab */}
          <TabsContent value="sheets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sheet className="w-5 h-5" />
                    Google Sheets Configuration
                  </CardTitle>
                  <Button onClick={addSheet} variant="outline" size="sm">
                    Add Sheet
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {sheetsConfig.map((sheet) => (
                  <div key={sheet.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Sheet Configuration #{sheet.id}</h3>
                      {sheetsConfig.length > 1 && (
                        <Button 
                          onClick={() => removeSheet(sheet.id)}
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Sheet Name</Label>
                        <Input
                          value={sheet.name}
                          onChange={(e) => updateSheet(sheet.id, 'name', e.target.value)}
                          placeholder="OSI 2, OMNI, etc."
                        />
                      </div>
                      <div>
                        <Label>Google Sheet ID</Label>
                        <Input
                          value={sheet.sheetId}
                          onChange={(e) => updateSheet(sheet.id, 'sheetId', e.target.value)}
                          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        />
                      </div>
                      <div>
                        <Label>Range</Label>
                        <Input
                          value={sheet.range}
                          onChange={(e) => updateSheet(sheet.id, 'range', e.target.value)}
                          placeholder="Sheet1!A1:Z1000"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <strong>Tips:</strong>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Sheet ID dapat ditemukan di URL Google Sheets</li>
                        <li>Range menentukan area data yang akan dibaca (contoh: Sheet1!A1:Z1000)</li>
                        <li>Pastikan service account memiliki akses read/write ke semua sheets</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google Drive Tab */}
          <TabsContent value="drive">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Google Drive Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="parent-folder-id">Parent Folder ID</Label>
                  <Input
                    id="parent-folder-id"
                    value={driveConfig.parentFolderId}
                    onChange={(e) => setDriveConfig({ ...driveConfig, parentFolderId: e.target.value })}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ID folder utama di Google Drive tempat semua peserta berada
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-depth">Max Search Depth Level</Label>
                    <select
                      id="max-depth"
                      value={driveConfig.maxDepthLevel}
                      onChange={(e) => setDriveConfig({ ...driveConfig, maxDepthLevel: parseInt(e.target.value) })}
                      className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
                    >
                      <option value={1}>1 Level</option>
                      <option value={2}>2 Level</option>
                      <option value={3}>3 Level (Recommended)</option>
                      <option value={4}>4 Level</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kedalaman maksimal pencarian folder dari parent folder
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="search-strategy">Search Strategy</Label>
                    <select
                      id="search-strategy"
                      value={driveConfig.searchStrategy}
                      onChange={(e) => setDriveConfig({ ...driveConfig, searchStrategy: e.target.value as 'BFS' | 'DFS' })}
                      className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
                    >
                      <option value="BFS">BFS (Breadth-First Search)</option>
                      <option value="DFS">DFS (Depth-First Search)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Strategi pencarian folder. BFS direkomendasikan untuk performa optimal
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="folder-mapping"
                    checked={driveConfig.folderMappingEnabled}
                    onChange={(e) => setDriveConfig({ ...driveConfig, folderMappingEnabled: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <Label htmlFor="folder-mapping" className="text-sm">
                    Enable Folder Mapping Cache
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cache hasil pencarian folder untuk meningkatkan performa. Direkomendasikan untuk aktif.
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <strong>Struktur Folder Saat Ini:</strong>
                        <div className="mt-2 font-mono text-xs bg-white p-3 rounded border">
                          <div>📁 Parent Folder (Level 0)</div>
                          <div className="ml-4">├── 📁 Jakarta (Level 1)</div>
                          <div className="ml-4">│   ├── 📁 Ahmad Fauzi (Level 2)</div>
                          <div className="ml-4">│   └── 📁 Siti Nurhaliza (Level 2)</div>
                          <div className="ml-4">├── 📁 Bandung (Level 1)</div>
                          <div className="ml-4">│   └── 📁 Dewi Sartika (Level 2)</div>
                          <div className="ml-4">└── 📁 Surabaya (Level 1)</div>
                          <div className="ml-8">    └── 📁 Abdul Rahman (Level 2)</div>
                        </div>
                        <div className="mt-2 text-xs">
                          <strong>Search Strategy:</strong> {driveConfig.searchStrategy} | 
                          <strong> Max Depth:</strong> {driveConfig.maxDepthLevel} level | 
                          <strong> Cache:</strong> {driveConfig.folderMappingEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cache Management */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">Folder Cache Management</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cacheStats.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : cacheStats.status === 'expired'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {cacheStats.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-xs">
                      <div>
                        <div className="font-medium text-gray-600">Cache Size</div>
                        <div className="text-lg font-bold">{cacheStats.cacheSize}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Last Update</div>
                        <div className="text-sm">{new Date(cacheStats.lastUpdate).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Status</div>
                        <div className="text-sm capitalize">{cacheStats.status}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Auto-Refresh</div>
                        <div className="text-sm">{cacheStats.isExpired ? 'Needed' : 'Active'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={handlePreloadCache}
                        disabled={isPending}
                        size="sm"
                        variant="outline"
                      >
                        {isPending ? "Loading..." : "Preload Cache"}
                      </Button>
                      <Button 
                        onClick={handleClearCache}
                        disabled={isPending}
                        size="sm"
                        variant="outline"
                      >
                        {isPending ? "Clearing..." : "Clear Cache"}
                      </Button>
                      <Button 
                        onClick={loadCacheStats}
                        disabled={isPending}
                        size="sm"
                        variant="ghost"
                      >
                        Refresh Stats
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Preload cache untuk performa optimal. Cache otomatis expired setelah 30 menit.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}