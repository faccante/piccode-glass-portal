import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Settings, Download, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePackages } from '@/hooks/usePackages';

interface VersionManagementFormProps {
  package: any;
  onClose: () => void;
}

interface PackageVersion {
  id: string;
  version: string;
  downloads: number;
  created_at: string;
  jar_file_url?: string;
  jar_file_size?: number;
}

const VersionManagementForm: React.FC<VersionManagementFormProps> = ({ package: pkg, onClose }) => {
  const [versions, setVersions] = useState<PackageVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PackageVersion | null>(null);
  const { user } = useAuth();
  const { recordDownload } = usePackages();
  const { toast } = useToast();

  useEffect(() => {
    fetchVersions();
  }, [pkg.id]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('package_versions')
        .select('*')
        .eq('package_namespace_id', pkg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({
        title: "Error",
        description: "Failed to load versions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = (version: PackageVersion) => {
    setSelectedVersion(version);
    setShowDeleteDialog(true);
  };

  const confirmDeleteVersion = async () => {
    if (!selectedVersion) return;

    try {
      const { error } = await supabase
        .from('package_versions')
        .delete()
        .eq('id', selectedVersion.id);

      if (error) throw error;

      toast({
        title: "Version deleted",
        description: `Version ${selectedVersion.version} has been deleted.`,
      });

      // Refresh versions list
      await fetchVersions();
      setShowDeleteDialog(false);
      setSelectedVersion(null);
    } catch (error) {
      console.error('Error deleting version:', error);
      toast({
        title: "Delete failed",
        description: "Unable to delete version",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (version: PackageVersion) => {
    if (!version.jar_file_url) {
      toast({
        title: "No file available",
        description: "This version doesn't have a JAR file to download",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the recordDownload function from usePackages hook which handles everything
      await recordDownload(version.id);
      
      toast({
        title: "Download started",
        description: `Version ${version.version} download started`,
      });
      
      // Refresh versions to show updated download count
      await fetchVersions();
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Unable to download the file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-white/90 backdrop-blur-sm max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-900 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Manage Versions - {pkg.name}
            </DialogTitle>
            <DialogDescription>
              View and manage all versions of this package namespace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-gray-500">Loading versions...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No versions found</p>
                  <p className="text-sm text-gray-400">Add your first version to get started</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">
                        <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-800">
                          v{version.version}
                        </span>
                      </TableCell>
                      <TableCell>{formatFileSize(version.jar_file_size)}</TableCell>
                      <TableCell>{version.downloads.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(version.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(version)}
                            disabled={!version.jar_file_url}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVersion(version)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Version Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete version {selectedVersion?.version}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteVersion}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VersionManagementForm;
