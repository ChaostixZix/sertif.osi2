import { z } from 'zod';
import { google } from 'googleapis';
import auth from './google-auth';
import { getActiveSheets, type SheetConfig } from './config';
import { ParticipantSchema, type Participant } from './sheets';

/**
 * Multi-Sheets API Service
 * This module handles interactions with multiple Google Sheets
 * based on dynamic configuration.
 */

// Initialize Google Sheets API client
const sheets = google.sheets({ version: 'v4', auth });

/**
 * Fetches all participant data from all configured active sheets
 * @returns Promise<{ data: Array<{ sheetName: string, participants: Participant[] }> | null, error: string | null }>
 */
export async function getAllParticipantsFromAllSheets(): Promise<{ 
  data: Array<{ sheetName: string, participants: Participant[] }> | null, 
  error: string | null 
}> {
  try {
    const activeSheets = getActiveSheets();
    
    if (activeSheets.length === 0) {
      return { 
        data: null, 
        error: 'No active sheets configured. Please configure sheets in admin panel.' 
      };
    }
    
    const results = [];
    
    // Fetch data from each active sheet
    for (const sheetConfig of activeSheets) {
      try {
        const sheetData = await getParticipantsFromSheet(sheetConfig);
        if (sheetData.data) {
          results.push({
            sheetName: sheetConfig.name,
            participants: sheetData.data
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch data from sheet ${sheetConfig.name}:`, error);
        // Continue with other sheets even if one fails
      }
    }
    
    return { data: results, error: null };
  } catch (error) {
    console.error('Error fetching participants from all sheets:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Fetches participant data from a specific sheet configuration
 * @param sheetConfig - The sheet configuration to fetch data from
 * @returns Promise<{ data: Participant[] | null, error: string | null }>
 */
export async function getParticipantsFromSheet(sheetConfig: SheetConfig): Promise<{ 
  data: Participant[] | null, 
  error: string | null 
}> {
  try {
    if (!sheetConfig.sheetId || !sheetConfig.range) {
      throw new Error(`Invalid sheet configuration for ${sheetConfig.name}`);
    }

    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetConfig.sheetId,
      range: sheetConfig.range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { data: [], error: null };
    }

    // Assume first row contains headers
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Map data rows to participant objects
    const participants: Participant[] = dataRows.map((row, index) => {
      const participant: any = { 
        rowIndex: index + 2, // +2 because we skip header and 0-indexed
        sourceSheet: sheetConfig.name // Add source sheet identifier
      };
      
      // Map each column to its corresponding header
      headers.forEach((header, colIndex) => {
        const value = row[colIndex];
        if (value !== undefined) {
          // Handle boolean values for metadata columns
          if (header === 'isShared' || header === 'isFolderExists' || header === 'isCertificateGenerated') {
            participant[header] = value === 'TRUE' || value === 'true' || value === '1';
          } else {
            participant[header] = value;
          }
        }
      });

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
    console.error('Error fetching participants from sheet:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Find a participant by ID across all active sheets
 * @param participantId - The participant identifier (could be email or row index)
 * @returns Promise<{ data: { participant: Participant, sheetConfig: SheetConfig } | null, error: string | null }>
 */
export async function findParticipantAcrossSheets(participantId: string): Promise<{
  data: { participant: Participant, sheetConfig: SheetConfig } | null,
  error: string | null
}> {
  try {
    const activeSheets = getActiveSheets();
    
    for (const sheetConfig of activeSheets) {
      try {
        const sheetData = await getParticipantsFromSheet(sheetConfig);
        if (sheetData.data) {
          // Try to find participant by email first, then by row index
          const participant = sheetData.data.find(p => 
            p.Email === participantId || 
            p.rowIndex?.toString() === participantId
          );
          
          if (participant) {
            return {
              data: { participant, sheetConfig },
              error: null
            };
          }
        }
      } catch (error) {
        console.warn(`Error searching in sheet ${sheetConfig.name}:`, error);
        // Continue searching in other sheets
      }
    }
    
    return { 
      data: null, 
      error: 'Participant not found in any configured sheet' 
    };
  } catch (error) {
    console.error('Error finding participant across sheets:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Update participant metadata in a specific sheet
 * @param sheetConfig - The sheet configuration
 * @param rowIndex - The row index (1-based) to update
 * @param metadata - Object containing metadata to update
 * @returns Promise<{ success: boolean, error: string | null }>
 */
export async function updateParticipantInSheet(
  sheetConfig: SheetConfig,
  rowIndex: number, 
  metadata: { FolderId?: string; isShared?: boolean; isFolderExists?: boolean; isCertificateGenerated?: boolean; certificateLink?: string }
): Promise<{ success: boolean, error: string | null }> {
  try {
    if (!sheetConfig.sheetId || !sheetConfig.range) {
      throw new Error(`Invalid sheet configuration for ${sheetConfig.name}`);
    }

    // Extract sheet name from range
    const sheetName = sheetConfig.range.split('!')[0];
    
    // Determine the column range for metadata (simplified approach)
    // In a real implementation, you'd want to dynamically find these columns
    const metadataRange = `${sheetName}!G${rowIndex}:K${rowIndex}`;
    
    // Prepare the values array
    const values = [
      [
        metadata.FolderId || '',
        metadata.isShared ? 'TRUE' : 'FALSE',
        metadata.isFolderExists ? 'TRUE' : 'FALSE',
        metadata.isCertificateGenerated ? 'TRUE' : 'FALSE',
        metadata.certificateLink || ''
      ]
    ];

    // Update the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetConfig.sheetId,
      range: metadataRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values
      }
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating participant in sheet:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get sheet statistics
 * @returns Promise<{ data: Array<{ sheetName: string, participantCount: number }> | null, error: string | null }>
 */
export async function getSheetStatistics(): Promise<{
  data: Array<{ sheetName: string, participantCount: number, lastUpdated?: string }> | null,
  error: string | null
}> {
  try {
    const activeSheets = getActiveSheets();
    const statistics = [];
    
    for (const sheetConfig of activeSheets) {
      try {
        const sheetData = await getParticipantsFromSheet(sheetConfig);
        statistics.push({
          sheetName: sheetConfig.name,
          participantCount: sheetData.data ? sheetData.data.length : 0,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.warn(`Failed to get stats for sheet ${sheetConfig.name}:`, error);
        statistics.push({
          sheetName: sheetConfig.name,
          participantCount: 0,
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    return { data: statistics, error: null };
  } catch (error) {
    console.error('Error getting sheet statistics:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}