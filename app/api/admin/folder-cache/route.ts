import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats, clearCache, preloadFolderStructure } from '@/lib/folder-search'

/**
 * GET /api/admin/folder-cache
 * Get folder cache statistics
 */
export async function GET() {
  try {
    const stats = getCacheStats()
    
    return NextResponse.json({
      success: true,
      data: {
        cacheSize: stats.size,
        isExpired: stats.isExpired,
        lastUpdate: stats.lastUpdate,
        status: stats.isExpired ? 'expired' : stats.size > 0 ? 'active' : 'empty'
      }
    })
  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get cache statistics'
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/folder-cache/preload
 * Preload folder structure
 */
export async function POST(request: NextRequest) {
  try {
    // Validate admin secret key
    const adminSecret = request.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const result = await preloadFolderStructure()
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Successfully preloaded ${result.foldersLoaded} folders`
        : 'Failed to preload folder structure',
      data: {
        foldersLoaded: result.foldersLoaded,
        error: result.error
      }
    })
  } catch (error) {
    console.error('Failed to preload folder structure:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to preload folder structure'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/folder-cache
 * Clear folder cache
 */
export async function DELETE(request: NextRequest) {
  try {
    // Validate admin secret key
    const adminSecret = request.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    clearCache()
    
    return NextResponse.json({
      success: true,
      message: 'Folder cache cleared successfully'
    })
  } catch (error) {
    console.error('Failed to clear cache:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear cache'
    }, { status: 500 })
  }
}