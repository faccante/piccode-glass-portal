import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      package_namespaces: {
        Row: {
          id: string
          name: string
          description: string
          author_email: string
          author_id: string
          license: string
          github_repo: string
          status: string
          total_downloads: number
          created_at: string
          updated_at: string
          approved_at: string | null
          approved_by: string | null
          approved_by_email: string | null
        }
      }
      package_versions: {
        Row: {
          id: string
          package_namespace_id: string
          version: string
          created_at: string
          downloads: number
          jar_file_url: string | null
          jar_file_size: number | null
          malware_scan_status: string
          malware_scan_date: string | null
          file_hash: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const packageName = url.searchParams.get('name')

    if (!packageName) {
      return new Response(
        JSON.stringify({ error: 'Package name is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Fetching package info for: ${packageName}`)

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
      .single()

    if (packageError) {
      console.error('Package fetch error:', packageError)
      return new Response(
        JSON.stringify({ error: 'Package not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch all versions for this package
    const { data: versionsData, error: versionsError } = await supabase
      .from('package_versions')
      .select('*')
      .eq('package_namespace_id', packageData.id)
      .eq('malware_scan_status', 'clean') // Only return clean versions
      .order('created_at', { ascending: false })

    if (versionsError) {
      console.error('Versions fetch error:', versionsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch package versions' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
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
    }

    console.log(`Successfully fetched package ${packageName} with ${versionsData.length} versions`)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})