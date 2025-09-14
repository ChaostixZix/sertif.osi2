# Certificate Management System (OSI2)

> A modern web application for managing digital certificates with seamless Google Sheets and Google Drive integration.

## 🎯 Project Overview

This application is designed as a comprehensive certificate management system that bridges the gap between digital certificate generation and data management through Google's ecosystem. The system provides an intuitive dashboard for managing certificate data while maintaining synchronized records with Google Sheets.

### Key Objectives

- **Centralized Certificate Management**: Provide a user-friendly interface for managing certificate records
- **Google Sheets Integration**: Seamlessly sync certificate data with existing Google Sheets workflows
- **Google Drive Integration**: Organize and store certificate files in structured Google Drive folders
- **Automated Workflow**: Streamline the certificate generation and distribution process

## 🚀 Features

### Core Functionality
- **Certificate Dashboard**: Intuitive table-based interface for viewing and managing certificates
- **Google Sheets Sync**: Real-time synchronization with your Google Sheets database
- **Google Drive Organization**: Automatic folder creation and file organization
- **Configuration Management**: Easy setup of Google API credentials and folder structures

### Data Management
The system works with the following Google Sheets structure:
```
Timestamp | Email Address | Nama Peserta | Ikut OSI/OSH | Ikut OSI2/OSH di Kota... | Jenjang | Mata Pelajaran | FolderId | isShared | isFolderExists
```

### Admin Dashboard Features
- **Google Sheets Configuration**: Set up your Google Sheets ID for data synchronization
- **Drive Folder Management**: Configure parent folder ID for organized storage
- **Service Account Setup**: Upload and manage `service.json` credentials securely
- **Real-time Data Sync**: Monitor and manage data flow between the app and Google services

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS 4
- **State Management**: React Hook Form + Zod validation
- **Package Manager**: pnpm

## 📋 Prerequisites

Before running this project, ensure you have:

- Node.js 18+ installed
- pnpm package manager
- Google Cloud Project with Sheets API and Drive API enabled
- Google Service Account credentials (`service.json`)
- Access to the target Google Sheets document

## 🏃‍♂️ Quick Start

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd sertif.osi2

# Install dependencies
pnpm install
```

### Development
```bash
# Start development server
pnpm dev

# Open http://localhost:3000 in your browser
```

### Build & Deploy
```bash
# Type checking
pnpm exec tsc --noEmit

# Lint code
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

## ⚙️ Configuration

### Google API Setup
1. Create a Google Cloud Project
2. Enable Google Sheets API and Google Drive API
3. Create a Service Account and download the credentials as `service.json`
4. Share your Google Sheets document with the service account email
5. Upload the `service.json` file through the admin dashboard

### Environment Variables
Create a `.env.local` file with your configuration:
```env
# Add your environment variables here
# (Specific variables will be documented as features are implemented)
```

## 📁 Project Structure

Following Next.js 14 App Router conventions:

```
├── app/                    # Next.js App Router pages and layouts
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   └── admin-dashboard.tsx # Main dashboard component
├── lib/                   # Utility functions and configurations
├── public/               # Static assets
├── styles/               # Global styles
└── README.md             # Project documentation
```

## 🤝 Contributing

This project follows specific coding standards and conventions:

- **Code Style**: TypeScript + React functional components with 2-space indentation
- **File Naming**: kebab-case for files, PascalCase for components
- **Imports**: Use `@/*` path aliases
- **Styling**: Tailwind CSS with `cn()` utility for class composition
- **Commits**: Use Conventional Commits format

See `WARP.md` for detailed development guidelines.

## 📊 Current Status

- ✅ Basic Next.js setup with TypeScript
- ✅ shadcn/ui components integration
- ✅ Admin dashboard UI foundation
- 🔄 Google Sheets API integration (in progress)
- 🔄 Google Drive API integration (in progress)
- ⏳ Certificate generation features
- ⏳ User authentication system

## 🗒️ TODO & Implementation Plan

Status legend: ⏳ In progress · 🔜 Planned · ✅ Done

| Feature | Status | Package(s) | Approach |
|---|---|---|---|
| Google Sheets: read participants list | ⏳ In progress | `googleapis` (Sheets v4), `zod` | Server-side function to read `spreadsheets.values.get` for defined range; map rows to a typed model; cache with Next.js server cache/ISR; feed to data table. |
| Google Sheets: write row metadata (`FolderId`, `isShared`, `isFolderExists`) | 🔜 Planned | `googleapis` (Sheets v4) | Use `spreadsheets.values.update`/`batchUpdate` with A1 notation; update only changed cells; wrap in a small service layer for reuse. |
| Data table: sort, filter, pagination | 🔜 Planned | `@tanstack/react-table`, shadcn/ui table | Client-managed table over server-fetched data; column filters, global search, pagination; preserve state in URL params. |
| Google Drive: ensure participant folder | ⏳ In progress | `googleapis` (Drive v3) | Search by name + parent; create if missing; persist `folderId` back to Sheets and toggle `isFolderExists`. |
| Google Drive: upload certificate PDF | 🔜 Planned | `googleapis` (Drive v3) | Upload under participant folder; set MIME `application/pdf`; store `fileId`/`webViewLink` in Sheets. |
| Drive sharing: link and email | 🔜 Planned | `googleapis` (Drive v3) | Create reader permission for participant email; update `isShared`; expose share link in UI and optional email send. |
| Certificate preview page (`/certificate/[id]`) | 🔜 Planned | Next.js, Tailwind | Render certificate using background from `public/`; hydrate fields from Sheets; add print-safe CSS for consistency. |
| Certificate PDF generation | 🔜 Planned | `puppeteer` (Node) | SSR the certificate page and export to PDF; persist to Drive; add “Download PDF” action. Alternative: `@react-pdf/renderer`. |
| Admin auth/protection | 🔜 Planned | `next-auth` (Credentials) or middleware | Protect admin/config screens; minimal Credentials provider or basic auth via middleware; secrets via env (`NEXTAUTH_SECRET`, `ADMIN_PASSWORD`). |
| Service account credentials | 🔜 Planned | `google-auth-library` | Read from env (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_ID`, `GOOGLE_DRIVE_FOLDER_ID`); document local setup; do not persist secrets in repo. |
| Edit data (`/edit-data/[id]`) | 🔜 Planned | `googleapis` (Sheets v4), `zod` | Bind form to selected row; validate with Zod; write back to sheet using targeted range updates. |
| Change email (`/change-email/[id]`) | 🔜 Planned | `googleapis` (Sheets v4, Drive v3) | Update email in Sheets; adjust Drive permissions (remove old, add new); reflect in `isShared`. |
| Open folder (`/open-folder/[id]`) | 🔜 Planned | `googleapis` (Drive v3) | List folder contents via `files.list`; show download links; optional “Download all” via `archiver` zip stream. |
| Observability & errors | 🔜 Planned | `zod`, `sonner` | Centralize API error handling; validate inputs; show user-friendly toasts; log structured errors server-side. |

## 📝 License

This project is private and intended for specific use case implementation.

---

**Note**: This application is specifically designed for managing OSI (Olimpiade Sains Indonesia) and OSH certificate workflows with Google Sheets integration.
