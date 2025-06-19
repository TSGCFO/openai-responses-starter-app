export type McpServerType = 'docker' | 'query_api' | 'remote_pipedream';

export type McpAuthConfig = {
  // Docker-based authentication
  github_token?: string;
  github_toolsets?: string;
  github_read_only?: boolean;
  
  // Supabase authentication options
  query_api_key?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  supabase_service_role_key?: string;
  
  // Pipedream authentication
  pipedream_api_key?: string;
  custom_headers?: Record<string, string>;
};

export type McpServerConfig = {
  id: string;
  name: string;
  description: string;
  type: McpServerType;
  server_url?: string; // For remote servers
  docker_image?: string; // For docker servers
  app_slug?: string; // For Pipedream servers
  enabled: boolean;
  skip_approval: boolean;
  allowed_tools: string;
  auth_config: McpAuthConfig;
  required_env_vars: string[];
  optional_env_vars: string[];
};

// Default server configurations based on technical documentation
export const defaultMcpServers: McpServerConfig[] = [
  {
    id: 'github-official',
    name: 'GitHub Official',
    description: 'Official GitHub MCP server for repository management, issues, PRs, and more',
    type: 'docker',
    docker_image: 'ghcr.io/github/github-mcp-server',
    enabled: false,
    skip_approval: false,
    allowed_tools: '',
    auth_config: {
      github_token: '',
      github_toolsets: '',
      github_read_only: false,
    },
    required_env_vars: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    optional_env_vars: ['GITHUB_TOOLSETS', 'GITHUB_READ_ONLY'],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Query and manage Supabase databases with SQL operations',
    type: 'query_api',
    server_url: 'supabase-mcp-server',
    enabled: false,
    skip_approval: false,
    allowed_tools: '',
    auth_config: {
      query_api_key: '',
      supabase_url: '',
      supabase_anon_key: '',
      supabase_service_role_key: '',
    },
    required_env_vars: ['QUERY_API_KEY'],
    optional_env_vars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Access and manage Outlook emails, calendar, and contacts',
    type: 'remote_pipedream',
    server_url: 'https://remote.mcp.pipedream.net',
    app_slug: 'office365_mail',
    enabled: false,
    skip_approval: false,
    allowed_tools: '',
    auth_config: {
      pipedream_api_key: '',
      custom_headers: {
        'X-App-Slug': 'office365_mail',
      },
    },
    required_env_vars: [],
    optional_env_vars: ['PIPEDREAM_API_KEY'],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Interact with Microsoft Teams channels, messages, and meetings',
    type: 'remote_pipedream',
    server_url: 'https://remote.mcp.pipedream.net',
    app_slug: 'microsoft_teams',
    enabled: false,
    skip_approval: false,
    allowed_tools: '',
    auth_config: {
      pipedream_api_key: '',
      custom_headers: {
        'X-App-Slug': 'microsoft_teams',
      },
    },
    required_env_vars: [],
    optional_env_vars: ['PIPEDREAM_API_KEY'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Access and manage Gmail emails, labels, and threads',
    type: 'remote_pipedream',
    server_url: 'https://remote.mcp.pipedream.net',
    app_slug: 'gmail',
    enabled: false,
    skip_approval: false,
    allowed_tools: '',
    auth_config: {
      pipedream_api_key: '',
      custom_headers: {
        'X-App-Slug': 'gmail',
      },
    },
    required_env_vars: [],
    optional_env_vars: ['PIPEDREAM_API_KEY'],
  },
];

// Helper functions for server configuration
export const getServerById = (id: string, servers: McpServerConfig[]): McpServerConfig | undefined => {
  return servers.find(server => server.id === id);
};

export const getEnabledServers = (servers: McpServerConfig[]): McpServerConfig[] => {
  return servers.filter(server => server.enabled);
};

export const validateServerConfig = (server: McpServerConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!server.name.trim()) {
    errors.push('Server name is required');
  }
  
  if (server.type === 'docker' && !server.docker_image) {
    errors.push('Docker image is required for Docker-based servers');
  }
  
  if (server.type === 'query_api' && !server.server_url) {
    errors.push('Server URL is required for query API servers');
  }
  
  if (server.type === 'remote_pipedream') {
    if (!server.server_url) {
      errors.push('Server URL is required for Pipedream servers');
    }
    if (!server.app_slug) {
      errors.push('App slug is required for Pipedream servers');
    }
  }
  
  // Validate required environment variables based on server type
  server.required_env_vars.forEach(envVar => {
    if (server.type === 'docker' && envVar === 'GITHUB_PERSONAL_ACCESS_TOKEN' && !server.auth_config.github_token) {
      errors.push(`${envVar} is required for GitHub server`);
    }
    if (server.type === 'query_api' && envVar === 'QUERY_API_KEY' && !server.auth_config.query_api_key) {
      errors.push(`${envVar} is required for Supabase server`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};