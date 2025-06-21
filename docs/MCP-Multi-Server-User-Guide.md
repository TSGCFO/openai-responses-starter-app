# MCP Multi-Server User Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Server Configuration](#server-configuration)
   - [GitHub Official Server](#github-official-server)
   - [Supabase Server](#supabase-server)
   - [Microsoft Outlook Server](#microsoft-outlook-server)
   - [Microsoft Teams Server](#microsoft-teams-server)
   - [Gmail Server](#gmail-server)
4. [Authentication Setup](#authentication-setup)
5. [Managing Multiple Servers](#managing-multiple-servers)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)
8. [Advanced Configuration](#advanced-configuration)

## Overview

The MCP Multi-Server system allows you to connect to multiple Model Context Protocol servers simultaneously, extending your AI assistant's capabilities with external tools and services. This guide walks you through setting up and managing these connections.

### Supported Services

- **GitHub Official**: Repository management, issues, pull requests, and code operations
- **Supabase**: Database queries and management operations
- **Microsoft Outlook**: Email management, calendar, and contacts
- **Microsoft Teams**: Team collaboration, channels, and messaging
- **Gmail**: Email operations, labels, and thread management

## Getting Started

### Accessing MCP Configuration

1. **Open Tools Panel**: Click the tools icon in the application interface
2. **Navigate to MCP Section**: Find the "MCP Configuration" section
3. **Enable Multi-Server Mode**: Toggle the "Multi-Server" switch if not already enabled

![MCP Configuration Toggle](./images/mcp-config-toggle.png)

### First-Time Setup

When you first access the multi-server configuration, you'll see five default servers:

- All servers are **disabled** by default
- Each server has specific authentication requirements
- Configuration is **automatically saved** as you make changes

## Server Configuration

### GitHub Official Server

The GitHub server provides comprehensive repository management capabilities.

#### Prerequisites
- GitHub account with appropriate permissions
- Personal Access Token (PAT) with required scopes

#### Configuration Steps

1. **Enable the Server**
   - Toggle the switch next to "GitHub Official"
   - Click "Configure" to expand the configuration panel

2. **Required Authentication**
   ```
   GitHub Token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - Must be a valid GitHub Personal Access Token
   - Required scopes: `repo`, `issues`, `pull_requests` (based on intended usage)

3. **Optional Configuration**
   ```
   Toolsets: issues,pulls,repos
   Read Only: [Toggle based on needs]
   ```
   - **Toolsets**: Comma-separated list of GitHub features to enable
   - **Read Only**: Restricts operations to read-only when enabled

4. **Allowed Tools** (Optional)
   ```
   Allowed Tools: create_issue,list_repos,create_pr
   ```
   - Leave empty to allow all tools
   - Specify comma-separated tool names to restrict access

#### GitHub Token Setup

1. **Create Personal Access Token**:
   - Go to GitHub.com → Settings → Developer settings → Personal access tokens
   - Click "Generate new token (classic)"
   - Select required scopes:
     - `repo` - Full repository access
     - `read:org` - Read organization data
     - `user:email` - Read user email

2. **Copy Token**: Copy the generated token immediately (you won't see it again)

3. **Paste in Configuration**: Enter the token in the "GitHub Token" field

### Supabase Server

The Supabase server enables direct database operations and queries.

#### Prerequisites
- Supabase project with database access
- Query API key or Supabase service credentials

#### Configuration Steps

1. **Enable the Server**
   - Toggle "Supabase" server
   - Click "Configure" to expand options

2. **Required Authentication**
   ```
   Query API Key: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - This is the primary authentication method
   - Obtain from your query API provider

3. **Optional Supabase Credentials**
   ```
   Supabase URL: https://your-project.supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - **Supabase URL**: Your project's API URL
   - **Anon Key**: Public anonymous key for read operations
   - **Service Role Key**: Private key for administrative operations

#### Supabase Setup Guide

1. **Get Project Credentials**:
   - Open your Supabase project dashboard
   - Go to Settings → API
   - Copy the Project URL and anon key

2. **Service Role Key** (if needed):
   - In the same API settings page
   - Copy the service_role key (use carefully - has admin privileges)

3. **Query API Key**:
   - Contact your query API provider for access credentials
   - This key enables SQL query execution through the MCP server

### Microsoft Outlook Server

Access Outlook emails, calendar events, and contacts.

#### Prerequisites
- Microsoft 365 or Outlook.com account
- Optional: Pipedream account for enhanced features

#### Configuration Steps

1. **Enable the Server**
   - Toggle "Microsoft Outlook"
   - The server uses Pipedream's remote MCP infrastructure

2. **Optional Authentication**
   ```
   Pipedream API Key: pd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - **Optional**: The server works without an API key for basic features
   - **Enhanced Features**: API key enables additional functionality and higher rate limits

#### Pipedream API Key Setup

1. **Create Pipedream Account**:
   - Go to [pipedream.com](https://pipedream.com)
   - Sign up for a free account

2. **Generate API Key**:
   - Go to Account Settings → API Keys
   - Create a new API key
   - Copy the key (starts with `pd_`)

3. **Enter in Configuration**:
   - Paste the key in the "Pipedream API Key" field
   - Leave empty if you prefer to use without authentication

### Microsoft Teams Server

Interact with Teams channels, messages, and meetings.

#### Configuration Steps

1. **Enable the Server**
   - Toggle "Microsoft Teams"
   - Uses the same Pipedream infrastructure as Outlook

2. **Optional Authentication**
   ```
   Pipedream API Key: pd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - Same API key as Outlook (if you have one)
   - Optional for basic functionality

#### Teams-Specific Features

- **Channel Management**: List and search channels
- **Message Operations**: Send messages, read conversations
- **Meeting Integration**: Access meeting information
- **File Sharing**: Upload and download files from Teams

### Gmail Server

Access and manage Gmail emails, labels, and threads.

#### Configuration Steps

1. **Enable the Server**
   - Toggle "Gmail"
   - Also uses Pipedream's remote MCP infrastructure

2. **Optional Authentication**
   ```
   Pipedream API Key: pd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - Same optional API key as other Pipedream services

#### Gmail-Specific Features

- **Email Management**: Read, send, and organize emails
- **Label Operations**: Create and manage labels
- **Thread Management**: Handle email conversations
- **Search Functionality**: Advanced email search capabilities

## Authentication Setup

### Security Best Practices

1. **Token Storage**
   - Tokens are stored securely in your browser's local storage
   - Never share your authentication tokens
   - Regenerate tokens if compromised

2. **Permission Scopes**
   - Use minimum required permissions
   - Review and understand what access each token provides
   - Regularly audit connected services

3. **API Key Management**
   - Keep API keys confidential
   - Use environment variables in production
   - Monitor API usage and rate limits

### Authentication Status Indicators

The UI provides clear indicators for authentication status:

- **✓ Token Set** (Green): Authentication is configured and valid
- **✗ Token Missing** (Red): Required authentication is missing
- **○ Optional** (Orange): Authentication is optional for this service

## Managing Multiple Servers

### Enabling/Disabling Servers

1. **Quick Toggle**: Use the switch next to each server name
2. **Bulk Management**: Use "Reset All" to return to default configurations
3. **Individual Configuration**: Expand each server for detailed settings

### Server Status Overview

The tools list shows the status of all enabled servers:

- **Server Type**: Docker, Query API, or Pipedream
- **Authentication Status**: Whether required credentials are provided
- **Allowed Tools**: Which tools are available
- **Approval Settings**: Whether tool execution requires approval

### Configuration Persistence

- **Automatic Saving**: All changes are saved automatically
- **Browser Storage**: Configurations persist between sessions
- **Reset Option**: "Reset All" returns to factory defaults

## Troubleshooting

### Common Issues and Solutions

#### GitHub Server Issues

**Problem**: "Token Missing" error
**Solution**:
1. Verify your Personal Access Token is valid
2. Check that the token has required scopes
3. Ensure the token hasn't expired

**Problem**: "Permission denied" errors
**Solution**:
1. Verify token scopes include necessary permissions
2. Check repository access permissions
3. Ensure organization settings allow token access

#### Supabase Server Issues

**Problem**: "API Key Missing" error
**Solution**:
1. Verify you have a valid Query API key
2. Contact your API provider if key is invalid
3. Check API key format and permissions

**Problem**: Database connection failures
**Solution**:
1. Verify Supabase URL is correct
2. Check that database is accessible
3. Ensure service role key has necessary permissions

#### Pipedream Server Issues

**Problem**: Rate limiting or connection errors
**Solution**:
1. Add a Pipedream API key for higher limits
2. Check Pipedream service status
3. Verify internet connectivity

**Problem**: "Authentication failed" with API key
**Solution**:
1. Verify API key format (should start with `pd_`)
2. Check that API key is active in Pipedream dashboard
3. Regenerate API key if necessary

### Diagnostic Steps

1. **Check Authentication Status**
   - Review the authentication indicators in the tools list
   - Ensure all required credentials are provided

2. **Verify Server Configuration**
   - Expand server configuration panels
   - Check for validation errors or warnings

3. **Test Individual Servers**
   - Disable all servers except the problematic one
   - Test functionality with a simple operation

4. **Reset Configuration**
   - Use "Reset All" to return to default settings
   - Reconfigure servers one by one

### Error Messages

#### Configuration Errors
- **"Server name is required"**: Server configuration is incomplete
- **"Docker image is required"**: Docker server missing image specification
- **"Server URL is required"**: Remote server missing URL configuration

#### Authentication Errors
- **"GitHub token is required"**: GitHub server needs Personal Access Token
- **"Query API key is required"**: Supabase server needs API key
- **"Invalid token format"**: Authentication credential format is incorrect

## Best Practices

### Security Guidelines

1. **Use Minimal Permissions**
   - Only enable servers you actively need
   - Configure "Allowed Tools" to restrict functionality
   - Use read-only mode when write access isn't needed

2. **Regular Token Rotation**
   - Rotate GitHub Personal Access Tokens regularly
   - Update API keys periodically
   - Monitor for unauthorized access

3. **Approval Settings**
   - Keep "Skip Approval" disabled for write operations
   - Enable approval for sensitive operations
   - Review tool execution requests carefully

### Performance Optimization

1. **Selective Server Enabling**
   - Only enable servers you're actively using
   - Disable unused servers to reduce overhead
   - Monitor server response times

2. **Tool Filtering**
   - Use "Allowed Tools" to limit available functionality
   - Focus on specific use cases
   - Avoid enabling all tools if not needed

### Organization and Management

1. **Logical Grouping**
   - Enable related servers together (e.g., all Microsoft services)
   - Configure similar approval settings for related services
   - Document your configuration choices

2. **Regular Maintenance**
   - Review and update server configurations
   - Check for deprecated settings or services
   - Update authentication credentials as needed

## Advanced Configuration

### Custom Headers and Environment Variables

Some servers support additional configuration options:

#### GitHub Server Environment Variables
```
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_TOOLSETS=issues,pulls,repos
GITHUB_READ_ONLY=false
```

#### Supabase Server Environment Variables
```
QUERY_API_KEY=sk_xxxxxxxxxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

#### Pipedream Server Headers
```
X-App-Slug: office365_mail (for Outlook)
X-App-Slug: microsoft_teams (for Teams)
X-App-Slug: gmail (for Gmail)
Authorization: Bearer pd_xxxxxxxxxxxx (if using API key)
```

### Legacy Mode Support

If you need to use the original single-server configuration:

1. **Toggle Multi-Server Mode Off**
   - Switch the "Multi-Server" toggle to disabled
   - This reveals the legacy configuration interface

2. **Legacy Configuration Fields**
   - **Label**: Server identification name
   - **URL**: MCP server endpoint
   - **Allowed**: Comma-separated list of allowed tools
   - **Skip Approval**: Whether to bypass approval prompts

3. **Migration to Multi-Server**
   - Toggle multi-server mode back on when ready
   - Legacy configuration remains preserved
   - Can switch back and forth as needed

### Tool Approval Workflow

Understanding the approval system:

1. **Approval Required** (Default)
   - Each tool execution requires user confirmation
   - Shows tool name, server, and parameters
   - User can approve or decline each request

2. **Skip Approval** (Advanced)
   - Tools execute without confirmation
   - Use only for trusted servers and operations
   - Recommended for read-only operations

3. **Approval UI Features**
   - Server type indicators (🐳 Docker, 🗄️ Query API, 🔌 Pipedream)
   - Tool parameter display
   - Server description and metadata

This user guide provides comprehensive instructions for setting up and managing multiple MCP servers. For additional technical details, refer to the Implementation Summary and Developer Documentation.