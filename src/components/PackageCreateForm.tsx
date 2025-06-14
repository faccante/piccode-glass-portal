
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PackageCreateFormProps {
  onClose: () => void;
}

const PackageCreateForm: React.FC<PackageCreateFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    license: '',
    githubRepo: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create packages",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement package creation logic
      console.log('Creating package:', formData);
      
      toast({
        title: "Package created successfully",
        description: "You can now add versions to your package.",
      });
      
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Creation failed",
        description: `Unable to create package: ${errorMessage}`,
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
      <DialogContent className="bg-white/90 backdrop-blur-sm max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Create New Package
          </DialogTitle>
          <DialogDescription>
            Create a new package namespace. You can add versions after creating the package.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Package Name *</Label>
            <Input
              id="name"
              placeholder="e.g., my-awesome-lib"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-white/50"
              required
            />
            <p className="text-xs text-gray-500">Choose a unique name for your package</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what your package does..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-white/50 min-h-20"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license">License *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, license: value }))}>
                <SelectTrigger className="bg-white/50">
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
                <Github className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="githubRepo"
                  placeholder="https://github.com/user/repo"
                  value={formData.githubRepo}
                  onChange={(e) => setFormData(prev => ({ ...prev, githubRepo: e.target.value }))}
                  className="pl-10 bg-white/50"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Search Tags (Optional)</Label>
            <Input
              id="tags"
              placeholder="e.g., utility, logging, database (comma-separated)"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="bg-white/50"
            />
            <p className="text-xs text-gray-500">Add tags to help users find your package</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium mb-2 text-gray-900">Next Steps</h4>
            <p className="text-sm text-gray-600">
              After creating your package, you'll be able to add versions by uploading JAR files with version numbers and changelogs.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {loading ? 'Creating...' : 'Create Package'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageCreateForm;
