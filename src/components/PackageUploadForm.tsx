
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, File, Github } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePackages } from '@/hooks/usePackages';

interface PackageUploadFormProps {
  onClose: () => void;
}

const PackageUploadForm: React.FC<PackageUploadFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    license: '',
    githubRepo: '',
    changelog: '',
    jarFile: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { submitPackage } = usePackages();
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
        description: "Please log in to upload packages",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await submitPackage({
        name: formData.name,
        description: formData.description,
        version: formData.version,
        license: formData.license,
        githubRepo: formData.githubRepo,
        jarFile: formData.jarFile
      });

      toast({
        title: "Package uploaded successfully",
        description: "Your package is now pending review.",
      });
      
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Upload failed",
        description: `Unable to upload package: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const licenses = [
    'MIT',
    'Apache-2.0',
    'GPL-3.0',
    'BSD-3-Clause',
    'ISC',
    'MPL-2.0',
    'LGPL-3.0',
    'Unlicense'
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">Upload New Package</DialogTitle>
          <DialogDescription>
            Share your PiccodeScript package with the community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name *</Label>
              <Input
                id="name"
                placeholder="e.g., my-awesome-lib"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="glass-card"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                placeholder="e.g., 1.0.0"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                className="glass-card"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what your package does..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="glass-card min-h-20"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license">License *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, license: value }))}>
                <SelectTrigger className="glass-card">
                  <SelectValue placeholder="Select a license" />
                </SelectTrigger>
                <SelectContent>
                  {licenses.map((license) => (
                    <SelectItem key={license} value={license}>
                      {license}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubRepo">GitHub Repository *</Label>
              <div className="relative">
                <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="githubRepo"
                  placeholder="https://github.com/user/repo"
                  value={formData.githubRepo}
                  onChange={(e) => setFormData(prev => ({ ...prev, githubRepo: e.target.value }))}
                  className="pl-10 glass-card"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="changelog">Changelog (Optional)</Label>
            <Textarea
              id="changelog"
              placeholder="What's new in this version..."
              value={formData.changelog}
              onChange={(e) => setFormData(prev => ({ ...prev, changelog: e.target.value }))}
              className="glass-card min-h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jarFile">Package File (.jar) *</Label>
            <div className="relative">
              <input
                id="jarFile"
                type="file"
                accept=".jar"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <Label
                htmlFor="jarFile"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer glass-card hover:bg-white/5 transition-colors"
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
                        Drag and drop or click to browse
                      </p>
                    </>
                  )}
                </div>
              </Label>
            </div>
          </div>

          <div className="bg-secondary/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Contact Information</h4>
            <p className="text-sm text-muted-foreground">
              Email: {user?.email} (This will not be public)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="glass-button flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary/20 hover:bg-primary/30 border border-primary/50 flex-1"
            >
              {loading ? 'Uploading...' : 'Upload Package'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageUploadForm;
