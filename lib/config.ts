/**
 * Configuration Management System
 * Handles dynamic configuration for Google Services
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface ServiceAccountConfig {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
  universe_domain: string
}

export interface SheetConfig {
  id: number
  name: string
  sheetId: string
  range: string
  active: boolean
}

export interface DriveConfig {
  parentFolderId: string
  maxDepthLevel: number
  searchStrategy: 'BFS' | 'DFS'
  folderMappingEnabled: boolean
}

export interface AppConfig {
  serviceAccount?: ServiceAccountConfig
  sheets: SheetConfig[]
  drive: DriveConfig
  lastUpdated: string
}

const CONFIG_FILE_PATH = join(process.cwd(), '.config', 'app-config.json')

// Default configuration
const DEFAULT_CONFIG: AppConfig = {
  sheets: [
    { 
      id: 1, 
      name: "Default Sheet", 
      sheetId: process.env.GOOGLE_SHEET_ID || "", 
      range: process.env.GOOGLE_SHEET_RANGE || "Sheet1!A1:Z1000",
      active: true
    }
  ],
  drive: {
    parentFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || "",
    maxDepthLevel: 3,
    searchStrategy: 'BFS',
    folderMappingEnabled: true
  },
  lastUpdated: new Date().toISOString()
}

/**
 * Load configuration from file or environment variables
 */
export function loadConfig(): AppConfig {
  try {
    // Try to load from config file first
    if (existsSync(CONFIG_FILE_PATH)) {
      const configContent = readFileSync(CONFIG_FILE_PATH, 'utf-8')
      const config = JSON.parse(configContent) as AppConfig
      
      // Validate and merge with defaults
      return {
        ...DEFAULT_CONFIG,
        ...config,
        sheets: config.sheets.length > 0 ? config.sheets : DEFAULT_CONFIG.sheets
      }
    }
    
    // Fallback to environment variables
    return DEFAULT_CONFIG
  } catch (error) {
    console.warn('Failed to load config, using defaults:', error)
    return DEFAULT_CONFIG
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config: AppConfig): { success: boolean, error?: string } {
  try {
    // Ensure config directory exists
    const configDir = join(process.cwd(), '.config')
    if (!existsSync(configDir)) {
      require('fs').mkdirSync(configDir, { recursive: true })
    }
    
    // Update timestamp
    config.lastUpdated = new Date().toISOString()
    
    // Save to file
    writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2))
    
    console.log('Configuration saved successfully to:', CONFIG_FILE_PATH)
    return { success: true }
  } catch (error) {
    console.error('Failed to save configuration:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get active sheets configuration
 */
export function getActiveSheets(): SheetConfig[] {
  const config = loadConfig()
  return config.sheets.filter(sheet => sheet.active && sheet.sheetId)
}

/**
 * Get service account configuration
 * Falls back to environment variables if not configured
 */
export function getServiceAccountConfig(): ServiceAccountConfig | null {
  try {
    const config = loadConfig()
    
    if (config.serviceAccount && config.serviceAccount.client_email && config.serviceAccount.private_key) {
      return config.serviceAccount
    }
    
    // Fallback to environment variables
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
  
    if (email && privateKey) {
      return {
        type: "service_account",
        project_id: "",
        private_key_id: "",
        private_key: privateKey,
        client_email: email,
        client_id: "",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "",
        universe_domain: "googleapis.com"
      }
    }

    return null
  } catch (error) {
    console.warn('Error getting service account config:', error)
    return null
  }
}

/**
 * Get drive configuration
 */
export function getDriveConfig(): DriveConfig {
  const config = loadConfig()
  return config.drive
}

/**
 * Test configuration by attempting to authenticate
 */
export async function testConfiguration(): Promise<{ success: boolean, error?: string }> {
  try {
    const serviceAccount = getServiceAccountConfig()
    if (!serviceAccount) {
      return { success: false, error: 'Service account not configured' }
    }
    
    const sheets = getActiveSheets()
    if (sheets.length === 0) {
      return { success: false, error: 'No active sheets configured' }
    }
    
    const drive = getDriveConfig()
    if (!drive.parentFolderId) {
      return { success: false, error: 'Drive parent folder not configured' }
    }
    
    // Try to create Google Auth instance (simplified test)
    const { google } = require('googleapis')
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    })
    
    // Test authentication
    await auth.authorize()
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Configuration test failed'
    }
  }
}
