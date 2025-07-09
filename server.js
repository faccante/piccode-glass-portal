import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  'https://pgpzinkbtzqilufilgpr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncHppbmtidHpxaWx1ZmlsZ3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxOTQ4NDQsImV4cCI6MjA1ODc3MDg0NH0.arxHsocUk-FwejtXWt_3vtCLhnP6pqUYWBvpyDfEFtQ'
);

// API endpoint for package information
app.get('/api/v1/package/:packageName', async (req, res) => {
  try {
    const { packageName } = req.params;

    if (!packageName) {
      return res.status(400).json({ error: 'Package name is required' });
    }

    console.log(`Fetching package info for: ${packageName}`);

    // Fetch package namespace with author profile
    const { data: packageData, error: packageError } = await supabase
      .from('package_namespaces')
      .select(`
        *,
        profiles!package_namespaces_author_id_fkey (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('name', packageName)
      .eq('status', 'approved') // Only return approved packages
      .single();

    if (packageError || !packageData) {
      console.error('Package fetch error:', packageError);
      return res.status(404).json({ error: 'Package not found' });
    }

    // Fetch all versions for this package
    const { data: versionsData, error: versionsError } = await supabase
      .from('package_versions')
      .select('*')
      .eq('package_namespace_id', packageData.id)
      .eq('malware_scan_status', 'clean') // Only return clean versions
      .order('created_at', { ascending: false });

    if (versionsError) {
      console.error('Versions fetch error:', versionsError);
      return res.status(500).json({ error: 'Failed to fetch package versions' });
    }

    // Prepare response with security filtering
    const response = {
      id: packageData.id,
      name: packageData.name,
      description: packageData.description,
      license: packageData.license,
      github_repo: packageData.github_repo,
      total_downloads: packageData.total_downloads,
      created_at: packageData.created_at,
      updated_at: packageData.updated_at,
      author: {
        full_name: packageData.profiles?.full_name || 'Unknown',
        email: packageData.profiles?.email || packageData.author_email,
        avatar_url: packageData.profiles?.avatar_url
      },
      versions: versionsData.map(version => ({
        id: version.id,
        version: version.version,
        created_at: version.created_at,
        downloads: version.downloads,
        jar_file_url: version.jar_file_url,
        jar_file_size: version.jar_file_size,
        scan_status: version.malware_scan_status,
        scan_date: version.malware_scan_date,
        file_hash: version.file_hash
      }))
    };

    console.log(`Successfully fetched package ${packageName} with ${versionsData.length} versions`);
    res.json(response);

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API endpoint: http://localhost:${port}/api/v1/package/{package_name}`);
});