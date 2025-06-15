import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SecurityService } from '@/services/securityService';

export interface SecurePackageVersion {
  id: string;
  version: string;
  created_at: string;
  downloads: number;
  jar_file_url: string | null;
  jar_file_size: number | null;
  malware_scan_status: string;
  malware_scan_date: string | null;
  file_hash: string | null;
}

export interface SecurePackageNamespace {
  id: string;
  name: string;
  description: string;
  author_email: string;
  author_id: string;
  license: string;
  github_repo: string;
  status: string;
  total_downloads: number;
  created_at: string;
  updated_at: string;
  latest_version?: string;
  profiles?: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
  versions?: SecurePackageVersion[];
}

export interface SecureSubmitPackageData {
  name: string;
  description: string;
  version: string;
  license: string;
  githubRepo: string;
  jarFile: File;
}

export const useSecurePackages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: packages = [], isLoading: loading, refetch: fetchPackages } = useQuery({
    queryKey: ['secure-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('package_namespaces')
        .select(`
          *,
          profiles!package_namespaces_author_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching packages:', error);
        throw error;
      }

      // Get latest version for each package with security status
      const packagesWithVersions = await Promise.all(
        data.map(async (pkg) => {
          const { data: versions, error: versionError } = await supabase
            .from('package_versions')
            .select('version, created_at, malware_scan_status')
            .eq('package_namespace_id', pkg.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (versionError) {
            console.error('Error fetching versions for package:', pkg.id, versionError);
          }

          return {
            ...pkg,
            latest_version: versions && versions.length > 0 ? versions[0].version : undefined,
            scan_status: versions && versions.length > 0 ? versions[0].malware_scan_status : 'unknown'
          };
        })
      );

      return packagesWithVersions as SecurePackageNamespace[];
    },
  });

  const getSecurePackageDetails = async (packageId: string): Promise<SecurePackageNamespace> => {
    const { data, error } = await supabase
      .from('package_namespaces')
      .select(`
        *,
        profiles!package_namespaces_author_id_fkey (
          full_name,
          email,
          avatar_url
        ),
        versions:package_versions (
          id,
          version,
          created_at,
          downloads,
          jar_file_url,
          jar_file_size,
          malware_scan_status,
          malware_scan_date,
          file_hash
        )
      `)
      .eq('id', packageId)
      .single();

    if (error) throw error;
    
    // Sort versions by creation date (newest first)
    if (data.versions) {
      data.versions.sort((a: SecurePackageVersion, b: SecurePackageVersion) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    return data as SecurePackageNamespace;
  };

  const secureUploadJarFile = async (file: File, packageName: string, version: string): Promise<string> => {
    // Validate file before upload
    const validation = SecurityService.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'File validation failed');
    }

    // Calculate file hash
    const fileHash = await SecurityService.calculateFileHash(file);
    
    // Perform malware scan
    const scanResult = await SecurityService.scanFileForMalware(file, fileHash);
    if (!scanResult.isClean) {
      throw new Error(`Malware detected: ${scanResult.threatName}`);
    }

    const fileName = `${packageName}-${version}.jar`;
    const filePath = `${packageName}/${version}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('jar-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('jar-files')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const secureRecordDownload = async (versionId: string) => {
    // Check if version is clean before allowing download
    const { data: versionData, error: versionError } = await supabase
      .from('package_versions')
      .select('package_namespace_id, jar_file_url, malware_scan_status')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;

    // Block download if malware detected
    if (versionData.malware_scan_status === 'infected') {
      throw new Error('Download blocked: File contains malware');
    }

    if (versionData.malware_scan_status === 'pending') {
      throw new Error('Download blocked: File scan in progress');
    }

    // Get current download count and increment it
    const { data: currentVersion, error: getCurrentError } = await supabase
      .from('package_versions')
      .select('downloads')
      .eq('id', versionId)
      .single();

    if (getCurrentError) throw getCurrentError;

    // Update the version's download count
    const { error: versionUpdateError } = await supabase
      .from('package_versions')
      .update({ 
        downloads: (currentVersion.downloads || 0) + 1
      })
      .eq('id', versionId);

    if (versionUpdateError) throw versionUpdateError;

    // Get current namespace download count and increment it
    const { data: currentNamespace, error: getCurrentNamespaceError } = await supabase
      .from('package_namespaces')
      .select('total_downloads')
      .eq('id', versionData.package_namespace_id)
      .single();

    if (getCurrentNamespaceError) throw getCurrentNamespaceError;

    // Update the package namespace's total downloads count
    const { error: namespaceUpdateError } = await supabase
      .from('package_namespaces')
      .update({ 
        total_downloads: (currentNamespace.total_downloads || 0) + 1
      })
      .eq('id', versionData.package_namespace_id);

    if (namespaceUpdateError) throw namespaceUpdateError;

    // Actually download the file if jar_file_url exists
    if (versionData.jar_file_url) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = versionData.jar_file_url;
      link.download = versionData.jar_file_url.split('/').pop() || 'package.jar';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Invalidate queries to refresh download counts
    queryClient.invalidateQueries({ queryKey: ['secure-packages'] });
  };

  const secureSubmitPackage = useMutation({
    mutationFn: async (packageData: SecureSubmitPackageData) => {
      if (!user) throw new Error('User not authenticated');

      // Validate package data
      const validation = SecurityService.validatePackageData(packageData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Sanitize inputs
      const sanitizedData = {
        name: SecurityService.sanitizeInput(packageData.name),
        description: SecurityService.sanitizeInput(packageData.description),
        license: SecurityService.sanitizeInput(packageData.license),
        githubRepo: SecurityService.sanitizeInput(packageData.githubRepo),
        version: SecurityService.sanitizeInput(packageData.version)
      };

      // Create the package namespace
      const { data: namespaceData, error: namespaceError } = await supabase
        .from('package_namespaces')
        .insert({
          name: sanitizedData.name,
          description: sanitizedData.description,
          license: sanitizedData.license,
          github_repo: sanitizedData.githubRepo,
          author_id: user.id,
          author_email: user.email || '',
          status: 'pending'
        })
        .select()
        .single();

      if (namespaceError) {
        console.error('Error creating namespace:', namespaceError);
        throw namespaceError;
      }

      // Upload the JAR file securely
      const jarFileUrl = await secureUploadJarFile(packageData.jarFile, sanitizedData.name, sanitizedData.version);
      const fileHash = await SecurityService.calculateFileHash(packageData.jarFile);

      // Create the first version with security metadata
      const { data: versionData, error: versionError } = await supabase
        .from('package_versions')
        .insert({
          package_namespace_id: namespaceData.id,
          version: sanitizedData.version,
          jar_file_url: jarFileUrl,
          jar_file_size: packageData.jarFile.size,
          downloads: 0,
          malware_scan_status: 'clean',
          malware_scan_date: new Date().toISOString(),
          file_hash: fileHash
        })
        .select()
        .single();

      if (versionError) {
        console.error('Error creating version:', versionError);
        throw versionError;
      }

      return namespaceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-packages'] });
    },
  });

  const secureDeletePackage = useMutation({
    mutationFn: async (packageId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Check if user owns the package
      const { data: packageData, error: checkError } = await supabase
        .from('package_namespaces')
        .select('author_id')
        .eq('id', packageId)
        .single();

      if (checkError) throw checkError;
      
      if (packageData.author_id !== user.id) {
        throw new Error('Unauthorized: You can only delete your own packages');
      }

      // First delete all versions of the package
      const { error: versionsError } = await supabase
        .from('package_versions')
        .delete()
        .eq('package_namespace_id', packageId);

      if (versionsError) throw versionsError;

      // Then delete the package namespace
      const { error } = await supabase
        .from('package_namespaces')
        .delete()
        .eq('id', packageId)
        .eq('author_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-packages'] });
    },
  });

  return {
    packages,
    loading,
    getSecurePackageDetails,
    secureRecordDownload,
    secureSubmitPackage: secureSubmitPackage.mutateAsync,
    secureDeletePackage: secureDeletePackage.mutateAsync,
    fetchPackages,
    secureUploadJarFile,
  };
};
