
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, CheckCircle, Clock, FileX } from 'lucide-react';

const SecurityDashboard: React.FC = () => {
  const { data: securityStats } = useQuery({
    queryKey: ['security-stats'],
    queryFn: async () => {
      // Get scan statistics
      const { data: scanResults, error: scanError } = await supabase
        .from('file_scan_results')
        .select('scan_status');

      if (scanError) throw scanError;

      // Get version statistics
      const { data: versions, error: versionError } = await supabase
        .from('package_versions')
        .select('malware_scan_status');

      if (versionError) throw versionError;

      // Get role audit logs (recent)
      const { data: auditLogs, error: auditError } = await supabase
        .from('role_audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(10);

      if (auditError) throw auditError;

      const stats = {
        totalScans: scanResults.length,
        cleanFiles: scanResults.filter(scan => scan.scan_status === 'clean').length,
        infectedFiles: scanResults.filter(scan => scan.scan_status === 'infected').length,
        pendingScans: versions.filter(v => v.malware_scan_status === 'pending').length,
        recentRoleChanges: auditLogs.length
      };

      return { ...stats, auditLogs };
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'infected': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clean': return <CheckCircle className="h-4 w-4" />;
      case 'infected': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <FileX className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Security Dashboard</h2>
      </div>

      {/* Security Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats?.totalScans || 0}</div>
            <p className="text-xs text-muted-foreground">Files scanned</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clean Files</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{securityStats?.cleanFiles || 0}</div>
            <p className="text-xs text-muted-foreground">Passed security scan</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{securityStats?.infectedFiles || 0}</div>
            <p className="text-xs text-muted-foreground">Malicious files blocked</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Scans</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{securityStats?.pendingScans || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting scan</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Role Changes */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Role Changes</CardTitle>
          <CardDescription>Security audit log of recent permission changes</CardDescription>
        </CardHeader>
        <CardContent>
          {securityStats?.auditLogs && securityStats.auditLogs.length > 0 ? (
            <div className="space-y-3">
              {securityStats.auditLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <p className="text-sm">
                        User role changed from <Badge variant="outline">{log.old_role}</Badge> to{' '}
                        <Badge className={getStatusColor(log.new_role)}>{log.new_role}</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.changed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {log.reason || 'No reason provided'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent role changes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
          <CardDescription>Suggested actions to improve security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-300">Regular Security Audits</p>
                <p className="text-xs text-blue-200/80">
                  Review role assignments and package permissions monthly
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-300">Automated Scanning Active</p>
                <p className="text-xs text-green-200/80">
                  All uploaded files are automatically scanned for malware
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Monitor File Sizes</p>
                <p className="text-xs text-yellow-200/80">
                  100MB file size limit enforced for all uploads
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
