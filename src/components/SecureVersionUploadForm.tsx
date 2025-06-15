
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, GitBranch, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePackages } from '@/hooks/usePackages';
import { SecurityService } from '@/services/securityService';
import { supabase } from '@/integrations/supabase/client';

interface SecureVersionUploadFormProps {
  package: any;
  onClose: () => void;
  onVersionUploaded?: () => void;
}

const SecureVersionUploadForm: React.FC<SecureVersionUploadFormProps> = ({ 
  package: pkg, 
  onClose, 
  onVersionUploaded 
}) => {
  const [formData, setFormData] = useState({
    version: '',
    changelog: '',
    jarFile: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [securityStatus, setSecurityStatus] = useState({
    validated: false,
    scanning: false,
    scanComplete: false,
    isClean: false,
    errors: [] as string[]
  });
  const { user } = useAuth();
  const { uploadJarFile } = usePackages();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSecurityStatus({ validated: false, scanning: false, scanComplete: false, isClean: false, errors: [] });

    // Validate file
    const validation = SecurityService.validateFile(file);
    if (!validation.isValid) {
      setSecurityStatus(prev => ({ ...prev, errors: [validation.error!] }));
      toast({
        title: "File validation failed",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({ ...prev, jarFile: file }));
    setSecurityStatus(prev => ({ ...prev, validated: true }));

    // Start malware scan
    await performSecurityScan(file);
  };

  const performSecurityScan = async (file: File) => {
    setSecurityStatus(prev => ({ ...prev, scanning: true }));

    try {
      // Calculate file hash
      const fileHash = await SecurityService.calculateFileHash(file);
      console.log('File hash calculated:', fileHash);

      // Perform malware scan
      const scanResult = await SecurityService.scanFileForMalware(file, fileHash);
      
      setSecurityStatus({
        validated: true,
        scanning: false,
        scanComplete: true,
        isClean: scanResult.isClean,
        errors: scanResult.isClean ? [] : [scanResult.threatName || 'Security threat detected']
      });

      if (!scanResult.isClean) {
        toast({
          title: "Security scan failed",
          description: scanResult.threatName || "File failed malware scan",
          variant: "destructive",
        });
        setFormData(prev => ({ ...prev, jarFile: null }));
      } else {
        toast({
          title: "Security scan passed",
          description: "File is clean and ready for upload",
        });
      }
    } catch (error) {
      console.error('Security scan error:', error);
      setSecurityStatus(prev => ({ 
        ...prev, 
        scanning: false, 
        errors: ['Security scan failed. Please try again.'] 
      }));
      toast({
        title: "Security scan error",
        description: "Failed to scan file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.jarFile || !securityStatus.isClean) {
      toast({
        title: "Security check required",
        description: "Please upload a file that passes security validation",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload versions",
        variant: "destructive",
      });
      return;
    }

    // Validate package data
    const packageValidation = SecurityService.validatePackageData({
      name: pkg.name,
      description: pkg.description,
      version: formData.version.trim(),
      githubRepo: pkg.github_repo
    });

    if (!packageValidation.isValid) {
      toast({
        title: "Validation failed",
        description: packageValidation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Check if version already exists
      const { data: existingVersion, error: checkError } = await supabase
        .from('package_versions')
        .select('id')
        .eq('package_namespace_id', pkg.id)
        .eq('version', formData.version.trim())
        .maybeSingle();

      if (checkError) {
        throw new Error(`Database error: ${checkError.message}`);
      }

      if (existingVersion) {
        throw new Error('Version already exists');
      }

      setUploadProgress(25);
      
      // Upload the JAR file
      const jarFileUrl = await uploadJarFile(formData.jarFile, pkg.name, formData.version.trim());
      setUploadProgress(75);
      
      // Calculate file hash for storage
      const fileHash = await SecurityService.calculateFileHash(formData.jarFile);

      // Create version record with security metadata
      const versionData = {
        package_namespace_id: pkg.id,
        version: formData.version.trim(),
        jar_file_url: jarFileUrl,
        jar_file_size: formData.jarFile.size,
        downloads: 0,
        malware_scan_status: 'clean',
        malware_scan_date: new Date().toISOString(),
        file_hash: fileHash
      };

      const { data: newVersion, error: insertError } = await supabase
        .from('package_versions')
        .insert(versionData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save version: ${insertError.message}`);
      }

      // Record scan results
      await supabase
        .from('file_scan_results')
        .insert({
          package_version_id: newVersion.id,
          scan_status: 'clean',
          scan_provider: 'internal',
          scan_details: {
            fileHash,
            scanDate: new Date().toISOString(),
            fileSize: formData.jarFile.size
          }
        });

      setUploadProgress(100);

      toast({
        title: "Version uploaded successfully",
        description: `Version ${formData.version} has been uploaded and scanned.`,
      });
      
      if (onVersionUploaded) {
        onVersionUploaded();
      }
      
      onClose();
    } catch (error) {
      console.error('Error uploading version:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Upload failed",
        description: `Unable to upload version: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            Secure Version Upload
          </DialogTitle>
          <DialogDescription>
            Upload a new version for <strong>{pkg.name}</strong> with security validation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="version">Version Number *</Label>
            <Input
              id="version"
              placeholder="e.g., 1.0.0, 2.1.3"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                version: SecurityService.sanitizeInput(e.target.value)
              }))}
              className="glass-input"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Use semantic versioning (e.g., 1.0.0)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jarFile">JAR File * (Max 100MB)</Label>
            <div className="relative">
              <input
                id="jarFile"
                type="file"
                accept=".jar"
                onChange={handleFileChange}
                className="hidden"
                required
                disabled={loading || securityStatus.scanning}
              />
              <Label
                htmlFor="jarFile"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer glass-card hover:bg-accent/50 transition-colors"
              >
                <div className="text-center">
                  {formData.jarFile ? (
                    <>
                      <File className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">{formData.jarFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(formData.jarFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">Click to upload .jar file</p>
                      <p className="text-xs text-muted-foreground">
                        Max 100MB, .jar files only
                      </p>
                    </>
                  )}
                </div>
              </Label>
            </div>

            {/* Security Status */}
            {formData.jarFile && (
              <div className="space-y-2">
                {securityStatus.validated && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>File validation passed</AlertDescription>
                  </Alert>
                )}

                {securityStatus.scanning && (
                  <Alert>
                    <Shield className="h-4 w-4 animate-spin" />
                    <AlertDescription>Scanning for malware...</AlertDescription>
                  </Alert>
                )}

                {securityStatus.scanComplete && securityStatus.isClean && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-400">
                      Security scan passed - File is clean
                    </AlertDescription>
                  </Alert>
                )}

                {securityStatus.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {securityStatus.errors.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading secure package...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="changelog">Changelog (Optional)</Label>
            <Textarea
              id="changelog"
              placeholder="What's new in this version..."
              value={formData.changelog}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                changelog: SecurityService.sanitizeInput(e.target.value)
              }))}
              className="glass-input min-h-20"
              disabled={loading}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              Describe what changed in this version (max 1000 characters)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.jarFile || !formData.version.trim() || !securityStatus.isClean}
              className="flex-1"
            >
              {loading ? 'Uploading...' : 'Upload Secure Version'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SecureVersionUploadForm;
