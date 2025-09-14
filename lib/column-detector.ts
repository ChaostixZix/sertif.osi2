/**
 * Column Detection System
 * Smart column detection for Google Sheets with case-insensitive and fuzzy matching
 */

export interface ColumnMapping {
  name?: string
  email?: string
  folderId?: string
  isShared?: string
  isFolderExists?: string
  lastLog?: string
}

/**
 * Possible column variations for participant name
 */
const NAME_COLUMN_VARIATIONS = [
  'nama peserta',
  'nama',
  'nama lengkap',
  'name',
  'full name',
  'participant name',
  'student name',
  'peserta',
  'fullname'
]

/**
 * Possible column variations for email
 */
const EMAIL_COLUMN_VARIATIONS = [
  'email address',
  'email',
  'e-mail',
  'gmail',
  'participant email',
  'student email',
  'alamat email'
]

/**
 * Possible column variations for folder ID
 */
const FOLDER_ID_VARIATIONS = [
  'folderid',
  'folder id',
  'drive folder id',
  'google drive id',
  'folder'
]

/**
 * Possible column variations for sharing status
 */
const IS_SHARED_VARIATIONS = [
  'isshared',
  'is shared',
  'shared',
  'sharing status',
  'dibagikan'
]

/**
 * Possible column variations for folder existence
 */
const IS_FOLDER_EXISTS_VARIATIONS = [
  'isfolderexists',
  'is folder exists',
  'folder exists',
  'folder status',
  'ada folder'
]

/**
 * Possible column variations for last log
 */
const LAST_LOG_VARIATIONS = [
  'lastlog',
  'last log',
  'timestamp',
  'last updated',
  'terakhir diperbarui',
  'log terakhir'
]

/**
 * Normalize text for comparison (lowercase, remove spaces, special chars)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Find best matching column name from variations
 */
function findBestMatch(headerName: string, variations: string[]): boolean {
  const normalizedHeader = normalizeText(headerName)
  
  return variations.some(variation => {
    const normalizedVariation = normalizeText(variation)
    
    // Exact match
    if (normalizedHeader === normalizedVariation) {
      return true
    }
    
    // Contains match
    if (normalizedHeader.includes(normalizedVariation) || normalizedVariation.includes(normalizedHeader)) {
      return true
    }
    
    return false
  })
}

/**
 * Auto-detect column mappings from sheet headers
 * @param headers - Array of column headers from Google Sheets
 * @returns ColumnMapping object with detected column indices
 */
export function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  
  headers.forEach((header, index) => {
    if (!header || typeof header !== 'string') return
    
    // Detect name column
    if (!mapping.name && findBestMatch(header, NAME_COLUMN_VARIATIONS)) {
      mapping.name = header
    }
    
    // Detect email column
    else if (!mapping.email && findBestMatch(header, EMAIL_COLUMN_VARIATIONS)) {
      mapping.email = header
    }
    
    // Detect folder ID column
    else if (!mapping.folderId && findBestMatch(header, FOLDER_ID_VARIATIONS)) {
      mapping.folderId = header
    }
    
    // Detect sharing status column
    else if (!mapping.isShared && findBestMatch(header, IS_SHARED_VARIATIONS)) {
      mapping.isShared = header
    }
    
    // Detect folder existence column
    else if (!mapping.isFolderExists && findBestMatch(header, IS_FOLDER_EXISTS_VARIATIONS)) {
      mapping.isFolderExists = header
    }
    
    // Detect last log column
    else if (!mapping.lastLog && findBestMatch(header, LAST_LOG_VARIATIONS)) {
      mapping.lastLog = header
    }
  })
  
  return mapping
}

/**
 * Validate that required columns are present
 * @param mapping - Detected column mapping
 * @returns Validation result with missing columns
 */
export function validateColumns(mapping: ColumnMapping): {
  isValid: boolean
  missingColumns: string[]
  warnings: string[]
} {
  const missingColumns: string[] = []
  const warnings: string[] = []
  
  // Check required columns
  if (!mapping.name) {
    missingColumns.push('Nama/Name column')
  }
  
  if (!mapping.email) {
    missingColumns.push('Email column')
  }
  
  // Check optional but recommended columns
  if (!mapping.folderId) {
    warnings.push('FolderId column not found - will use name-based search')
  }
  
  if (!mapping.isShared) {
    warnings.push('isShared column not found - will be auto-added')
  }
  
  if (!mapping.isFolderExists) {
    warnings.push('isFolderExists column not found - will be auto-added')
  }
  
  if (!mapping.lastLog) {
    warnings.push('LastLog column not found - will be auto-added')
  }
  
  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    warnings
  }
}

/**
 * Extract participant data using detected column mapping
 * @param row - Row data from Google Sheets
 * @param headers - Headers array
 * @param mapping - Detected column mapping
 * @returns Normalized participant object
 */
export function extractParticipantData(
  row: any[],
  headers: string[],
  mapping: ColumnMapping
): any {
  const participant: any = {}
  
  headers.forEach((header, index) => {
    const value = row[index]
    
    if (header === mapping.name) {
      participant['Nama Lengkap'] = value || ''
    } else if (header === mapping.email) {
      participant['Email'] = value || ''
    } else if (header === mapping.folderId) {
      participant['FolderId'] = value || ''
    } else if (header === mapping.isShared) {
      participant['isShared'] = value === 'TRUE' || value === 'true' || value === '1' || value === true
    } else if (header === mapping.isFolderExists) {
      participant['isFolderExists'] = value === 'TRUE' || value === 'true' || value === '1' || value === true
    } else if (header === mapping.lastLog) {
      participant['LastLog'] = value || ''
    } else {
      // Keep original column as-is for any other data
      participant[header] = value
    }
  })
  
  return participant
}

/**
 * Get column statistics and recommendations
 * @param headers - Headers array
 * @param mapping - Detected column mapping
 * @returns Statistics and recommendations
 */
export function getColumnStats(headers: string[], mapping: ColumnMapping): {
  totalColumns: number
  detectedColumns: number
  mappedColumns: string[]
  unmappedColumns: string[]
  recommendations: string[]
} {
  const mappedColumns: string[] = []
  const unmappedColumns: string[] = []
  const recommendations: string[] = []
  
  headers.forEach(header => {
    let isMapped = false
    
    Object.values(mapping).forEach(mappedHeader => {
      if (header === mappedHeader) {
        mappedColumns.push(header)
        isMapped = true
      }
    })
    
    if (!isMapped) {
      unmappedColumns.push(header)
    }
  })
  
  // Generate recommendations
  if (!mapping.folderId && unmappedColumns.length > 0) {
    recommendations.push('Consider adding a FolderId column for better performance')
  }
  
  if (unmappedColumns.length > 5) {
    recommendations.push('Many unmapped columns detected - consider cleaning up the sheet structure')
  }
  
  if (!mapping.lastLog) {
    recommendations.push('Add a LastLog column to track operation timestamps')
  }
  
  return {
    totalColumns: headers.length,
    detectedColumns: mappedColumns.length,
    mappedColumns,
    unmappedColumns,
    recommendations
  }
}