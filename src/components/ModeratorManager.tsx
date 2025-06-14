
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useManagerPackages, SearchProfile } from '@/hooks/useManagerPackages';
import { Search, UserPlus, Shield, User, Crown } from 'lucide-react';

interface ModeratorManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModeratorManager: React.FC<ModeratorManagerProps> = ({ isOpen, onClose }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { searchProfiles, updateUserRole, isUpdatingRole } = useManagerPackages();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchProfiles(searchEmail);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Failed to search for users",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string, userName: string) => {
    try {
      await updateUserRole({ userId, role: newRole });
      
      toast({
        title: "Role updated",
        description: `${userName} is now a ${newRole}`,
      });

      // Refresh search results
      if (searchEmail.trim()) {
        handleSearch();
      }
    } catch (error) {
      console.error('Role update error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager': return <Crown className="h-4 w-4" />;
      case 'moderator': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager': return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'moderator': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Manage Moderators
          </DialogTitle>
          <DialogDescription>
            Search for users by email and assign moderator roles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Section */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Search Users</CardTitle>
              <CardDescription>Enter an email address to find users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchEmail.trim()}
                  className="glass-button"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Search Results</CardTitle>
                <CardDescription>Found {searchResults.length} user(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.map((profile) => (
                    <div key={profile.id} className="glass-card p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            {getRoleIcon(profile.role)}
                          </div>
                          <div>
                            <div className="font-medium">{profile.full_name || 'No name'}</div>
                            <div className="text-sm text-muted-foreground">{profile.email}</div>
                          </div>
                          <Badge className={getRoleColor(profile.role)}>
                            {profile.role}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          {profile.role === 'user' && (
                            <Button
                              size="sm"
                              onClick={() => handleRoleUpdate(profile.id, 'moderator', profile.full_name || profile.email)}
                              disabled={isUpdatingRole}
                              className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Moderator
                            </Button>
                          )}
                          
                          {profile.role === 'moderator' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRoleUpdate(profile.id, 'user', profile.full_name || profile.email)}
                              disabled={isUpdatingRole}
                              className="glass-button text-red-400 hover:text-red-300"
                            >
                              <User className="h-4 w-4 mr-2" />
                              Remove Moderator
                            </Button>
                          )}
                          
                          {profile.role === 'manager' && (
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                              Manager
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {searchEmail.trim() && searchResults.length === 0 && !isSearching && (
            <Card className="glass-card">
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found matching "{searchEmail}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="ghost" className="glass-button">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModeratorManager;
