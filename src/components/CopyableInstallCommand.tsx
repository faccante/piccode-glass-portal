
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CopyableInstallCommandProps {
  packageName: string;
  versionId: string;
  className?: string;
}

const CopyableInstallCommand: React.FC<CopyableInstallCommandProps> = ({
  packageName,
  versionId,
  className = ""
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const installCommand = `picoc install ${packageName}`;

  const recordDownload = async () => {
    try {
      await supabase
        .from('download_analytics')
        .insert({
          package_id: versionId,
          user_agent: navigator.userAgent,
          ip_address: null, // Will be set by the database
        });
    } catch (error) {
      console.error('Error recording download:', error);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Record the download/copy event
      await recordDownload();
      
      toast({
        title: "Copied!",
        description: "Install command copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleClick = async () => {
    // Record the download event when command is clicked
    await recordDownload();
  };

  return (
    <div className={`bg-black/20 p-4 rounded-lg font-mono text-sm flex items-center justify-between ${className}`}>
      <code onClick={handleClick} className="cursor-pointer flex-1">
        {installCommand}
      </code>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="ml-2 h-8 w-8 p-0"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default CopyableInstallCommand;
