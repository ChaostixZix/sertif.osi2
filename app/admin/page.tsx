import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, Shield, Database, Folder, Mail, Key, AlertTriangle, Lock } from "lucide-react"
import { redirect } from "next/navigation"

interface AdminPageProps {
  searchParams: { key?: string }
}

export default function AdminPage({ searchParams }: AdminPageProps) {
  const adminSecretKey = process.env.ADMIN_SECRET_KEY
  const providedKey = searchParams.key

  // Check if admin secret key is configured
  if (!adminSecretKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl text-red-600 dark:text-red-400">
              Configuration Error
            </CardTitle>
            <CardDescription>
              ADMIN_SECRET_KEY is not configured in environment variables
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please configure the ADMIN_SECRET_KEY environment variable to access the admin panel.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if the correct key is provided
  if (providedKey !== adminSecretKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Lock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-xl text-yellow-600 dark:text-yellow-400">
              Access Restricted
            </CardTitle>
            <CardDescription>
              This admin page is protected. You need the correct secret key to access it.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please contact the system administrator for access credentials.
            </p>
            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg text-left">
              <p className="text-xs text-muted-foreground mb-1">Access format:</p>
              <code className="text-xs font-mono text-blue-600 dark:text-blue-400">
                /admin?key=YOUR_SECRET_KEY
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch configuration environment variables
  const config = {
    googleSheetId: process.env.GOOGLE_SHEET_ID || 'Not configured',
    googleSheetRange: process.env.GOOGLE_SHEET_RANGE || 'Not configured', 
    googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || 'Not configured',
    googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'Not configured',
    googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY ? 'Configured ✓' : 'Not configured ✗',
    adminSecretKey: adminSecretKey ? 'Configured ✓' : 'Not configured ✗'
  }

  // Check status of each configuration
  const getStatus = (value: string) => {
    if (value === 'Not configured' || value === 'Not configured ✗') {
      return { color: 'bg-red-500', status: 'error' }
    }
    if (value === 'Configured ✓') {
      return { color: 'bg-green-500', status: 'success' }
    }
    return { color: 'bg-green-500', status: 'success' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  Admin Configuration
                </h1>
                <p className="text-sm text-muted-foreground">
                  Kelola konfigurasi sistem dan environment variables
                </p>
              </div>
            </div>
            <div className="ml-auto">
              <Badge variant="secondary" className="gap-2">
                <Shield className="h-3 w-3" />
                Protected Area
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Google Sheets Configuration Card */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Google Sheets</CardTitle>
              </div>
              <CardDescription>
                Konfigurasi untuk Google Sheets API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sheet ID</label>
                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-700 p-2 rounded mt-1 break-all">
                  {config.googleSheetId}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sheet Range</label>
                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-700 p-2 rounded mt-1">
                  {config.googleSheetRange}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Google Drive Configuration Card */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Folder className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Google Drive</CardTitle>
              </div>
              <CardDescription>
                Konfigurasi untuk Google Drive API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Root Folder ID</label>
                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-700 p-2 rounded mt-1 break-all">
                  {config.googleDriveFolderId}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Account Configuration Card */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Service Account</CardTitle>
              </div>
              <CardDescription>
                Konfigurasi autentikasi Google API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Service Account Email</label>
                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-700 p-2 rounded mt-1 break-all">
                  {config.googleServiceAccountEmail}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Private Key Status</label>
                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-700 p-2 rounded mt-1">
                  {config.googlePrivateKey}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Protection Card */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg">Security</CardTitle>
              </div>
              <CardDescription>
                Pengaturan keamanan admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Admin Secret Key</label>
                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-700 p-2 rounded mt-1">
                  {config.adminSecretKey}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <Card className="mt-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              System Status Overview
            </CardTitle>
            <CardDescription>
              Status konfigurasi sistem secara keseluruhan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 rounded-lg border">
                <div className={`h-2 w-2 ${getStatus(config.googleSheetId).color} rounded-full mx-auto mb-2`}></div>
                <p className="text-sm font-medium">Google Sheets</p>
                <p className="text-xs text-muted-foreground">
                  {getStatus(config.googleSheetId).status === 'success' ? 'Configured' : 'Not configured'}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className={`h-2 w-2 ${getStatus(config.googleDriveFolderId).color} rounded-full mx-auto mb-2`}></div>
                <p className="text-sm font-medium">Google Drive</p>
                <p className="text-xs text-muted-foreground">
                  {getStatus(config.googleDriveFolderId).status === 'success' ? 'Configured' : 'Not configured'}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className={`h-2 w-2 ${getStatus(config.googleServiceAccountEmail).color} rounded-full mx-auto mb-2`}></div>
                <p className="text-sm font-medium">Service Account</p>
                <p className="text-xs text-muted-foreground">
                  {getStatus(config.googleServiceAccountEmail).status === 'success' ? 'Configured' : 'Not configured'}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className={`h-2 w-2 ${getStatus(config.adminSecretKey).color} rounded-full mx-auto mb-2`}></div>
                <p className="text-sm font-medium">Admin Protection</p>
                <p className="text-xs text-muted-foreground">
                  {getStatus(config.adminSecretKey).status === 'success' ? 'Active' : 'Not configured'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}