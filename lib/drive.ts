import { google } from 'googleapis';
import auth from './google-auth';
import { searchFolder } from './folder-search';

/**
 * Google Drive API Service
 * This module provides functions to interact with Google Drive API
 * for creating folders and managing file permissions.
 */

// Initialize Google Drive API client
const drive = google.drive({ version: 'v3', auth });

/**
 * Create a new folder in Google Drive within a specified parent folder
 * @param folderName - Name of the folder to create
 * @param parentFolderId - ID of the parent folder where the new folder will be created
 * @returns Promise<string | null> - The ID of the newly created folder, or null if creation failed
 */
export async function createFolder(folderName: string, parentFolderId: string): Promise<string | null> {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      }
    });

    if (!response.data.id) {
      console.error('Failed to create folder: No folder ID returned');
      return null;
    }

    return response.data.id;
  } catch (error) {
    console.error('Error creating folder:', error);
    return null;
  }
}

/**
 * Share a folder in Google Drive with a specific user as viewer
 * @param folderId - ID of the folder to share
 * @param emailAddress - Email address of the user to share with
 * @returns Promise<boolean> - True if sharing was successful, false otherwise
 */
export async function shareFolder(folderId: string, emailAddress: string): Promise<boolean> {
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: emailAddress
      }
    });
    return true;
  } catch (error) {
    console.error('Error sharing folder:', error);
    return false;
  }
}

/**
 * Upload a PDF file to Google Drive within a specified folder
 * @param folderId - ID of the folder where the PDF will be uploaded
 * @param pdfBuffer - Buffer containing the PDF data
 * @param fileName - Name of the file to be created
 * @returns Promise<{ id: string; webViewLink: string } | null> - File ID and view link, or null if upload failed
 */
export async function uploadPdf(
  folderId: string, 
  pdfBuffer: Buffer, 
  fileName: string
): Promise<{ id: string; webViewLink: string } | null> {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'application/pdf',
        parents: [folderId]
      },
      media: {
        mimeType: 'application/pdf',
        body: pdfBuffer
      }
    });

    if (!response.data.id) {
      console.error('Failed to upload PDF: No file ID returned');
      return null;
    }

    // Get the web view link for the uploaded file
    const fileResponse = await drive.files.get({
      fileId: response.data.id,
      fields: 'webViewLink'
    });

    return {
      id: response.data.id,
      webViewLink: fileResponse.data.webViewLink || ''
    };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return null;
  }
}

/**
 * Find participant folder using advanced search
 * @param participantName - Name of the participant
 * @param folderId - Optional direct folder ID
 * @returns Promise<string | null> - The folder ID or null if not found
 */
export async function findParticipantFolder(
  participantName: string,
  folderId?: string
): Promise<{ 
  folderId: string | null, 
  found: boolean, 
  searchMethod: 'direct' | 'cache' | 'api_search',
  alternatives?: string[]
}> {
  try {
    // If direct folder ID is provided, use it
    if (folderId && folderId.trim()) {
      return {
        folderId: folderId.trim(),
        found: true,
        searchMethod: 'direct'
      }
    }

    // Use advanced folder search
    const searchResult = await searchFolder(participantName, {
      fuzzyMatch: true,
      cacheEnabled: true
    })

    if (searchResult.success && searchResult.folder) {
      return {
        folderId: searchResult.folder.id,
        found: true,
        searchMethod: searchResult.stats?.cacheHits ? 'cache' : 'api_search',
        alternatives: searchResult.alternatives?.map(alt => alt.id)
      }
    }

    return {
      folderId: null,
      found: false,
      searchMethod: 'api_search'
    }

  } catch (error) {
    console.error('Error finding participant folder:', error)
    return {
      folderId: null,
      found: false,
      searchMethod: 'api_search'
    }
  }
}

// Export the drive client for use in other functions
export { drive };