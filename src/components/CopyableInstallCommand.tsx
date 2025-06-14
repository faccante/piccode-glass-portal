
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CopyableInstallCommandProps {
  packageName: string;
  versionId?: string;
  onDownloadTracked?: () => void;
}

const CopyableInstallCommand: React.FC<CopyableInstallCommandProps> = ({ 
  packageName, 
  versionId,
  onDownloadTracked 
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const installCommand = `picoc install ${packageName}`;

  const trackDownload = async () => {
    if (!versionId) return;

    try {
      await supabase
        .from('download_analytics')
        .insert({
          package_id: versionId,
          user_agent: navigator.userAgent,
        });

      if (onDownloadTracked) {
        onDownloadTracked();
      }
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      
      // Track the download when command is copied
      await trackDownload();
      
      toast({
        title: "Copied to clipboard",
        description: "Install command copied and download tracked",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    await trackDownload();
    
    toast({
      title: "Download tracked",
      description: `Download for ${packageName} has been recorded`,
    });
  };

  return (
    <div className="space-y-3">
      <div className="bg-black/20 p-4 rounded-lg font-mono text-sm flex items-center justify-between">
        <code className="flex-1">{installCommand}</code>
        <Button
          onClick={handleCopy}
          variant="ghost"
          size="sm"
          className="ml-2 h-8 w-8 p-0"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <Button
        onClick={handleDownload}
        className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/50"
      >
        <Download className="h-4 w-4 mr-2" />
        Track Download
      </Button>
    </div>
  );
};

export default CopyableInstallCommand;
