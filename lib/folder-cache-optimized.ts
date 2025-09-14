/**
 * Optimized Folder Cache System
 * Implements LRU cache with memory limits and automatic cleanup
 */

export interface FolderSearchResult {
  id: string
  name: string
  parents: string[]
  level: number
  path: string[]
}

interface CacheEntry {
  data: FolderSearchResult
  timestamp: number
  accessCount: number
  lastAccess: number
}

interface ParentCacheEntry {
  data: FolderSearchResult[]
  timestamp: number
  accessCount: number
  lastAccess: number
}

class OptimizedFolderCache {
  private static instance: OptimizedFolderCache
  private folderCache: Map<string, CacheEntry> = new Map()
  private parentCache: Map<string, ParentCacheEntry> = new Map()
  private readonly MAX_FOLDER_CACHE_SIZE = 1000 // Limit folder cache
  private readonly MAX_PARENT_CACHE_SIZE = 100  // Limit parent cache
  private readonly CACHE_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private cleanupTimer: NodeJS.Timeout | null = null

  static getInstance(): OptimizedFolderCache {
    if (!OptimizedFolderCache.instance) {
      OptimizedFolderCache.instance = new OptimizedFolderCache()
      // Start cleanup timer
      OptimizedFolderCache.instance.startCleanupTimer()
    }
    return OptimizedFolderCache.instance
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    
    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, this.CLEANUP_INTERVAL)
  }

  private performCleanup(): void {
    const now = Date.now()
    
    // Cleanup expired entries
    for (const [key, entry] of this.folderCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TIMEOUT) {
        this.folderCache.delete(key)
      }
    }
    
    for (const [key, entry] of this.parentCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TIMEOUT) {
        this.parentCache.delete(key)
      }
    }
    
    // Enforce size limits using LRU
    this.enforceSizeLimits()
  }

  private enforceSizeLimits(): void {
    // Enforce folder cache size limit
    if (this.folderCache.size > this.MAX_FOLDER_CACHE_SIZE) {
      const entries = Array.from(this.folderCache.entries())
      entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess) // Sort by last access
      
      const toRemove = entries.slice(0, this.folderCache.size - this.MAX_FOLDER_CACHE_SIZE)
      toRemove.forEach(([key]) => this.folderCache.delete(key))
    }
    
    // Enforce parent cache size limit
    if (this.parentCache.size > this.MAX_PARENT_CACHE_SIZE) {
      const entries = Array.from(this.parentCache.entries())
      entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess) // Sort by last access
      
      const toRemove = entries.slice(0, this.parentCache.size - this.MAX_PARENT_CACHE_SIZE)
      toRemove.forEach(([key]) => this.parentCache.delete(key))
    }
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_TIMEOUT
  }

  set(key: string, folder: FolderSearchResult): void {
    const now = Date.now()
    this.folderCache.set(key.toLowerCase(), {
      data: folder,
      timestamp: now,
      accessCount: 0,
      lastAccess: now
    })
  }

  get(key: string): FolderSearchResult | undefined {
    const entry = this.folderCache.get(key.toLowerCase())
    if (!entry) return undefined
    
    if (this.isExpired(entry.timestamp)) {
      this.folderCache.delete(key.toLowerCase())
      return undefined
    }
    
    // Update access statistics
    entry.accessCount++
    entry.lastAccess = Date.now()
    
    return entry.data
  }

  setParentChildren(parentId: string, children: FolderSearchResult[]): void {
    const now = Date.now()
    this.parentCache.set(parentId, {
      data: children,
      timestamp: now,
      accessCount: 0,
      lastAccess: now
    })
  }

  getParentChildren(parentId: string): FolderSearchResult[] | undefined {
    const entry = this.parentCache.get(parentId)
    if (!entry) return undefined
    
    if (this.isExpired(entry.timestamp)) {
      this.parentCache.delete(parentId)
      return undefined
    }
    
    // Update access statistics
    entry.accessCount++
    entry.lastAccess = Date.now()
    
    return entry.data
  }

  clear(): void {
    this.folderCache.clear()
    this.parentCache.clear()
  }

  size(): { folders: number, parents: number } {
    return {
      folders: this.folderCache.size,
      parents: this.parentCache.size
    }
  }

  getStats(): {
    folderCache: {
      size: number
      maxSize: number
      hitRate: number
    }
    parentCache: {
      size: number
      maxSize: number
      hitRate: number
    }
    memoryUsage: string
  } {
    const folderEntries = Array.from(this.folderCache.values())
    const parentEntries = Array.from(this.parentCache.values())
    
    const totalFolderAccess = folderEntries.reduce((sum, entry) => sum + entry.accessCount, 0)
    const totalParentAccess = parentEntries.reduce((sum, entry) => sum + entry.accessCount, 0)
    
    return {
      folderCache: {
        size: this.folderCache.size,
        maxSize: this.MAX_FOLDER_CACHE_SIZE,
        hitRate: folderEntries.length > 0 ? totalFolderAccess / folderEntries.length : 0
      },
      parentCache: {
        size: this.parentCache.size,
        maxSize: this.MAX_PARENT_CACHE_SIZE,
        hitRate: parentEntries.length > 0 ? totalParentAccess / parentEntries.length : 0
      },
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  private estimateMemoryUsage(): string {
    // Rough estimation of memory usage
    const folderSize = this.folderCache.size * 200 // ~200 bytes per folder entry
    const parentSize = this.parentCache.size * 1000 // ~1000 bytes per parent entry
    const totalBytes = folderSize + parentSize
    
    if (totalBytes < 1024) {
      return `${totalBytes} B`
    } else if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`
    } else {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }
}

// Export singleton instance
export const folderCache = OptimizedFolderCache.getInstance()

// Export convenience functions
export function getCacheStats() {
  return folderCache.getStats()
}

export function clearCache() {
  folderCache.clear()
}

export function destroyCache() {
  folderCache.destroy()
}