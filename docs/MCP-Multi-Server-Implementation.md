# MCP Multi-Server Implementation

This document describes the implementation of the multi-server MCP (Model Context Protocol) architecture that extends the original single-server implementation to support multiple concurrent MCP servers.

## Overview

The multi-server implementation allows users to enable and configure multiple MCP servers simultaneously, including:

1. **GitHub Official** - Docker-based server for repository management, issues, PRs, and more
2. **Supabase** - Query API-based server for database operations
3. **Microsoft Outlook** - Pipedream-based server for email management
4. **Microsoft Teams** - Pipedream-based server for team collaboration
5. **Gmail** - Pipedream-based server for Gmail integration

## Architecture Changes

### 1. Store Architecture Extension (`stores/useToolsStore.ts`)

**Key Changes:**
- Extended `StoreState` interface to include multi-server management
- Added `mcpServers: McpServerConfig[]` for managing multiple servers
- Maintained backward compatibility with legacy `mcpConfig` and `mcpEnabled`
- Added new methods:
  - `setMcpServers()` - Set all servers
  - `updateMcpServer()` - Update individual server configuration
  - `toggleMcpServer()` - Enable/disable individual servers
  - `resetMcpServers()` - Reset to default configurations

### 2. Server Configuration Types (`config/mcp-servers.ts`)

**New Types:**
- `McpServerType` - Defines server types: `docker`, `query_api`, `remote_pipedream`
- `McpAuthConfig` - Unified authentication configuration for all server types
- `McpServerConfig` - Complete server configuration including auth, validation, and metadata

**Default Servers:**
- Pre-configured with proper authentication requirements
- Environment variable mappings for each server type
- Validation functions for required fields

### 3. Tools Integration (`lib/tools/tools.ts`)

**Enhanced `getTools()` Function:**
- Maintains backward compatibility with legacy single server
- Processes multiple enabled servers simultaneously
- Handles different server types with appropriate configuration:
  - **Docker servers**: Environment variable injection
  - **Query API servers**: Direct URL and API key configuration
  - **Pipedream servers**: Custom headers and app slug configuration

### 4. UI Components

#### `components/mcp-multi-config.tsx` (New)
- Individual server configuration panels
- Type-specific authentication fields
- Real-time validation with error display
- Expandable server cards for better UX

#### `components/mcp-config.tsx` (Updated)
- Toggle between legacy and multi-server modes
- Maintains existing single-server functionality
- Integration with new multi-server component

#### `components/mcp-approval.tsx` (Enhanced)
- Enhanced approval UI with server type information
- Server description and metadata display
- Visual indicators for different server types

#### `components/mcp-tools-list.tsx` (Updated)
- Displays all active servers with status
- Authentication status indicators
- Server type badges and icons
- Tools and configuration summary

## Server Types and Configuration

### 1. Docker-Based Servers (GitHub Official)

```typescript
{
  type: 'docker',
  docker_image: 'ghcr.io/github/github-mcp-server',
  auth_config: {
    github_token: string,
    github_toolsets?: string,
    github_read_only?: boolean
  }
}
```

**Environment Variables:**
- `GITHUB_PERSONAL_ACCESS_TOKEN` (required)
- `GITHUB_TOOLSETS` (optional)
- `GITHUB_READ_ONLY` (optional)

### 2. Query API Servers (Supabase)

```typescript
{
  type: 'query_api',
  server_url: 'supabase-mcp-server',
  auth_config: {
    query_api_key: string,
    supabase_url?: string,
    supabase_anon_key?: string,
    supabase_service_role_key?: string
  }
}
```

**Environment Variables:**
- `QUERY_API_KEY` (required)
- `SUPABASE_URL` (optional)
- `SUPABASE_ANON_KEY` (optional)
- `SUPABASE_SERVICE_ROLE_KEY` (optional)

### 3. Remote Pipedream Servers (Outlook, Teams, Gmail)

```typescript
{
  type: 'remote_pipedream',
  server_url: 'https://remote.mcp.pipedream.net',
  app_slug: string,
  auth_config: {
    pipedream_api_key?: string,
    custom_headers: Record<string, string>
  }
}
```

**Headers:**
- `X-App-Slug`: Required app identifier
- `Authorization`: Optional Bearer token
- Custom headers as needed

## Backward Compatibility

The implementation maintains full backward compatibility:

1. **Legacy Configuration**: Existing single-server configurations continue to work
2. **Store Structure**: Original `mcpConfig` and `mcpEnabled` properties preserved
3. **UI Toggle**: Users can switch between legacy and multi-server modes
4. **Tools Generation**: Both legacy and multi-server configurations are processed

## Usage Examples

### Enable GitHub Server
```typescript
// Update server configuration
updateMcpServer('github-official', {
  enabled: true,
  auth_config: {
    github_token: 'ghp_xxxxxxxxxxxx',
    github_toolsets: 'issues,pulls,repos'
  }
});
```

### Configure Supabase
```typescript
updateMcpServer('supabase', {
  enabled: true,
  auth_config: {
    query_api_key: 'sk-xxxxxxxxxxxx',
    supabase_url: 'https://xxx.supabase.co'
  }
});
```

### Enable Pipedream Services
```typescript
// Enable Outlook
updateMcpServer('outlook', {
  enabled: true,
  auth_config: {
    pipedream_api_key: 'pd_xxxxxxxxxxxx'
  }
});
```

## Validation and Error Handling

- **Configuration Validation**: Real-time validation of server configurations
- **Required Fields**: Enforcement of required authentication parameters
- **Type Safety**: Full TypeScript coverage for all server configurations
- **Error Display**: User-friendly error messages in the UI

## Security Considerations

- **Token Storage**: Sensitive tokens stored in Zustand with persistence
- **Environment Variables**: Proper environment variable mapping for different deployment types
- **Header Security**: Secure header configuration for Pipedream integrations
- **Approval System**: Maintained approval workflow for tool execution

## Future Extensibility

The architecture is designed for easy extension:

1. **New Server Types**: Add new `McpServerType` values
2. **Authentication Methods**: Extend `McpAuthConfig` interface
3. **Custom Servers**: Add new default configurations
4. **UI Components**: Reusable server configuration components

This implementation provides a robust foundation for managing multiple MCP servers while maintaining the simplicity and security of the original single-server approach.