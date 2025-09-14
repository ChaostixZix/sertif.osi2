import { z } from 'zod';
import { google } from 'googleapis';
import auth from './google-auth';
import { getActiveSheets, getDriveConfig } from './config';
import { detectColumns, validateColumns, extractParticipantData } from './column-detector';

/**
 * Google Sheets API Service
 * This module handles all interactions with the Google Sheets API,
 * including reading participant data and updating metadata columns.
 */

// Define the Participant schema based on Google Sheet structure
export const ParticipantSchema = z.object({
  // Participant details (from the main columns)
  'Nama Lengkap': z.string().optional(),
  'Email': z.string().email().optional(),
  'Nomor Telepon': z.string().optional(),
  'Instansi': z.string().optional(),
  'Jabatan': z.string().optional(),
  'Timestamp': z.string().optional(),
  
  // Metadata columns (will be populated by the system)
  'FolderId': z.string().optional(),
  'isShared': z.boolean().optional(),
  'isFolderExists': z.boolean().optional(),
  'isCertificateGenerated': z.boolean().optional(),
  'certificateLink': z.string().optional(),
  
  // Internal field for tracking row index
  rowIndex: z.number()
});

// Export the inferred type
export type Participant = z.infer<typeof ParticipantSchema>;

// Initialize Google Sheets API client
const sheets = google.sheets({ version: 'v4', auth });

/**
 * Fetches all participant data from the Google Sheet
 * @returns Promise<{ data: Participant[] | null, error: string | null }>
 */
export async function getParticipants(): Promise<{ data: Participant[] | null, error: string | null }> {
  try {
    // Validate environment variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = process.env.GOOGLE_SHEET_RANGE;
    
    if (!sheetId || !range) {
      throw new Error('Missing required environment variables: GOOGLE_SHEET_ID and GOOGLE_SHEET_RANGE');
    }

    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { data: [], error: null };
    }

    // Assume first row contains headers
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Detect column mappings automatically
    const columnMapping = detectColumns(headers);
    const validation = validateColumns(columnMapping);
    
    if (!validation.isValid) {
      throw new Error(`Missing required columns: ${validation.missingColumns.join(', ')}`);
    }
    
    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Sheet validation warnings:', validation.warnings);
    }

    // Map data rows to participant objects using smart column detection
    const participants: Participant[] = dataRows.map((row, index) => {
      // Extract participant data using detected columns
      const participant = extractParticipantData(row, headers, columnMapping);
      
      // Add row index for tracking
      participant.rowIndex = index + 2; // +2 because we skip header and 0-indexed
      
      return participant;
    });

    // Validate each participant against the schema
    const validatedParticipants = participants.map(participant => {
      try {
        return ParticipantSchema.parse(participant);
      } catch (error) {
        console.warn('Invalid participant data:', participant, error);
        return participant; // Return as-is if validation fails
      }
    });

    return { data: validatedParticipants, error: null };
  } catch (error) {
    console.error('Error fetching participants:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Fetches a single participant by row index from the Google Sheet
 * @param participantId - The row index (1-based) of the participant
 * @returns Promise<{ data: Participant | null, error: string | null }>
 */
export async function getParticipantById(participantId: string): Promise<{ data: Participant | null, error: string | null }> {
  try {
    // Validate environment variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = process.env.GOOGLE_SHEET_RANGE;
    
    if (!sheetId || !range) {
      throw new Error('Missing required environment variables: GOOGLE_SHEET_ID and GOOGLE_SHEET_RANGE');
    }

    // Extract sheet name from range (e.g., "Sheet1!A1:Z1000" -> "Sheet1")
    const sheetName = range.split('!')[0];
    const columnRange = range.split('!')[1]; // e.g., "A1:Z1000"
    
    // Extract column letters (e.g., "A1:Z1000" -> "A:Z")
    const columnMatch = columnRange.match(/([A-Z]+)\d+:([A-Z]+)\d+/);
    if (!columnMatch) {
      throw new Error('Invalid range format');
    }
    
    const startCol = columnMatch[1];
    const endCol = columnMatch[2];
    
    // Construct range for specific row (e.g., "Sheet1!A2:Z2")
    const rowRange = `${sheetName}!${startCol}${participantId}:${endCol}${participantId}`;

    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: rowRange,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { data: null, error: 'Participant not found' };
    }

    // Get headers from the first row of the full range
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!${startCol}1:${endCol}1`,
    });

    const headers = headerResponse.data.values?.[0];
    if (!headers) {
      throw new Error('Could not fetch headers');
    }

    // Map the single row to participant object
    const row = rows[0];
    const participant: any = { rowIndex: parseInt(participantId) };
    
    // Map each column to its corresponding header
    headers.forEach((header, colIndex) => {
      const value = row[colIndex];
      if (value !== undefined) {
        // Handle boolean values for metadata columns
        if (header === 'isShared' || header === 'isFolderExists') {
          participant[header] = value === 'TRUE' || value === 'true' || value === '1';
        } else {
          participant[header] = value;
        }
      }
    });

    // Validate participant against the schema
    try {
      const validatedParticipant = ParticipantSchema.parse(participant);
      return { data: validatedParticipant, error: null };
    } catch (error) {
      console.warn('Invalid participant data:', participant, error);
      return { data: participant, error: null }; // Return as-is if validation fails
    }
  } catch (error) {
    console.error('Error fetching participant by ID:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Updates participant metadata in the Google Sheet
 * @param rowIndex - The row index (1-based) to update
 * @param metadata - Object containing FolderId, isShared, and isFolderExists
 * @returns Promise<{ success: boolean, error: string | null }>
 */
export async function updateParticipantMetadata(
  rowIndex: number, 
  metadata: { FolderId?: string; isShared?: boolean; isFolderExists?: boolean }
): Promise<{ success: boolean, error: string | null }> {
  try {
    // Validate environment variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = process.env.GOOGLE_SHEET_RANGE;
    
    if (!sheetId || !range) {
      throw new Error('Missing required environment variables: GOOGLE_SHEET_ID and GOOGLE_SHEET_RANGE');
    }

    // Extract sheet name from range (e.g., "Sheet1!A1:Z1000" -> "Sheet1")
    const sheetName = range.split('!')[0];
    
    // Determine the column range for metadata (assuming G, H, I columns for FolderId, isShared, isFolderExists)
    // This is a simplified approach - in a real implementation, you'd want to dynamically find these columns
    const metadataRange = `${sheetName}!G${rowIndex}:I${rowIndex}`;
    
    // Prepare the values array
    const values = [
      [
        metadata.FolderId || '',
        metadata.isShared ? 'TRUE' : 'FALSE',
        metadata.isFolderExists ? 'TRUE' : 'FALSE'
      ]
    ];

    // Update the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: metadataRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values
      }
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating participant metadata:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Updates a complete row in the Google Sheet
 * @param rowIndex - The row index (1-based) to update
 * @param values - Array of values to update the entire row
 * @returns Promise<{ success: boolean, error: string | null }>
 */
export async function updateSheetRow(
  rowIndex: number, 
  values: any[]
): Promise<{ success: boolean, error: string | null }> {
  try {
    // Validate environment variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = process.env.GOOGLE_SHEET_RANGE;
    
    if (!sheetId || !range) {
      throw new Error('Missing required environment variables: GOOGLE_SHEET_ID and GOOGLE_SHEET_RANGE');
    }

    // Extract sheet name from range (e.g., "Sheet1!A1:Z1000" -> "Sheet1")
    const sheetName = range.split('!')[0];
    const columnRange = range.split('!')[1]; // e.g., "A1:Z1000"
    
    // Extract column letters (e.g., "A1:Z1000" -> "A:Z")
    const columnMatch = columnRange.match(/([A-Z]+)\d+:([A-Z]+)\d+/);
    if (!columnMatch) {
      throw new Error('Invalid range format');
    }
    
    const startCol = columnMatch[1];
    const endCol = columnMatch[2];
    
    // Construct range for specific row (e.g., "Sheet1!A2:Z2")
    const rowRange = `${sheetName}!${startCol}${rowIndex}:${endCol}${rowIndex}`;
    
    console.log('Updating sheet row:', rowIndex, 'with range:', rowRange);

    // Update the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: rowRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values]
      }
    });

    console.log('✅ Sheet row updated successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating sheet row:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Deletes a row from the Google Sheet
 * @param rowIndex - The row index (1-based) to delete
 * @returns Promise<{ success: boolean, error: string | null }>
 */
export async function deleteSheetRow(
  rowIndex: number
): Promise<{ success: boolean, error: string | null }> {
  try {
    // Validate environment variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = process.env.GOOGLE_SHEET_RANGE;
    
    if (!sheetId || !range) {
      throw new Error('Missing required environment variables: GOOGLE_SHEET_ID and GOOGLE_SHEET_RANGE');
    }

    // Extract sheet name from range to get sheet ID
    const sheetName = range.split('!')[0];
    
    // Get sheet information to find the sheet ID
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId
    });
    
    const sheet = sheetInfo.data.sheets?.find(s => s.properties?.title === sheetName);
    if (!sheet || !sheet.properties?.sheetId) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    const sheetIdNumber = sheet.properties.sheetId;
    
    console.log('Deleting sheet row:', rowIndex, 'from sheet:', sheetName, 'sheetId:', sheetIdNumber);

    // Delete the row using batchUpdate
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetIdNumber,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // Convert to 0-based index
              endIndex: rowIndex
            }
          }
        }]
      }
    });

    console.log('✅ Sheet row deleted successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting sheet row:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}