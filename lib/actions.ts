'use server'

import { revalidatePath } from 'next/cache';
import auth from './google-auth';
import { createFolder, shareFolder, uploadPdf } from './drive';
import { updateParticipantMetadata, type Participant } from './sheets';
import { renderCertificateHTML, generatePdfBuffer } from '@/app/actions/pdf';

/**
 * Test server action to verify Google API authentication
 * This is a temporary action to test the authentication flow.
 */
export async function testGoogleAuth() {
  try {
    console.log('Testing Google API authentication...');
    
    // Test authorization
    await auth.authorize();
    
    console.log('✅ Google API authentication successful!');
    console.log('Service account email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('Google Sheet ID:', process.env.GOOGLE_SHEET_ID);
    
    return { 
      success: true, 
      message: 'Google API authentication successful!' 
    };
  } catch (error) {
    console.error('❌ Google API authentication failed:', error);
    return { 
      success: false, 
      message: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Test server action to verify Google Drive API functions
 * This creates a test folder and shares it with a specified email.
 */
export async function testDriveService(testName: string = 'Test Folder', testEmail: string) {
  try {
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!parentFolderId) {
      return {
        success: false,
        message: 'GOOGLE_DRIVE_FOLDER_ID not configured in environment variables'
      };
    }

    console.log('Testing Google Drive service...');
    
    // Test folder creation
    const folderName = `${testName} - ${new Date().toISOString()}`;
    const folderId = await createFolder(folderName, parentFolderId);
    
    if (!folderId) {
      return {
        success: false,
        message: 'Failed to create folder in Google Drive'
      };
    }

    console.log('✅ Folder created successfully:', folderId);
    
    // Test folder sharing
    const shareSuccess = await shareFolder(folderId, testEmail);
    
    if (!shareSuccess) {
      return {
        success: false,
        message: 'Folder created but failed to share'
      };
    }

    console.log('✅ Folder shared successfully with:', testEmail);
    
    return {
      success: true,
      message: `Drive service test successful! Folder "${folderName}" created and shared with ${testEmail}`,
      folderId
    };
  } catch (error) {
    console.error('❌ Google Drive service test failed:', error);
    return {
      success: false,
      message: `Drive service test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Server action to create a folder for a participant in Google Drive
 * and update the Google Sheet with folder metadata
 */
export async function createParticipantFolder(participantData: Participant) {
  try {
    // Validate input data
    if (!participantData || !participantData.rowIndex) {
      return {
        success: false,
        message: 'Invalid participant data provided'
      };
    }

    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!parentFolderId) {
      console.error('❌ Missing GOOGLE_DRIVE_FOLDER_ID environment variable');
      return {
        success: false,
        message: 'Server configuration error: Missing folder configuration'
      };
    }

    // Create folder name using participant's name
    const participantName = participantData['Nama Lengkap'] || `Participant ${participantData.rowIndex}`;
    const folderName = `${participantName} - Certificate Folder`;

    console.log('Creating folder for participant:', participantName);
    
    // Create folder in Google Drive
    const folderId = await createFolder(folderName, parentFolderId);
    
    if (!folderId) {
      console.error('❌ Google Drive API failed to create folder');
      return {
        success: false,
        message: 'Failed to create folder in Google Drive. Please check your permissions and try again.'
      };
    }

    console.log('✅ Folder created successfully:', folderId);
    
    // Update Google Sheet with folder metadata
    const updateResult = await updateParticipantMetadata(participantData.rowIndex, {
      FolderId: folderId,
      isFolderExists: true,
      isShared: false
    });

    if (!updateResult.success) {
      console.error('❌ Failed to update Google Sheet:', updateResult.error);
      return {
        success: false,
        message: `Folder created but failed to update sheet. Please refresh the page and try again. Error: ${updateResult.error}`
      };
    }

    console.log('✅ Sheet updated successfully');
    
    // Revalidate the dashboard path to trigger UI refresh
    revalidatePath('/');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      message: `Folder "${folderName}" created successfully and sheet updated!`,
      folderId
    };
  } catch (error) {
    console.error('❌ Failed to create participant folder:', error);
    
    // Provide user-friendly error messages based on error type
    let userMessage = 'Failed to create participant folder. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('auth') || error.message.includes('Auth')) {
        userMessage = 'Authentication failed. Please check Google API credentials.';
      } else if (error.message.includes('permission') || error.message.includes('Permission')) {
        userMessage = 'Permission denied. Please check Google Drive permissions.';
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        userMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('quota') || error.message.includes('Quota')) {
        userMessage = 'API quota exceeded. Please try again later.';
      }
    }
    
    return {
      success: false,
      message: userMessage
    };
  }
}

/**
 * Server action to share a participant's folder via email
 * and update the Google Sheet to mark it as shared
 */
export async function shareFolderWithParticipant(participantData: Participant) {
  try {
    // Validate input data
    if (!participantData || !participantData.rowIndex || !participantData.FolderId || !participantData.Email) {
      return {
        success: false,
        message: 'Invalid participant data: Missing required fields (rowIndex, FolderId, or Email)'
      };
    }

    // Check if folder already exists
    if (!participantData.isFolderExists) {
      return {
        success: false,
        message: 'Cannot share folder: No folder exists for this participant'
      };
    }

    // Check if folder is already shared
    if (participantData.isShared) {
      return {
        success: false,
        message: 'Folder is already shared with this participant'
      };
    }

    const participantName = participantData['Nama Lengkap'] || `Participant ${participantData.rowIndex}`;
    console.log('Sharing folder with participant:', participantName, 'Email:', participantData.Email);

    // Share folder via Google Drive API
    const shareSuccess = await shareFolder(participantData.FolderId, participantData.Email);
    
    if (!shareSuccess) {
      console.error('❌ Google Drive API failed to share folder');
      return {
        success: false,
        message: 'Failed to share folder via Google Drive. Please check permissions and try again.'
      };
    }

    console.log('✅ Folder shared successfully via Google Drive');
    
    // Update Google Sheet with sharing status
    const updateResult = await updateParticipantMetadata(participantData.rowIndex, {
      isShared: true
    });

    if (!updateResult.success) {
      console.error('❌ Failed to update Google Sheet sharing status:', updateResult.error);
      return {
        success: false,
        message: `Folder shared but failed to update sheet. Please refresh and try again. Error: ${updateResult.error}`
      };
    }

    console.log('✅ Sheet updated with sharing status');
    
    // Revalidate the dashboard path to trigger UI refresh
    revalidatePath('/');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      message: `Folder successfully shared with ${participantData.Email}!`,
      folderId: participantData.FolderId
    };
  } catch (error) {
    console.error('❌ Failed to share folder with participant:', error);
    
    // Provide user-friendly error messages based on error type
    let userMessage = 'Failed to share folder. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('auth') || error.message.includes('Auth')) {
        userMessage = 'Authentication failed. Please check Google API credentials.';
      } else if (error.message.includes('permission') || error.message.includes('Permission')) {
        userMessage = 'Permission denied. Please check Google Drive sharing permissions.';
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        userMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('quota') || error.message.includes('Quota')) {
        userMessage = 'API quota exceeded. Please try again later.';
      } else if (error.message.includes('email') || error.message.includes('Email')) {
        userMessage = 'Invalid email address. Please check the participant email and try again.';
      }
    }
    
    return {
      success: false,
      message: userMessage
    };
  }
}

/**
 * Server action to generate and upload certificate PDF to Google Drive
 * This orchestrates the PDF generation and upload process
 */
export async function generateAndUploadCertificate(participantData: Participant) {
  try {
    // Validate input data
    if (!participantData || !participantData.rowIndex) {
      return {
        success: false,
        message: 'Invalid participant data provided'
      };
    }

    // Check if folder exists
    if (!participantData.isFolderExists || !participantData.FolderId) {
      return {
        success: false,
        message: 'Cannot generate certificate: No folder exists for this participant. Please create a folder first.'
      };
    }

    const participantName = participantData['Nama Lengkap'] || `Participant ${participantData.rowIndex}`;
    console.log('Generating certificate for participant:', participantName);

    // Step 1: Generate PDF buffer
    console.log('Step 1: Rendering certificate HTML...');
    const htmlContent = await renderCertificateHTML(participantData);
    
    console.log('Step 2: Generating PDF buffer...');
    const pdfBuffer = await generatePdfBuffer(htmlContent);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('❌ PDF generation failed: Empty buffer');
      return {
        success: false,
        message: 'Failed to generate PDF certificate. Please try again.'
      };
    }

    console.log('✅ PDF generated successfully, buffer size:', pdfBuffer.length);

    // Step 2: Upload PDF to Google Drive
    const fileName = `Certificate - ${participantName}.pdf`;
    console.log('Step 3: Uploading PDF to Google Drive...');
    
    const uploadResult = await uploadPdf(participantData.FolderId, pdfBuffer, fileName);
    
    if (!uploadResult) {
      console.error('❌ PDF upload failed');
      return {
        success: false,
        message: 'Failed to upload certificate to Google Drive. Please check permissions and try again.'
      };
    }

    console.log('✅ PDF uploaded successfully:', uploadResult.id);

    // Step 3: Update Google Sheet with certificate information
    console.log('Step 4: Updating Google Sheet...');
    const updateResult = await updateParticipantMetadata(participantData.rowIndex, {
      isCertificateGenerated: true,
      certificateLink: uploadResult.webViewLink
    });

    if (!updateResult.success) {
      console.error('❌ Failed to update Google Sheet:', updateResult.error);
      return {
        success: false,
        message: `Certificate generated and uploaded but failed to update sheet. Please refresh and try again. Error: ${updateResult.error}`
      };
    }

    console.log('✅ Sheet updated with certificate information');

    // Revalidate the dashboard path to trigger UI refresh
    revalidatePath('/');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: `Certificate "${fileName}" generated and uploaded successfully!`,
      certificateLink: uploadResult.webViewLink,
      fileId: uploadResult.id
    };
  } catch (error) {
    console.error('❌ Failed to generate and upload certificate:', error);
    
    // Provide user-friendly error messages based on error type
    let userMessage = 'Failed to generate certificate. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('auth') || error.message.includes('Auth')) {
        userMessage = 'Authentication failed. Please check Google API credentials.';
      } else if (error.message.includes('permission') || error.message.includes('Permission')) {
        userMessage = 'Permission denied. Please check Google Drive permissions.';
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        userMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('quota') || error.message.includes('Quota')) {
        userMessage = 'API quota exceeded. Please try again later.';
      } else if (error.message.includes('PDF') || error.message.includes('pdf')) {
        userMessage = 'PDF generation failed. Please check server configuration and try again.';
      }
    }
    
    return {
      success: false,
      message: userMessage
    };
  }
}

/**
 * Server action to generate certificate PDF for download
 * This generates a PDF buffer without uploading to Google Drive
 */
export async function generateCertificatePdf(participantData: Participant) {
  try {
    // Validate input data
    if (!participantData || !participantData.rowIndex) {
      return {
        success: false,
        message: 'Invalid participant data provided',
        pdfBuffer: null
      };
    }

    const participantName = participantData['Nama Lengkap'] || `Participant ${participantData.rowIndex}`;
    console.log('Generating PDF for download:', participantName);

    // Generate PDF buffer
    const htmlContent = await renderCertificateHTML(participantData);
    const pdfBuffer = await generatePdfBuffer(htmlContent);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('❌ PDF generation failed: Empty buffer');
      return {
        success: false,
        message: 'Failed to generate PDF certificate. Please try again.',
        pdfBuffer: null
      };
    }

    console.log('✅ PDF generated successfully for download, buffer size:', pdfBuffer.length);

    return {
      success: true,
      message: `Certificate PDF generated successfully!`,
      pdfBuffer: pdfBuffer
    };
  } catch (error) {
    console.error('❌ Failed to generate certificate PDF:', error);
    
    // Provide user-friendly error messages based on error type
    let userMessage = 'Failed to generate certificate PDF. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('PDF') || error.message.includes('pdf')) {
        userMessage = 'PDF generation failed. Please check server configuration and try again.';
      }
    }
    
    return {
      success: false,
      message: userMessage,
      pdfBuffer: null
    };
  }
}

/**
 * Server action to update participant data in Google Sheets
 * This allows editing participant information directly from the dashboard
 */
export async function updateParticipantAction(participantData: Participant) {
  try {
    // Validate input data
    if (!participantData || !participantData.rowIndex) {
      return {
        success: false,
        message: 'Invalid participant data provided'
      };
    }

    const participantName = participantData['Nama Lengkap'] || `Participant ${participantData.rowIndex}`;
    console.log('Updating participant data:', participantName);

    // Update Google Sheet with new participant data
    const updateResult = await updateParticipantMetadata(participantData.rowIndex, {
      'Nama Lengkap': participantData['Nama Lengkap'],
      'Email': participantData.Email,
      'Nomor Telepon': participantData['Nomor Telepon'],
      'Instansi': participantData.Instansi,
      'Jabatan': participantData.Jabatan
    });

    if (!updateResult.success) {
      console.error('❌ Failed to update Google Sheet:', updateResult.error);
      return {
        success: false,
        message: `Failed to update participant data. Please try again. Error: ${updateResult.error}`
      };
    }

    console.log('✅ Participant data updated successfully');

    // Revalidate the dashboard path to trigger UI refresh
    revalidatePath('/');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: `Data peserta "${participantName}" berhasil diperbarui!`
    };
  } catch (error) {
    console.error('❌ Failed to update participant data:', error);
    
    // Provide user-friendly error messages based on error type
    let userMessage = 'Failed to update participant data. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('auth') || error.message.includes('Auth')) {
        userMessage = 'Authentication failed. Please check Google API credentials.';
      } else if (error.message.includes('permission') || error.message.includes('Permission')) {
        userMessage = 'Permission denied. Please check Google Sheets permissions.';
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        userMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('quota') || error.message.includes('Quota')) {
        userMessage = 'API quota exceeded. Please try again later.';
      }
    }
    
    return {
      success: false,
      message: userMessage
    };
  }
}