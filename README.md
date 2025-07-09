# PiccodeScript Registry

A secure package registry for PiccodeScript packages with comprehensive security features.

## Features

- **Secure Package Management**: File validation, malware scanning, and hash verification
- **Role-based Access Control**: User, Manager, and Moderator roles with proper authorization
- **Download Analytics**: Track package downloads and usage statistics
- **Security Dashboard**: Monitor security scans and role changes
- **Backend API**: RESTful API for programmatic access

## Getting Started

### Development
```bash
npm install
npm run dev
```

### Production Server
To run the full-stack application with backend API:

**Linux/Mac:**
```bash
chmod +x start-server.sh
./start-server.sh
```

**Windows:**
```bash
start-server.bat
```

**Manual:**
```bash
npm run build
node server.js
```

The server will start on `http://localhost:8080`

## API Endpoints

### Get Package Information
```
GET /api/v1/package/{package_name}
```

Returns detailed information about a package including all versions and metadata.

**Example:**
```bash
curl http://localhost:8080/api/v1/package/raylib
```

**Response:**
```json
{
  "id": "uuid",
  "name": "raylib",
  "description": "Package description",
  "license": "MIT",
  "github_repo": "https://github.com/user/repo",
  "total_downloads": 1234,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "author": {
    "full_name": "Author Name",
    "email": "author@example.com",
    "avatar_url": "https://avatar.url"
  },
  "versions": [
    {
      "id": "uuid",
      "version": "1.0.0",
      "created_at": "2024-01-01T00:00:00Z",
      "downloads": 100,
      "jar_file_url": "https://storage.url/file.jar",
      "jar_file_size": 1024,
      "scan_status": "clean",
      "scan_date": "2024-01-01T00:00:00Z",
      "file_hash": "sha256hash"
    }
  ]
}
```

## Security Features

- **File Validation**: 100MB size limit, .jar extension only
- **Malware Scanning**: Simulated malware detection with pattern matching
- **Hash Verification**: SHA-256 file integrity checking
- **Input Sanitization**: XSS protection and SQL injection prevention
- **Role-based Access**: Proper authorization with audit logging
- **Download Protection**: Blocks infected files from being downloaded

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth

## Database Schema

- `package_namespaces`: Package information and metadata
- `package_versions`: Version details with security scanning
- `profiles`: User profiles and roles
- `download_analytics`: Download tracking
- `file_scan_results`: Security scan results
- `role_audit_log`: Role change audit trail

## Original Lovable Project

This project was created with [Lovable](https://lovable.dev/projects/54ee9cf8-9c3f-4953-8bdf-856420bbd3a3). You can continue editing it there or work locally with your preferred IDE.
