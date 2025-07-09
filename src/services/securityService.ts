
import { supabase } from '@/integrations/supabase/client';
import CryptoJS from 'crypto-js';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileHash?: string;
}

export interface MalwareScanResult {
  isClean: boolean;
  scanId?: string;
  threatName?: string;
  scanDate: Date;
}

export class SecurityService {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly ALLOWED_EXTENSIONS = ['.jar'];
  private static readonly VIRUSTOTAL_API_URL = 'https://www.virustotal.com/vtapi/v2';

  static validateFile(file: File): FileValidationResult {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds 100MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `Invalid file type. Only .jar files are allowed.`
      };
    }

    // Check file name for malicious patterns
    const maliciousPatterns = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /\0/,  // Null bytes
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(file.name)) {
        return {
          isValid: false,
          error: 'File name contains invalid characters.'
        };
      }
    }

    return { isValid: true };
  }

  static async calculateFileHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
        const hash = CryptoJS.SHA256(wordArray).toString();
        resolve(hash);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  static async scanFileForMalware(file: File, fileHash: string): Promise<MalwareScanResult> {
    // In a real implementation, you would integrate with VirusTotal or similar service
    // For now, we'll simulate a malware scan
    
    console.log(`Scanning file: ${file.name}, Hash: ${fileHash}`);
    
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simple heuristic checks
    const suspiciousPatterns = [
      'virus', 'malware', 'trojan', 'backdoor', 'exploit'
    ];

    const fileName = file.name.toLowerCase();
    const isSuspicious = suspiciousPatterns.some(pattern => fileName.includes(pattern));

    if (isSuspicious) {
      return {
        isClean: false,
        threatName: 'Suspicious filename pattern detected',
        scanDate: new Date()
      };
    }

    // Check file size anomalies (very small or very large files might be suspicious)
    if (file.size < 1024) { // Less than 1KB
      return {
        isClean: false,
        threatName: 'File size anomaly - too small for a valid JAR',
        scanDate: new Date()
      };
    }

    return {
      isClean: true,
      scanDate: new Date()
    };
  }

  static async checkUserRole(userId: string): Promise<string | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking user role:', error);
        return null;
      }

      return profile?.role || 'user';
    } catch (error) {
      console.error('Error checking user role:', error);
      return null;
    }
  }

  static async isAuthorizedForRoleChange(currentUserId: string, targetRole: string): Promise<boolean> {
    const currentUserRole = await this.checkUserRole(currentUserId);
    
    // Only managers can change roles
    if (currentUserRole !== 'manager') {
      return false;
    }

    // Managers can assign moderator or user roles, but not manager roles
    return ['user', 'moderator'].includes(targetRole);
  }

  static async logRoleChange(targetUserId: string, oldRole: string, newRole: string, changedBy: string, reason?: string): Promise<void> {
    try {
      await supabase
        .from('role_audit_log')
        .insert({
          target_user_id: targetUserId,
          old_role: oldRole,
          new_role: newRole,
          changed_by: changedBy,
          reason: reason || 'Role change via dashboard'
        });
    } catch (error) {
      console.error('Error logging role change:', error);
    }
  }

  static sanitizeInput(input: string): string {
    // Remove potentially dangerous HTML/script tags
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .trim();
  }

  static validatePackageData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.length < 3) {
      errors.push('Package name must be at least 3 characters long');
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(data.name)) {
      errors.push('Package name can only contain letters, numbers, dots, hyphens, and underscores');
    }

    if (!data.description || data.description.length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }

    if (!data.version || !/^\d+\.\d+\.\d+$/.test(data.version)) {
      errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
    }

    if (!data.githubRepo || !this.isValidGitHubUrl(data.githubRepo)) {
      errors.push('Invalid GitHub repository URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async recordSecureDownload(versionId: string): Promise<void> {
    // Validate that the version is safe to download
    const { data: versionData, error: versionError } = await supabase
      .from('package_versions')
      .select('malware_scan_status, package_namespace_id')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;

    // Block download if infected
    if (versionData.malware_scan_status === 'infected') {
      throw new Error('Download blocked: File contains malware');
    }

    if (versionData.malware_scan_status === 'pending') {
      throw new Error('Download blocked: File scan in progress');
    }

    // Record download analytics
    await supabase
      .from('download_analytics')
      .insert({
        package_id: versionId,
        ip_address: null, // Would be set by backend
        user_agent: navigator.userAgent
      });
  }

  private static isValidGitHubUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'github.com' && urlObj.pathname.includes('/');
    } catch {
      return false;
    }
  }
}
