
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, File, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePackages } from '@/hooks/usePackages';
import { supabase } from '@/integrations/supabase/client';

interface VersionUploadFormProps {
  package: any;
  onClose: () => void;
  onVersionUploaded?: () => void;
}

const VersionUploadForm: React.FC<VersionUploadFormProps> = ({ package: pkg, onClose, onVersionUploaded }) => {
  const [formData, setFormData] = useState({
    version: '',
    changelog: '',
    jarFile: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const { uploadJarFile } = usePackages();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.jar')) {
      setFormData(prev => ({ ...prev, jarFile: file }));
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a .jar file",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('User:', user);
    console.log('Package:', pkg);
    console.log('Form data:', formData);

    if (!formData.jarFile) {
      toast({
        title: "Missing file",
        description: "Please select a .jar file to upload",
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

    if (!formData.version.trim()) {
      toast({
        title: "Version required",
        description: "Please enter a version number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      console.log('About to check for existing version...');
      
      // Check if version already exists
      const { data: existingVersion, error: checkError } = await supabase
        .from('package_versions')
        .select('id')
        .eq('package_namespace_id', pkg.id)
        .eq('version', formData.version.trim())
        .maybeSingle();

      console.log('Existing version check result:', { existingVersion, checkError });

      if (checkError) {
        console.error('Error checking existing version:', checkError);
        throw new Error(`Database error: ${checkError.message}`);
      }

      if (existingVersion) {
        throw new Error('Version already exists');
      }

      console.log('Starting file upload...');
      
      // Set progress to indicate upload start
      setUploadProgress(25);
      
      // Upload the JAR file to storage
      const jarFileUrl = await uploadJarFile(formData.jarFile, pkg.name, formData.version.trim());
      
      console.log('File upload completed, URL:', jarFileUrl);
      setUploadProgress(75);
      
      console.log('About to insert version into database...');

      // Prepare the data to insert
      const versionData = {
        package_namespace_id: pkg.id,
        version: formData.version.trim(),
        jar_file_url: jarFileUrl,
        jar_file_size: formData.jarFile.size,
        downloads: 0
      };

      console.log('Version data to insert:', versionData);

      // Create version record in database
      const { data: newVersion, error: insertError } = await supabase
        .from('package_versions')
        .insert(versionData)
        .select()
        .single();

      console.log('Insert result:', { newVersion, insertError });

      if (insertError) {
        console.error('Database insertion error:', insertError);
        throw new Error(`Failed to save version: ${insertError.message}`);
      }

      if (!newVersion) {
        throw new Error('Version was not created - no data returned');
      }

      setUploadProgress(100);
      console.log('Version successfully created:', newVersion);

      toast({
        title: "Version uploaded successfully",
        description: `Version ${formData.version} has been uploaded.`,
      });
      
      // Call the callback to refresh the package list
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
      <DialogContent className="bg-white/90 backdrop-blur-sm max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900 flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            Add New Version
          </DialogTitle>
          <DialogDescription>
            Upload a new version for <strong>{pkg.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="version">Version Number *</Label>
            <Input
              id="version"
              placeholder="e.g., 1.0.0, 2.1.3"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              className="bg-white/50"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Use semantic versioning (e.g., 1.0.0)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jarFile">JAR File *</Label>
            <div className="relative">
              <input
                id="jarFile"
                type="file"
                accept=".jar"
                onChange={handleFileChange}
                className="hidden"
                required
                disabled={loading}
              />
              <Label
                htmlFor="jarFile"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white/30 hover:bg-white/50 transition-colors"
              >
                <div className="text-center">
                  {formData.jarFile ? (
                    <>
                      <File className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">{formData.jarFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(formData.jarFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">Click to upload .jar file</p>
                      <p className="text-xs text-gray-500">
                        Drag and drop or click to browse
                      </p>
                    </>
                  )}
                </div>
              </Label>
            </div>
            
            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading JAR file...</span>
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
              onChange={(e) => setFormData(prev => ({ ...prev, changelog: e.target.value }))}
              className="bg-white/50 min-h-20"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Describe what changed in this version</p>
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
              disabled={loading || !formData.jarFile || !formData.version.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {loading ? 'Uploading...' : 'Upload Version'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VersionUploadForm;
