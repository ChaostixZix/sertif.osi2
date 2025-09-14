/**
 * Advanced Folder Search System
 * Implements BFS and DFS search strategies with caching and fuzzy matching
 */

import { google } from 'googleapis'
import auth from './google-auth'
import { getDriveConfig } from './config'

// Initialize Google Drive API client
const drive = google.drive({ version: 'v3', auth })

export interface FolderSearchResult {
  id: string
  name: string
  parents: string[]
  level: number
  path: string[]
}

export interface SearchOptions {
  maxDepth?: number
  strategy?: 'BFS' | 'DFS'
  cacheEnabled?: boolean
  fuzzyMatch?: boolean
}

/**
 * Folder mapping cache
 */
class FolderCache {
  private static instance: FolderCache
  private cache: Map<string, FolderSearchResult> = new Map()
  private parentCache: Map<string, FolderSearchResult[]> = new Map()
  private lastUpdate: Date = new Date()
  private readonly CACHE_TIMEOUT = 30 * 60 * 1000 // 30 minutes

  static getInstance(): FolderCache {
    if (!FolderCache.instance) {
      FolderCache.instance = new FolderCache()
    }
    return FolderCache.instance
  }

  isExpired(): boolean {
    return Date.now() - this.lastUpdate.getTime() > this.CACHE_TIMEOUT
  }

  set(key: string, folder: FolderSearchResult): void {
    this.cache.set(key.toLowerCase(), folder)
    this.lastUpdate = new Date()
  }

  get(key: string): FolderSearchResult | undefined {
    if (this.isExpired()) {
      this.clear()
      return undefined
    }
    return this.cache.get(key.toLowerCase())
  }

  setParentChildren(parentId: string, children: FolderSearchResult[]): void {
    this.parentCache.set(parentId, children)
  }

  getParentChildren(parentId: string): FolderSearchResult[] | undefined {
    if (this.isExpired()) {
      this.clear()
      return undefined
    }
    return this.parentCache.get(parentId)
  }

  clear(): void {
    this.cache.clear()
    this.parentCache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * Normalize name for fuzzy matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(dr\.|prof\.|muhammad|mohammad|ahmad|abdul|abu|siti|dewi)\s+/i, '') // Remove common prefixes
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}

/**
 * Calculate similarity score between two names
 */
function calculateSimilarity(name1: string, name2: string): number {
  const norm1 = normalizeName(name1)
  const norm2 = normalizeName(name2)
  
  // Exact match
  if (norm1 === norm2) return 1.0
  
  // Contains match
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8
  
  // Word overlap
  const words1 = norm1.split(' ')
  const words2 = norm2.split(' ')
  const overlap = words1.filter(word => words2.includes(word)).length
  const total = Math.max(words1.length, words2.length)
  
  return overlap / total
}

/**
 * Get folders from Drive API with pagination
 */
async function getFoldersInParent(
  parentId: string,
  pageToken?: string
): Promise<{ folders: FolderSearchResult[], nextPageToken?: string }> {
  try {
    const response = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'nextPageToken,files(id,name,parents)',
      pageSize: 100,
      pageToken
    })

    const folders: FolderSearchResult[] = (response.data.files || []).map(file => ({
      id: file.id!,
      name: file.name!,
      parents: file.parents || [parentId],
      level: 0, // Will be set by caller
      path: [] // Will be set by caller
    }))

    return {
      folders,
      nextPageToken: response.data.nextPageToken
    }
  } catch (error) {
    console.error('Error fetching folders:', error)
    return { folders: [] }
  }
}

/**
 * BFS (Breadth-First Search) implementation
 */
async function searchFoldersBFS(
  parentId: string,
  targetName: string,
  options: SearchOptions
): Promise<FolderSearchResult[]> {
  const results: FolderSearchResult[] = []
  const cache = FolderCache.getInstance()
  const queue: { folderId: string, level: number, path: string[] }[] = [
    { folderId: parentId, level: 0, path: [] }
  ]

  const maxDepth = options.maxDepth || 3
  const processed = new Set<string>()

  while (queue.length > 0) {
    const { folderId, level, path } = queue.shift()!

    if (level >= maxDepth || processed.has(folderId)) {
      continue
    }

    processed.add(folderId)

    // Check cache first
    let folders: FolderSearchResult[]
    if (options.cacheEnabled && cache.getParentChildren(folderId)) {
      folders = cache.getParentChildren(folderId)!
    } else {
      // Fetch all pages for this parent
      const allFolders: FolderSearchResult[] = []
      let pageToken: string | undefined

      do {
        const result = await getFoldersInParent(folderId, pageToken)
        allFolders.push(...result.folders)
        pageToken = result.nextPageToken
      } while (pageToken)

      folders = allFolders

      // Cache the results
      if (options.cacheEnabled) {
        cache.setParentChildren(folderId, folders)
      }
    }

    // Process folders at this level
    for (const folder of folders) {
      folder.level = level + 1
      folder.path = [...path, folder.name]

      // Check if this folder matches our search
      const similarity = calculateSimilarity(folder.name, targetName)
      const threshold = options.fuzzyMatch ? 0.6 : 1.0

      if (similarity >= threshold) {
        results.push({ ...folder, similarity } as any)

        // Cache exact matches
        if (options.cacheEnabled && similarity === 1.0) {
          cache.set(targetName, folder)
        }
      }

      // Add to queue for next level search
      if (level + 1 < maxDepth) {
        queue.push({
          folderId: folder.id,
          level: level + 1,
          path: folder.path
        })
      }
    }
  }

  return results.sort((a: any, b: any) => (b.similarity || 0) - (a.similarity || 0))
}

/**
 * DFS (Depth-First Search) implementation
 */
async function searchFoldersDFS(
  parentId: string,
  targetName: string,
  options: SearchOptions,
  currentLevel: number = 0,
  currentPath: string[] = []
): Promise<FolderSearchResult[]> {
  const results: FolderSearchResult[] = []
  const cache = FolderCache.getInstance()
  const maxDepth = options.maxDepth || 3

  if (currentLevel >= maxDepth) {
    return results
  }

  // Check cache first
  let folders: FolderSearchResult[]
  if (options.cacheEnabled && cache.getParentChildren(parentId)) {
    folders = cache.getParentChildren(parentId)!
  } else {
    // Fetch all pages for this parent
    const allFolders: FolderSearchResult[] = []
    let pageToken: string | undefined

    do {
      const result = await getFoldersInParent(parentId, pageToken)
      allFolders.push(...result.folders)
      pageToken = result.nextPageToken
    } while (pageToken)

    folders = allFolders

    // Cache the results
    if (options.cacheEnabled) {
      cache.setParentChildren(parentId, folders)
    }
  }

  // Process folders at current level
  for (const folder of folders) {
    folder.level = currentLevel + 1
    folder.path = [...currentPath, folder.name]

    // Check if this folder matches our search
    const similarity = calculateSimilarity(folder.name, targetName)
    const threshold = options.fuzzyMatch ? 0.6 : 1.0

    if (similarity >= threshold) {
      results.push({ ...folder, similarity } as any)

      // Cache exact matches
      if (options.cacheEnabled && similarity === 1.0) {
        cache.set(targetName, folder)
      }
    }

    // Recursive search in subfolders
    if (currentLevel + 1 < maxDepth) {
      const subResults = await searchFoldersDFS(
        folder.id,
        targetName,
        options,
        currentLevel + 1,
        folder.path
      )
      results.push(...subResults)
    }
  }

  return results.sort((a: any, b: any) => (b.similarity || 0) - (a.similarity || 0))
}

/**
 * Main folder search function
 */
export async function searchFolder(
  participantName: string,
  options: SearchOptions = {}
): Promise<{
  success: boolean
  folder?: FolderSearchResult
  alternatives?: FolderSearchResult[]
  error?: string
  stats?: {
    searchTime: number
    cacheHits: number
    totalFolders: number
  }
}> {
  try {
    const startTime = Date.now()
    const cache = FolderCache.getInstance()
    const config = getDriveConfig()

    // Set default options
    const searchOptions: SearchOptions = {
      maxDepth: options.maxDepth || config.maxDepthLevel || 3,
      strategy: options.strategy || config.searchStrategy || 'BFS',
      cacheEnabled: options.cacheEnabled !== undefined ? options.cacheEnabled : config.folderMappingEnabled,
      fuzzyMatch: options.fuzzyMatch !== undefined ? options.fuzzyMatch : true
    }

    // Check cache first
    if (searchOptions.cacheEnabled) {
      const cached = cache.get(participantName)
      if (cached) {
        return {
          success: true,
          folder: cached,
          stats: {
            searchTime: Date.now() - startTime,
            cacheHits: 1,
            totalFolders: 1
          }
        }
      }
    }

    // Perform search
    let results: FolderSearchResult[]
    if (searchOptions.strategy === 'BFS') {
      results = await searchFoldersBFS(config.parentFolderId, participantName, searchOptions)
    } else {
      results = await searchFoldersDFS(config.parentFolderId, participantName, searchOptions)
    }

    const searchTime = Date.now() - startTime

    if (results.length === 0) {
      return {
        success: false,
        error: 'Folder not found',
        stats: {
          searchTime,
          cacheHits: 0,
          totalFolders: 0
        }
      }
    }

    // Return best match and alternatives
    const [bestMatch, ...alternatives] = results

    return {
      success: true,
      folder: bestMatch,
      alternatives: alternatives.slice(0, 5), // Limit alternatives
      stats: {
        searchTime,
        cacheHits: 0,
        totalFolders: results.length
      }
    }

  } catch (error) {
    console.error('Error searching folder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  isExpired: boolean
  lastUpdate: Date
} {
  const cache = FolderCache.getInstance()
  return {
    size: cache.size(),
    isExpired: cache.isExpired(),
    lastUpdate: cache['lastUpdate']
  }
}

/**
 * Clear cache manually
 */
export function clearCache(): void {
  const cache = FolderCache.getInstance()
  cache.clear()
}

/**
 * Preload folder structure for better performance
 */
export async function preloadFolderStructure(): Promise<{
  success: boolean
  foldersLoaded: number
  error?: string
}> {
  try {
    const config = getDriveConfig()
    const cache = FolderCache.getInstance()
    
    // Clear existing cache
    cache.clear()
    
    let totalFolders = 0
    const queue: { parentId: string, level: number }[] = [
      { parentId: config.parentFolderId, level: 0 }
    ]

    while (queue.length > 0) {
      const { parentId, level } = queue.shift()!
      
      if (level >= (config.maxDepthLevel || 3)) {
        continue
      }

      // Load all folders for this parent
      const allFolders: FolderSearchResult[] = []
      let pageToken: string | undefined

      do {
        const result = await getFoldersInParent(parentId, pageToken)
        allFolders.push(...result.folders)
        pageToken = result.nextPageToken
      } while (pageToken)

      // Cache the results
      cache.setParentChildren(parentId, allFolders)
      totalFolders += allFolders.length

      // Add subfolders to queue
      for (const folder of allFolders) {
        queue.push({ parentId: folder.id, level: level + 1 })
      }
    }

    return {
      success: true,
      foldersLoaded: totalFolders
    }
  } catch (error) {
    console.error('Error preloading folder structure:', error)
    return {
      success: false,
      foldersLoaded: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}