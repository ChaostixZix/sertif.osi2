import { google } from 'googleapis';
import { getServiceAccountConfig } from './config';

/**
 * Optimized Google API JWT Authentication Client
 * Implements lazy initialization and proper cleanup
 */

class GoogleAuthManager {
  private static instance: GoogleAuthManager;
  private authClient: any = null;
  private lastConfigHash: string = '';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  static getInstance(): GoogleAuthManager {
    if (!GoogleAuthManager.instance) {
      GoogleAuthManager.instance = new GoogleAuthManager();
    }
    return GoogleAuthManager.instance;
  }

  private generateConfigHash(config: any): string {
    return JSON.stringify({
      email: config?.client_email,
      project_id: config?.project_id,
      private_key_id: config?.private_key_id
    });
  }

  private async createAuthClient(): Promise<any> {
    try {
      // Try to load from dynamic configuration first
      const serviceAccountConfig = getServiceAccountConfig();
      
      let configToUse = serviceAccountConfig;
      
      if (!serviceAccountConfig || !serviceAccountConfig.client_email || !serviceAccountConfig.private_key) {
        // Fallback to environment variables
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        
        if (!serviceAccountEmail || !privateKey) {
          throw new Error(
            'No service account configuration found. Please configure via admin panel or set environment variables.'
          );
        }
        
        configToUse = {
          client_email: serviceAccountEmail,
          private_key: privateKey
        };
      }

      const authClient = new google.auth.JWT({
        email: configToUse.client_email,
        key: configToUse.private_key.replace(/\\n/g, '\n'),
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive'
        ]
      });

      // Authorize the client
      await authClient.authorize();
      
      return authClient;
    } catch (error) {
      console.error('Failed to create Google Auth client:', error);
      throw error;
    }
  }

  async getAuthClient(): Promise<any> {
    const currentConfigHash = this.generateConfigHash(getServiceAccountConfig());
    
    // Check if we need to recreate the auth client
    if (!this.authClient || this.lastConfigHash !== currentConfigHash) {
      // Cleanup existing client
      if (this.authClient) {
        try {
          // Revoke any existing tokens
          if (this.authClient.revokeCredentials) {
            await this.authClient.revokeCredentials();
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      
      // Create new client
      this.authClient = await this.createAuthClient();
      this.lastConfigHash = currentConfigHash;
    }

    return this.authClient;
  }

  async cleanup(): Promise<void> {
    if (this.authClient) {
      try {
        if (this.authClient.revokeCredentials) {
          await this.authClient.revokeCredentials();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
      this.authClient = null;
    }
    this.lastConfigHash = '';
  }

  // Method to force refresh auth client
  async refreshAuthClient(): Promise<any> {
    await this.cleanup();
    return await this.getAuthClient();
  }
}

// Export singleton instance
const authManager = GoogleAuthManager.getInstance();

// Export convenience function
export default async function getAuthClient() {
  return await authManager.getAuthClient();
}

// Export cleanup function
export async function cleanupAuth() {
  await authManager.cleanup();
}

// Export refresh function
export async function refreshAuth() {
  return await authManager.refreshAuthClient();
}