
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Trash2, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Avatar from './Avatar';

const ProfileImageUpload: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/avatar.${fileExt}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl
      });

      if (updateError) {
        throw new Error(updateError);
      }

      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated successfully.",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error uploading avatar';
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async () => {
    try {
      setDeleting(true);

      if (profile?.avatar_url) {
        // Extract file path from URL
        const urlParts = profile.avatar_url.split('/');
        const fileName = `${user?.id}/avatar.${urlParts[urlParts.length - 1].split('.').pop()}`;

        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([fileName]);

        if (deleteError) {
          console.warn('Error deleting file from storage:', deleteError);
        }
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: null
      });

      if (updateError) {
        throw new Error(updateError);
      }

      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed successfully.",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error removing avatar';
      toast({
        title: "Delete failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Profile Picture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar 
            src={profile?.avatar_url} 
            username={profile?.full_name || profile?.email || 'User'} 
            size="xl" 
          />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Upload a custom profile picture or use the generated pattern art based on your name.
            </p>
            <div className="flex gap-2">
              <Label htmlFor="avatar-upload">
                <Button
                  variant="outline"
                  className="cursor-pointer glass-button"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Picture'}
                  </span>
                </Button>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
              />
              {profile?.avatar_url && (
                <Button
                  variant="outline"
                  onClick={deleteAvatar}
                  disabled={deleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Removing...' : 'Remove'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileImageUpload;
