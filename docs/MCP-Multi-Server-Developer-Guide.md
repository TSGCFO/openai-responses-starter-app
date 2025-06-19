# MCP Multi-Server Developer Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [Code Organization](#code-organization)
4. [Extension Points](#extension-points)
5. [API Reference](#api-reference)
6. [Adding New MCP Servers](#adding-new-mcp-servers)
7. [Testing Strategies](#testing-strategies)
8. [Performance Considerations](#performance-considerations)
9. [Debugging and Monitoring](#debugging-and-monitoring)

## Overview

This document provides technical documentation for developers working with or extending the MCP multi-server implementation. It covers architecture patterns, extension points, and development best practices.

### System Components

The multi-server implementation consists of several key architectural components:

- **Configuration System**: Type-safe server definitions and validation
- **State Management**: Zustand store with persistence
- **UI Components**: React components for server management
- **Tools Integration**: Dynamic tool generation for AI model
- **Validation System**: Real-time configuration validation

### Design Principles

1. **Type Safety**: Full TypeScript coverage across all components
2. **Extensibility**: Easy addition of new server types
3. **Backward Compatibility**: Legacy configurations preserved
4. **Modularity**: Clear separation of concerns
5. **Performance**: Efficient state updates and rendering

## Architecture Deep Dive

### Configuration Type System

The type system provides the foundation for multi-server support:

```typescript
// Core server type enumeration
export type McpServerType = 'docker' | 'query_api' | 'remote_pipedream';

// Unified authentication configuration
export type McpAuthConfig = {
  // Docker-based authentication
  github_token?: string;
  github_toolsets?: string;
  github_read_only?: boolean;
  
  // Query API authentication
  query_api_key?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  supabase_service_role_key?: string;
  
  // Pipedream authentication
  pipedream_api_key?: string;
  custom_headers?: Record<string, string>;
};

// Complete server configuration
export type McpServerConfig = {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // User-friendly description
  type: McpServerType;          // Server type for behavior
  server_url?: string;          // For remote servers
  docker_image?: string;        // For docker servers
  app_slug?: string;            // For Pipedream servers
  enabled: boolean;             // Runtime state
  skip_approval: boolean;       // Approval bypass
  allowed_tools: string;        // Tool filtering
  auth_config: McpAuthConfig;   // Authentication data
  required_env_vars: string[];  // Required environment variables
  optional_env_vars: string[];  // Optional environment variables
};
```

### State Management Architecture

The store uses Zustand with persistence middleware:

```typescript
interface StoreState {
  // Legacy compatibility
  mcpEnabled: boolean;
  mcpConfig: McpConfig;
  
  // Multi-server state
  mcpServers: McpServerConfig[];
  
  // Actions
  setMcpServers: (servers: McpServerConfig[]) => void;
  updateMcpServer: (serverId: string, updates: Partial<McpServerConfig>) => void;
  toggleMcpServer: (serverId: string) => void;
  resetMcpServers: () => void;
}
```

**State Update Patterns:**

```typescript
// Update individual server
updateMcpServer: (serverId, updates) => set((state) => ({
  mcpServers: state.mcpServers.map(server =>
    server.id === serverId ? { ...server, ...updates } : server
  )
}))

// Toggle server enabled state
toggleMcpServer: (serverId) => set((state) => ({
  mcpServers: state.mcpServers.map(server =>
    server.id === serverId ? { ...server, enabled: !server.enabled } : server
  )
}))
```

### Tools Generation Logic

The [`getTools()`](lib/tools/tools.ts:9) function processes enabled servers:

```typescript
// Multi-server MCP support
const enabledServers = getEnabledServers(mcpServers);
enabledServers.forEach(server => {
  const mcpTool: any = {
    type: "mcp",
    server_label: server.name,
  };

  // Type-specific configuration
  if (server.type === 'docker') {
    mcpTool.docker_image = server.docker_image;
    if (server.auth_config.github_token) {
      mcpTool.env = {
        GITHUB_PERSONAL_ACCESS_TOKEN: server.auth_config.github_token,
        ...(server.auth_config.github_toolsets && { 
          GITHUB_TOOLSETS: server.auth_config.github_toolsets 
        }),
        ...(server.auth_config.github_read_only !== undefined && { 
          GITHUB_READ_ONLY: server.auth_config.github_read_only.toString() 
        }),
      };
    }
  } else if (server.type === 'query_api') {
    mcpTool.server_url = server.server_url;
    if (server.auth_config.query_api_key) {
      mcpTool.env = {
        QUERY_API_KEY: server.auth_config.query_api_key,
        ...(server.auth_config.supabase_url && { 
          SUPABASE_URL: server.auth_config.supabase_url 
        }),
        // ... additional environment variables
      };
    }
  } else if (server.type === 'remote_pipedream') {
    mcpTool.server_url = server.server_url;
    mcpTool.headers = {
      'X-App-Slug': server.app_slug,
      ...(server.auth_config.pipedream_api_key && { 
        'Authorization': `Bearer ${server.auth_config.pipedream_api_key}` 
      }),
      ...server.auth_config.custom_headers,
    };
  }

  // Apply common settings
  if (server.skip_approval) {
    mcpTool.require_approval = "never";
  }
  if (server.allowed_tools.trim()) {
    mcpTool.allowed_tools = server.allowed_tools
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
  }

  tools.push(mcpTool);
});
```

## Code Organization

### File Structure

```
config/
  mcp-servers.ts           # Server type definitions and defaults
components/
  mcp-config.tsx           # Legacy/multi-server toggle
  mcp-multi-config.tsx     # Multi-server configuration UI
  mcp-approval.tsx         # Enhanced approval with server context
  mcp-tools-list.tsx       # Server status and tools display
stores/
  useToolsStore.ts         # Extended store with multi-server support
lib/tools/
  tools.ts                 # Enhanced tools generation
```

### Component Hierarchy

```
mcp-config.tsx (Router)
├── McpMultiConfig (Multi-server mode)
│   └── ServerConfig[] (Individual server panels)
└── Legacy Configuration (Single-server mode)

mcp-tools-list.tsx (Status Display)
├── Legacy Server Display
└── Multi-Server Display
    └── Server Status Cards[]

mcp-approval.tsx (Enhanced Approval)
├── Server Type Icons
├── Server Metadata
└── Approval Actions
```

### Key Architectural Patterns

1. **Composition Pattern**: Components composed of smaller, focused sub-components
2. **Props Interface Pattern**: Consistent TypeScript interfaces for all props
3. **Conditional Rendering**: Type-based rendering for different server types
4. **State Lifting**: Server configuration managed at store level
5. **Event Delegation**: Callbacks passed down for state updates

## Extension Points

### Adding New Server Types

To add a new server type, follow these steps:

#### 1. Extend Type Definitions

```typescript
// In config/mcp-servers.ts
export type McpServerType = 
  | 'docker' 
  | 'query_api' 
  | 'remote_pipedream'
  | 'your_new_type';  // Add your new type

export type McpAuthConfig = {
  // Existing auth configs...
  
  // Add your authentication fields
  your_service_api_key?: string;
  your_service_endpoint?: string;
  your_custom_config?: Record<string, any>;
};
```

#### 2. Add Default Configuration

```typescript
// In defaultMcpServers array
{
  id: 'your-service',
  name: 'Your Service',
  description: 'Description of your service capabilities',
  type: 'your_new_type',
  server_url: 'https://your-service-endpoint.com',
  enabled: false,
  skip_approval: false,
  allowed_tools: '',
  auth_config: {
    your_service_api_key: '',
    your_service_endpoint: '',
  },
  required_env_vars: ['YOUR_SERVICE_API_KEY'],
  optional_env_vars: ['YOUR_SERVICE_ENDPOINT'],
}
```

#### 3. Update Validation Logic

```typescript
// In validateServerConfig function
if (server.type === 'your_new_type') {
  if (!server.server_url) {
    errors.push('Server URL is required for Your Service');
  }
  if (!server.auth_config.your_service_api_key) {
    errors.push('API key is required for Your Service');
  }
}
```

#### 4. Add UI Components

```typescript
// In components/mcp-multi-config.tsx renderAuthFields function
case 'your_new_type':
  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-sm w-32">API Key</label>
        <Input
          type="password"
          placeholder="your_api_key_..."
          className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
          value={server.auth_config.your_service_api_key || ''}
          onChange={(e) => handleAuthUpdate('your_service_api_key', e.target.value)}
        />
      </div>
      {/* Add more auth fields as needed */}
    </>
  );
```

#### 5. Update Tools Generation

```typescript
// In lib/tools/tools.ts
else if (server.type === 'your_new_type') {
  mcpTool.server_url = server.server_url;
  if (server.auth_config.your_service_api_key) {
    mcpTool.headers = {
      'Authorization': `Bearer ${server.auth_config.your_service_api_key}`,
      'X-Custom-Header': server.auth_config.your_service_endpoint,
      // ... other headers
    };
  }
}
```

#### 6. Add Type Icons and Display

```typescript
// In components/mcp-approval.tsx and mcp-tools-list.tsx
const getServerTypeIcon = (type: string) => {
  switch (type) {
    // ... existing cases
    case 'your_new_type':
      return '🔧'; // Choose appropriate emoji
    default:
      return '⚙️';
  }
};

const getServerTypeInfo = (type: string) => {
  switch (type) {
    // ... existing cases
    case 'your_new_type':
      return { 
        icon: '🔧', 
        label: 'Your Service', 
        color: 'bg-indigo-100 text-indigo-800' 
      };
    default:
      return { icon: '⚙️', label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  }
};
```

### Custom Authentication Methods

To add custom authentication patterns:

#### 1. Extend Auth Config Type

```typescript
export type McpAuthConfig = {
  // ... existing fields
  
  // Custom authentication patterns
  oauth_token?: string;
  client_credentials?: {
    client_id: string;
    client_secret: string;
  };
  jwt_config?: {
    private_key: string;
    key_id: string;
    issuer: string;
  };
};
```

#### 2. Add Validation Logic

```typescript
// Custom validation function
export const validateCustomAuth = (authConfig: McpAuthConfig, serverType: McpServerType): string[] => {
  const errors: string[] = [];
  
  if (serverType === 'oauth_service' && !authConfig.oauth_token) {
    errors.push('OAuth token is required');
  }
  
  if (serverType === 'jwt_service') {
    if (!authConfig.jwt_config?.private_key) {
      errors.push('JWT private key is required');
    }
    if (!authConfig.jwt_config?.issuer) {
      errors.push('JWT issuer is required');
    }
  }
  
  return errors;
};
```

#### 3. Create Custom UI Components

```typescript
const OAuthConfiguration = ({ authConfig, onUpdate }: AuthConfigProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm w-32">OAuth Token</label>
        <Input
          type="password"
          value={authConfig.oauth_token || ''}
          onChange={(e) => onUpdate('oauth_token', e.target.value)}
        />
      </div>
      <Button onClick={handleOAuthFlow}>
        Authorize with OAuth
      </Button>
    </div>
  );
};
```

## API Reference

### Store Methods

#### `setMcpServers(servers: McpServerConfig[])`
Sets the complete array of MCP server configurations.

**Parameters:**
- `servers`: Array of server configurations

**Usage:**
```typescript
const { setMcpServers } = useToolsStore();
setMcpServers([...newServerConfigurations]);
```

#### `updateMcpServer(serverId: string, updates: Partial<McpServerConfig>)`
Updates specific fields of a server configuration.

**Parameters:**
- `serverId`: Unique identifier of the server to update
- `updates`: Partial configuration object with fields to update

**Usage:**
```typescript
const { updateMcpServer } = useToolsStore();
updateMcpServer('github-official', {
  enabled: true,
  auth_config: { github_token: 'new_token' }
});
```

#### `toggleMcpServer(serverId: string)`
Toggles the enabled state of a specific server.

**Parameters:**
- `serverId`: Unique identifier of the server to toggle

**Usage:**
```typescript
const { toggleMcpServer } = useToolsStore();
toggleMcpServer('supabase');
```

#### `resetMcpServers()`
Resets all server configurations to default values.

**Usage:**
```typescript
const { resetMcpServers } = useToolsStore();
resetMcpServers();
```

### Utility Functions

#### `getServerById(id: string, servers: McpServerConfig[])`
Retrieves a server configuration by ID.

**Returns:** `McpServerConfig | undefined`

#### `getEnabledServers(servers: McpServerConfig[])`
Filters and returns only enabled servers.

**Returns:** `McpServerConfig[]`

#### `validateServerConfig(server: McpServerConfig)`
Validates a server configuration and returns validation results.

**Returns:** `{ valid: boolean; errors: string[] }`

### Component Props Interfaces

#### `ServerConfigProps`
```typescript
interface ServerConfigProps {
  server: McpServerConfig;
  onUpdate: (serverId: string, updates: Partial<McpServerConfig>) => void;
  onToggle: (serverId: string) => void;
}
```

#### `McpApprovalProps`
```typescript
interface McpApprovalProps {
  item: McpApprovalRequestItem;
  onRespond: (approve: boolean, id: string) => void;
}
```

## Adding New MCP Servers

### Complete Example: Adding Slack Integration

Here's a complete example of adding a new Slack MCP server:

#### 1. Type Definitions

```typescript
// config/mcp-servers.ts
export type McpServerType = 
  | 'docker' 
  | 'query_api' 
  | 'remote_pipedream'
  | 'slack';

export type McpAuthConfig = {
  // ... existing auth configs
  
  // Slack authentication
  slack_bot_token?: string;
  slack_app_token?: string;
  slack_workspace_id?: string;
};
```

#### 2. Default Configuration

```typescript
{
  id: 'slack',
  name: 'Slack',
  description: 'Send messages, manage channels, and interact with Slack workspaces',
  type: 'slack',
  server_url: 'https://slack-mcp-server.example.com',
  enabled: false,
  skip_approval: false,
  allowed_tools: '',
  auth_config: {
    slack_bot_token: '',
    slack_app_token: '',
    slack_workspace_id: '',
  },
  required_env_vars: ['SLACK_BOT_TOKEN'],
  optional_env_vars: ['SLACK_APP_TOKEN', 'SLACK_WORKSPACE_ID'],
}
```

#### 3. Validation Logic

```typescript
if (server.type === 'slack') {
  if (!server.server_url) {
    errors.push('Server URL is required for Slack server');
  }
  if (!server.auth_config.slack_bot_token) {
    errors.push('Slack bot token is required');
  }
  // Validate token format
  if (server.auth_config.slack_bot_token && 
      !server.auth_config.slack_bot_token.startsWith('xoxb-')) {
    errors.push('Slack bot token must start with "xoxb-"');
  }
}
```

#### 4. UI Components

```typescript
case 'slack':
  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-sm w-32">Bot Token</label>
        <Input
          type="password"
          placeholder="xoxb-..."
          className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
          value={server.auth_config.slack_bot_token || ''}
          onChange={(e) => handleAuthUpdate('slack_bot_token', e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm w-32">App Token</label>
        <Input
          type="password"
          placeholder="xapp-..."
          className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
          value={server.auth_config.slack_app_token || ''}
          onChange={(e) => handleAuthUpdate('slack_app_token', e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm w-32">Workspace ID</label>
        <Input
          type="text"
          placeholder="T1234567890"
          className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
          value={server.auth_config.slack_workspace_id || ''}
          onChange={(e) => handleAuthUpdate('slack_workspace_id', e.target.value)}
        />
      </div>
    </>
  );
```

#### 5. Tools Generation

```typescript
else if (server.type === 'slack') {
  mcpTool.server_url = server.server_url;
  if (server.auth_config.slack_bot_token) {
    mcpTool.headers = {
      'Authorization': `Bearer ${server.auth_config.slack_bot_token}`,
      ...(server.auth_config.slack_workspace_id && {
        'X-Slack-Workspace': server.auth_config.slack_workspace_id
      }),
    };
    // Also provide as environment variables if needed
    mcpTool.env = {
      SLACK_BOT_TOKEN: server.auth_config.slack_bot_token,
      ...(server.auth_config.slack_app_token && {
        SLACK_APP_TOKEN: server.auth_config.slack_app_token
      }),
    };
  }
}
```

#### 6. Display Components

```typescript
// Icon and type info
case 'slack':
  return { 
    icon: '💬', 
    label: 'Slack', 
    color: 'bg-purple-100 text-purple-800' 
  };

// Authentication status
{server.type === 'slack' && (
  <span className={server.auth_config.slack_bot_token ? 'text-green-600' : 'text-red-600'}>
    {server.auth_config.slack_bot_token ? '✓ Bot Token Set' : '✗ Bot Token Missing'}
  </span>
)}
```

## Testing Strategies

### Unit Testing Approach

#### Testing Configuration Validation

```typescript
// tests/config/mcp-servers.test.ts
import { validateServerConfig, McpServerConfig } from '@/config/mcp-servers';

describe('validateServerConfig', () => {
  it('should validate GitHub server configuration', () => {
    const validServer: McpServerConfig = {
      id: 'test-github',
      name: 'Test GitHub',
      type: 'docker',
      docker_image: 'ghcr.io/github/github-mcp-server',
      auth_config: { github_token: 'ghp_test_token' },
      // ... other required fields
    };
    
    const result = validateServerConfig(validServer);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return errors for invalid configuration', () => {
    const invalidServer: McpServerConfig = {
      // ... invalid configuration
    };
    
    const result = validateServerConfig(invalidServer);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('GitHub token is required');
  });
});
```

#### Testing Store Operations

```typescript
// tests/stores/useToolsStore.test.ts
import { renderHook, act } from '@testing-library/react';
import useToolsStore from '@/stores/useToolsStore';

describe('useToolsStore MCP operations', () => {
  it('should update server configuration', () => {
    const { result } = renderHook(() => useToolsStore());
    
    act(() => {
      result.current.updateMcpServer('github-official', {
        enabled: true,
        auth_config: { github_token: 'new_token' }
      });
    });
    
    const updatedServer = result.current.mcpServers.find(s => s.id === 'github-official');
    expect(updatedServer?.enabled).toBe(true);
    expect(updatedServer?.auth_config.github_token).toBe('new_token');
  });
});
```

### Integration Testing

#### Component Integration Tests

```typescript
// tests/components/mcp-multi-config.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import McpMultiConfig from '@/components/mcp-multi-config';

describe('McpMultiConfig', () => {
  it('should enable and configure server', async () => {
    render(<McpMultiConfig />);
    
    // Enable GitHub server
    const githubToggle = screen.getByRole('switch', { name: /github official/i });
    fireEvent.click(githubToggle);
    
    // Configure server
    const configureButton = screen.getByText('Configure');
    fireEvent.click(configureButton);
    
    const tokenInput = screen.getByPlaceholderText('ghp_...');
    fireEvent.change(tokenInput, { target: { value: 'ghp_test_token' } });
    
    // Verify configuration is saved
    expect(tokenInput).toHaveValue('ghp_test_token');
  });
});
```

### End-to-End Testing

#### Full Workflow Tests

```typescript
// tests/e2e/mcp-workflow.test.ts
describe('MCP Multi-Server Workflow', () => {
  it('should complete full server setup and usage', async () => {
    // 1. Navigate to MCP configuration
    await page.goto('/');
    await page.click('[data-testid="tools-panel"]');
    
    // 2. Enable multi-server mode
    await page.click('[data-testid="multi-server-toggle"]');
    
    // 3. Configure GitHub server
    await page.click('[data-testid="github-toggle"]');
    await page.click('[data-testid="github-configure"]');
    await page.fill('[data-testid="github-token"]', 'ghp_test_token');
    
    // 4. Verify server appears in tools list
    await page.click('[data-testid="tools-list-tab"]');
    await expect(page.locator('[data-testid="github-server-status"]')).toBeVisible();
    
    // 5. Test tool execution (mock)
    await page.click('[data-testid="start-chat"]');
    await page.fill('[data-testid="message-input"]', 'List my GitHub repositories');
    await page.click('[data-testid="send-message"]');
    
    // 6. Verify approval workflow
    await expect(page.locator('[data-testid="mcp-approval"]')).toBeVisible();
    await page.click('[data-testid="approve-button"]');
  });
});
```

### Validation Testing

#### Configuration Validation Tests

```typescript
describe('Server Configuration Validation', () => {
  const testCases = [
    {
      name: 'GitHub server with missing token',
      server: { type: 'docker', auth_config: {} },
      expectedErrors: ['GitHub token is required']
    },
    {
      name: 'Supabase server with missing API key',
      server: { type: 'query_api', auth_config: {} },
      expectedErrors: ['Query API key is required']
    }
  ];

  testCases.forEach(({ name, server, expectedErrors }) => {
    it(`should validate ${name}`, () => {
      const result = validateServerConfig(server as McpServerConfig);
      expectedErrors.forEach(error => {
        expect(result.errors).toContain(error);
      });
    });
  });
});
```

## Performance Considerations

### Optimization Strategies

#### 1. Efficient State Updates

```typescript
// Optimized server update pattern
const updateMcpServer = useCallback((serverId: string, updates: Partial<McpServerConfig>) => {
  setMcpServers(servers => 
    servers.map(server => 
      server.id === serverId 
        ? { ...server, ...updates }
        : server
    )
  );
}, []);
```

#### 2. Component Memoization

```typescript
// Memoize expensive server configuration components
const ServerConfig = React.memo<ServerConfigProps>(({ server, onUpdate, onToggle }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.server.id === nextProps.server.id &&
    prevProps.server.enabled === nextProps.server.enabled &&
    JSON.stringify(prevProps.server.auth_config) === JSON.stringify(nextProps.server.auth_config)
  );
});
```

#### 3. Lazy Loading

```typescript
// Lazy load server configuration panels
const ServerConfigPanel = lazy(() => import('./ServerConfigPanel'));

// Use with Suspense
<Suspense fallback={<div>Loading configuration...</div>}>
  <ServerConfigPanel server={server} />
</Suspense>
```

#### 4. Debounced Validation

```typescript
// Debounce validation for better performance
import { useMemo } from 'react';
import { debounce } from 'lodash';

const debouncedValidation = useMemo(
  () => debounce((server: McpServerConfig) => {
    const validation = validateServerConfig(server);
    setErrors(validation.errors);
  }, 300),
  []
);

useEffect(() => {
  debouncedValidation(server);
  return () => debouncedValidation.cancel();
}, [server, debouncedValidation]);
```

### Memory Management

#### 1. Cleanup Patterns

```typescript
useEffect(() => {
  // Setup subscriptions or intervals
  const interval = setInterval(checkServerStatus, 30000);
  
  return () => {
    // Cleanup on unmount
    clearInterval(interval);
  };
}, []);
```

#### 2. Selective Re-rendering

```typescript
// Use Zustand selectors to prevent unnecessary re-renders
const enabledServers = useToolsStore(state => 
  state.mcpServers.filter(server => server.enabled)
);
```

## Debugging and Monitoring

### Debug Utilities

#### 1. Development Logging

```typescript
// Development-only logging
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MCP Debug] ${message}`, data);
  }
};

// Usage in components
useEffect(() => {
  debugLog('Server configuration changed', server);
}, [server]);
```

#### 2. Store State Inspector

```typescript
// Add to useToolsStore for development
const useToolsStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Store implementation
      }),
      { name: 'tools-store' }
    ),
    { name: 'MCP Tools Store' }
  )
);
```

#### 3. Validation Error Tracking

```typescript
const trackValidationError = (serverId: string, errors: string[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Validation errors for ${serverId}:`, errors);
  }
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // errorTracker.captureMessage(`MCP validation errors: ${serverId}`, {
    //   extra: { errors, serverId }
    // });
  }
};
```

### Performance Monitoring

#### 1. Render Performance

```typescript
// Monitor component render performance
const ServerConfig = React.memo(({ server, onUpdate, onToggle }) => {
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      if (endTime - startTime > 16) { // > 1 frame
        console.warn(`ServerConfig render took ${endTime - startTime}ms`);
      }
    };
  });
  
  // Component implementation
});
```

#### 2. Configuration Change Tracking

```typescript
// Track configuration change frequency
const useConfigChangeTracking = () => {
  const configChangeCount = useRef(0);
  
  const trackConfigChange = useCallback((serverId: string, field: string) => {
    configChangeCount.current++;
    if (configChangeCount.current % 10 === 0) {
      console.log(`Config changes: ${configChangeCount.current}`);
    }
  }, []);
  
  return trackConfigChange;
};
```

This developer documentation provides comprehensive technical guidance for extending and maintaining the MCP multi-server implementation. It includes practical examples, testing strategies, and performance optimization techniques for building robust MCP integrations.