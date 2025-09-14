import { google } from 'googleapis';
import { getServiceAccountConfig } from './config';

/**
 * Google API JWT Authentication Client
 * This module configures a JWT client for server-side Google API access
 * using either dynamic service account credentials or fallback environment variables.
 */

/**
 * Create authenticated Google client
 * Tries to load from dynamic config first, then falls back to environment variables
 */
function createGoogleAuth() {
  try {
    // Try to load from dynamic configuration
    const serviceAccountConfig = getServiceAccountConfig();
    
    if (serviceAccountConfig && serviceAccountConfig.client_email && serviceAccountConfig.private_key) {
      console.log('Using dynamic service account configuration');
      return new google.auth.JWT({
        email: serviceAccountConfig.client_email,
        key: serviceAccountConfig.private_key.replace(/\\n/g, '\n'),
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive'
        ]
      });
    }
    
    // Fallback to environment variables
    console.log('Using environment variable configuration');
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    if (!serviceAccountEmail || !privateKey) {
      throw new Error(
        'No service account configuration found. Please configure via admin panel or set environment variables.'
      );
    }
    
    return new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });
    
  } catch (error) {
    console.error('Failed to create Google Auth client:', error);
    throw error;
  }
}

// Create and export the configured JWT client
const auth = createGoogleAuth();
export default auth;