# 🚀 Panduan Setup Aplikasi Certificate Management System

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:
- Node.js 18+ terinstall
- pnpm package manager terinstall
- Akun Google dengan akses ke Google Cloud Console
- Google Sheets yang sudah dibuat dengan struktur data yang sesuai

## 🔧 Langkah-langkah Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Setup Google Cloud Project

#### a. Buat Google Cloud Project
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik "New Project" atau pilih project yang sudah ada
3. Catat Project ID untuk digunakan nanti

#### b. Enable APIs yang Diperlukan
1. Di Google Cloud Console, buka "APIs & Services" > "Library"
2. Cari dan enable API berikut:
   - **Google Sheets API**
   - **Google Drive API**

#### c. Buat Service Account
1. Buka "IAM & Admin" > "Service Accounts"
2. Klik "Create Service Account"
3. Isi nama: `certificate-management-service`
4. Klik "Create and Continue"
5. Skip role assignment untuk sekarang
6. Klik "Done"

#### d. Generate Service Account Key
1. Klik pada service account yang baru dibuat
2. Buka tab "Keys"
3. Klik "Add Key" > "Create new key"
4. Pilih "JSON" dan klik "Create"
5. File JSON akan terdownload - simpan dengan aman

### 3. Setup Google Sheets

#### a. Buat Google Sheets dengan Struktur yang Sesuai
Buat Google Sheets dengan kolom berikut (urutan penting):
```
A: Timestamp
B: Email Address  
C: Nama Peserta
D: Ikut OSI/OSH
E: Ikut OSI2/OSH di Kota...
F: Jenjang
G: Mata Pelajaran
H: FolderId
I: isShared
J: isFolderExists
```

#### b. Share Sheets dengan Service Account
1. Di Google Sheets, klik "Share"
2. Tambahkan email service account (format: `nama@project-id.iam.gserviceaccount.com`)
3. Berikan permission "Editor"
4. Catat Sheet ID dari URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`

### 4. Setup Google Drive

#### a. Buat Folder Parent
1. Buka Google Drive
2. Buat folder baru dengan nama "Certificate Management" atau sesuai kebutuhan
3. Catat Folder ID dari URL: `https://drive.google.com/drive/folders/FOLDER_ID`

#### b. Share Folder dengan Service Account
1. Klik kanan pada folder > "Share"
2. Tambahkan email service account
3. Berikan permission "Editor"

### 5. Konfigurasi Environment Variables

Buka file `.env.local` dan isi dengan data yang sudah Anda kumpulkan:

```env
# Google Service Account Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Google Sheets Configuration  
GOOGLE_SHEET_ID="your-google-sheet-id-here"
GOOGLE_SHEET_RANGE="Sheet1!A1:J100"

# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID="your-google-drive-folder-id-here"

# Admin Configuration
ADMIN_PASSWORD="your-secure-admin-password"
NEXTAUTH_SECRET="your-random-secret-string"
NEXTAUTH_URL="http://localhost:3000"
```

### 6. Jalankan Aplikasi

```bash
# Development mode
pnpm dev

# Buka browser ke http://localhost:3000
```

## 🔍 Cara Mendapatkan Data yang Diperlukan

### Service Account Email
Dari file JSON yang didownload:
```json
{
  "client_email": "certificate-management@your-project.iam.gserviceaccount.com"
}
```

### Private Key
Dari file JSON yang didownload:
```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
}
```

### Google Sheet ID
Dari URL Google Sheets:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                                    Ini adalah Sheet ID
```

### Google Drive Folder ID
Dari URL Google Drive:
```
https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
                                                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                                   Ini adalah Folder ID
```

## 🚨 Troubleshooting

### Error: "Missing required Google Service Account credentials"
- Pastikan `GOOGLE_SERVICE_ACCOUNT_EMAIL` dan `GOOGLE_PRIVATE_KEY` sudah diisi dengan benar
- Pastikan private key menggunakan format yang benar dengan `\n` untuk newline

### Error: "Missing required environment variables: GOOGLE_SHEET_ID and GOOGLE_SHEET_RANGE"
- Pastikan `GOOGLE_SHEET_ID` sudah diisi dengan ID yang benar
- Pastikan `GOOGLE_SHEET_RANGE` sudah diisi dengan range yang sesuai

### Error: "Permission denied" saat mengakses Google Sheets/Drive
- Pastikan service account sudah diberi permission "Editor" di Google Sheets dan Google Drive
- Pastikan email service account sudah benar

### Error: "Invalid range" saat membaca Google Sheets
- Pastikan `GOOGLE_SHEET_RANGE` menggunakan format yang benar (contoh: "Sheet1!A1:J100")
- Pastikan range mencakup semua kolom yang diperlukan

## 📝 Catatan Penting

1. **Jangan commit file `.env.local`** ke repository - file ini berisi informasi sensitif
2. **Simpan file JSON service account dengan aman** - jangan share dengan siapapun
3. **Gunakan password yang kuat** untuk `ADMIN_PASSWORD`
4. **Generate secret yang random** untuk `NEXTAUTH_SECRET`

## 🎯 Testing Setup

Setelah setup selesai, Anda bisa test dengan:
1. Buka http://localhost:3000
2. Cek apakah data dari Google Sheets muncul di dashboard
3. Test fitur "Create Folder" untuk membuat folder di Google Drive
4. Test fitur "Share Folder" untuk sharing folder dengan peserta

Jika ada error, cek console browser dan terminal untuk detail error message.