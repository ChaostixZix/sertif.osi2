import { NextRequest, NextResponse } from 'next/server'
import { loadConfig, saveConfig, testConfiguration, type AppConfig } from '@/lib/config'

/**
 * GET /api/admin/config
 * Retrieve current configuration
 */
export async function GET() {
  try {
    const config = loadConfig()
    
    // Remove sensitive data before sending to client
    const safeConfig = {
      ...config,
      serviceAccount: config.serviceAccount ? {
        type: config.serviceAccount.type,
        project_id: config.serviceAccount.project_id,
        client_email: config.serviceAccount.client_email,
        // Don't send private key to client
        private_key: config.serviceAccount.private_key ? '[CONFIGURED]' : '',
        client_id: config.serviceAccount.client_id,
        universe_domain: config.serviceAccount.universe_domain
      } : null
    }
    
    return NextResponse.json({
      success: true,
      data: safeConfig
    })
  } catch (error) {
    console.error('Failed to load config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load configuration'
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/config
 * Save new configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceAccount, sheets, drive } = body
    
    // Validate admin secret key
    const adminSecret = request.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    // Validate required fields
    if (!sheets || !Array.isArray(sheets) || sheets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one sheet configuration is required'
      }, { status: 400 })
    }
    
    if (!drive || !drive.rootFolderId) {
      return NextResponse.json({
        success: false,
        error: 'Drive root folder ID is required'
      }, { status: 400 })
    }
    
    // Prepare config
    const config: AppConfig = {
      serviceAccount: serviceAccount ? {
        type: serviceAccount.type || 'service_account',
        project_id: serviceAccount.project_id || '',
        private_key_id: serviceAccount.private_key_id || '',
        private_key: serviceAccount.private_key || '',
        client_email: serviceAccount.client_email || '',
        client_id: serviceAccount.client_id || '',
        auth_uri: serviceAccount.auth_uri || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: serviceAccount.auth_provider_x509_cert_url || 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: serviceAccount.client_x509_cert_url || '',
        universe_domain: serviceAccount.universe_domain || 'googleapis.com'
      } : undefined,
      sheets: sheets.map((sheet: any, index: number) => ({
        id: sheet.id || index + 1,
        name: sheet.name || `Sheet ${index + 1}`,
        sheetId: sheet.sheetId || '',
        range: sheet.range || 'Sheet1!A1:Z1000',
        active: sheet.active !== false // default to true
      })),
      drive: {
        rootFolderId: drive.rootFolderId,
        folderStructure: drive.folderStructure || '/{kompetisi}/{kota}/{jenjang}'
      },
      lastUpdated: new Date().toISOString()
    }
    
    // Save configuration
    const saveResult = saveConfig(config)
    if (!saveResult.success) {
      return NextResponse.json({
        success: false,
        error: saveResult.error || 'Failed to save configuration'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully'
    })
  } catch (error) {
    console.error('Failed to save config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save configuration'
    }, { status: 500 })
  }
}

/**
 * PUT /api/admin/config
 * Test current configuration
 */
export async function PUT(request: NextRequest) {
  try {
    // Validate admin secret key
    const adminSecret = request.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const testResult = await testConfiguration()
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.success ? 'Configuration test passed' : 'Configuration test failed',
      error: testResult.error
    })
  } catch (error) {
    console.error('Failed to test config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test configuration'
    }, { status: 500 })
  }
}