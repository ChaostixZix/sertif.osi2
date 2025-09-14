import { google } from 'googleapis';
import getAuthClient from './google-auth-optimized';

/**
 * Optimized Google APIs Service
 * Implements lazy initialization and connection pooling
 */

class GoogleAPIManager {
  private static instance: GoogleAPIManager;
  private sheetsClient: any = null;
  private driveClient: any = null;
  private lastAuthClient: any = null;

  static getInstance(): GoogleAPIManager {
    if (!GoogleAPIManager.instance) {
      GoogleAPIManager.instance = new GoogleAPIManager();
    }
    return GoogleAPIManager.instance;
  }

  async getSheetsClient() {
    const authClient = await getAuthClient();
    
    // Only recreate if auth client changed
    if (!this.sheetsClient || this.lastAuthClient !== authClient) {
      this.sheetsClient = google.sheets({ 
        version: 'v4', 
        auth: authClient,
        // Add connection pooling options
        timeout: 30000, // 30 second timeout
        retry: 3,
        retryDelay: 1000
      });
      this.lastAuthClient = authClient;
    }
    
    return this.sheetsClient;
  }

  async getDriveClient() {
    const authClient = await getAuthClient();
    
    // Only recreate if auth client changed
    if (!this.driveClient || this.lastAuthClient !== authClient) {
      this.driveClient = google.drive({ 
        version: 'v3', 
        auth: authClient,
        // Add connection pooling options
        timeout: 30000, // 30 second timeout
        retry: 3,
        retryDelay: 1000
      });
      this.lastAuthClient = authClient;
    }
    
    return this.driveClient;
  }

  async cleanup() {
    this.sheetsClient = null;
    this.driveClient = null;
    this.lastAuthClient = null;
  }
}

// Export singleton instance
const apiManager = GoogleAPIManager.getInstance();

// Export convenience functions
export async function getSheetsAPI() {
  return await apiManager.getSheetsClient();
}

export async function getDriveAPI() {
  return await apiManager.getDriveClient();
}

export async function cleanupAPIs() {
  await apiManager.cleanup();
}