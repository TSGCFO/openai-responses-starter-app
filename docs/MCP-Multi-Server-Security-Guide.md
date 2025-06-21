# MCP Multi-Server Security Considerations

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication Token Handling](#authentication-token-handling)
3. [Approval Workflow Security](#approval-workflow-security)
4. [Credential Management Best Practices](#credential-management-best-practices)
5. [Privacy Considerations](#privacy-considerations)
6. [Server-Specific Security](#server-specific-security)
7. [Client-Side Security Measures](#client-side-security-measures)
8. [Security Monitoring and Auditing](#security-monitoring-and-auditing)
9. [Incident Response Guidelines](#incident-response-guidelines)

## Security Overview

The MCP multi-server implementation handles sensitive authentication credentials and facilitates communication with external services. This document outlines security considerations, best practices, and mitigation strategies for maintaining a secure environment.

### Security Principles

1. **Least Privilege**: Grant minimal necessary permissions
2. **Defense in Depth**: Multiple layers of security controls
3. **Secure by Default**: Safe default configurations
4. **Transparency**: Clear visibility into security decisions
5. **User Control**: Users maintain control over their data and connections

### Threat Model

#### Potential Threats

1. **Credential Exposure**: API keys and tokens stored in browser storage
2. **Man-in-the-Middle**: Interception of communication with MCP servers
3. **Cross-Site Scripting (XSS)**: Malicious scripts accessing stored credentials
4. **Unauthorized Tool Execution**: Bypassing approval mechanisms
5. **Data Exfiltration**: Sensitive data sent to unintended servers
6. **Session Hijacking**: Unauthorized access to user sessions

#### Assets to Protect

- **Authentication Credentials**: API keys, tokens, passwords
- **User Data**: Personal information, conversation history
- **System Configuration**: Server settings, tool permissions
- **Communication Channels**: Data in transit between client and servers

## Authentication Token Handling

### Storage Security

Authentication tokens are stored client-side using browser localStorage with the following security considerations:

#### Secure Storage Patterns

```typescript
// Token storage with validation
const secureTokenStorage = {
  store: (serverId: string, tokenType: string, value: string) => {
    // Validate token format before storage
    if (!validateTokenFormat(value, tokenType)) {
      throw new Error('Invalid token format');
    }
    
    // Store with prefixed key for organization
    const key = `mcp_auth_${serverId}_${tokenType}`;
    localStorage.setItem(key, value);
    
    // Log token storage event (without token value)
    logSecurityEvent({
      type: 'token_stored',
      serverId,
      tokenType,
      timestamp: new Date(),
      risk_level: 'low'
    });
  },
  
  retrieve: (serverId: string, tokenType: string): string | null => {
    const key = `mcp_auth_${serverId}_${tokenType}`;
    return localStorage.getItem(key);
  },
  
  clear: (serverId: string, tokenType?: string) => {
    if (tokenType) {
      const key = `mcp_auth_${serverId}_${tokenType}`;
      localStorage.removeItem(key);
    } else {
      // Clear all tokens for server
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`mcp_auth_${serverId}_`)) {
          localStorage.removeItem(key);
        }
      });
    }
  }
};
```

#### Token Validation

```typescript
// Comprehensive token validation
export const validateTokenFormat = (token: string, serverType: McpServerType): boolean => {
  switch (serverType) {
    case 'docker':
      // GitHub Personal Access Token validation
      return token.startsWith('ghp_') && token.length >= 40;
      
    case 'query_api':
      // Query API key validation
      return token.startsWith('sk-') && token.length >= 32;
      
    case 'remote_pipedream':
      // Pipedream API key validation
      return token.startsWith('pd_') && token.length >= 32;
      
    default:
      return false;
  }
};

// Security-focused token validation with additional checks
export const validateTokenSecurity = (server: McpServerConfig): SecurityValidation => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  switch (server.type) {
    case 'docker':
      if (server.auth_config.github_token) {
        const token = server.auth_config.github_token;
        
        // Format validation
        if (!token.startsWith('ghp_')) {
          issues.push('GitHub token format appears invalid - should start with "ghp_"');
        }
        
        // Length validation
        if (token.length < 40) {
          issues.push('GitHub token appears too short - should be at least 40 characters');
        }
        
        // Check for test tokens
        if (token.includes('test') || token.includes('demo')) {
          recommendations.push('Avoid using test tokens in production');
        }
      }
      break;
      
    case 'query_api':
      if (server.auth_config.query_api_key) {
        const key = server.auth_config.query_api_key;
        
        if (!key.startsWith('sk-')) {
          issues.push('Query API key format may be invalid - should start with "sk-"');
        }
        
        if (key.length < 32) {
          issues.push('Query API key appears too short');
        }
      }
      break;
      
    case 'remote_pipedream':
      if (server.auth_config.pipedream_api_key) {
        const key = server.auth_config.pipedream_api_key;
        
        if (!key.startsWith('pd_')) {
          issues.push('Pipedream API key format appears invalid - should start with "pd_"');
        }
      }
      break;
  }
  
  return {
    secure: issues.length === 0,
    issues,
    recommendations
  };
};
```

### Token Lifecycle Management

#### Secure Token Rotation

```typescript
// Token rotation tracking and reminders
interface TokenMetadata {
  createdAt: Date;
  lastRotated?: Date;
  rotationReminder: boolean;
}

const tokenMetadataStore = {
  set: (serverId: string, metadata: TokenMetadata) => {
    localStorage.setItem(`token_metadata_${serverId}`, JSON.stringify(metadata));
  },
  
  get: (serverId: string): TokenMetadata | null => {
    const stored = localStorage.getItem(`token_metadata_${serverId}`);
    return stored ? JSON.parse(stored) : null;
  },
  
  checkRotationNeeded: (serverId: string): boolean => {
    const metadata = tokenMetadataStore.get(serverId);
    if (!metadata) return false;
    
    const daysSinceCreation = daysBetween(metadata.createdAt, new Date());
    const daysSinceRotation = metadata.lastRotated 
      ? daysBetween(metadata.lastRotated, new Date())
      : daysSinceCreation;
    
    return daysSinceRotation > 90; // Recommend rotation after 90 days
  }
};
```

## Approval Workflow Security

### Enhanced Approval System

The approval workflow provides critical security control over MCP tool execution:

```typescript
// Risk-based approval system
interface ToolExecutionRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  requiresEnhancedApproval: boolean;
}

const assessToolExecutionRisk = (
  toolName: string,
  arguments: Record<string, any>,
  serverConfig: McpServerConfig
): ToolExecutionRisk => {
  const factors: string[] = [];
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Check for destructive operations
  const destructivePatterns = [
    'delete', 'remove', 'destroy', 'drop', 'truncate', 'purge',
    'kill', 'terminate', 'revoke', 'disable'
  ];
  
  if (destructivePatterns.some(pattern => 
    toolName.toLowerCase().includes(pattern) ||
    JSON.stringify(arguments).toLowerCase().includes(pattern)
  )) {
    level = 'critical';
    factors.push('Potentially destructive operation detected');
  }
  
  // Check for administrative operations
  const adminPatterns = [
    'admin', 'sudo', 'root', 'create_user', 'grant', 'chmod',
    'owner', 'permission', 'access_control'
  ];
  
  if (adminPatterns.some(pattern => 
    toolName.toLowerCase().includes(pattern)
  )) {
    level = level === 'critical' ? 'critical' : 'high';
    factors.push('Administrative operation');
  }
  
  // Check for bulk operations
  const bulkSize = arguments.batch_size || arguments.count || arguments.limit;
  if (bulkSize && bulkSize > 100) {
    level = level === 'critical' ? 'critical' : 'medium';
    factors.push(`Large batch operation (${bulkSize} items)`);
  }
  
  // Check for sensitive data access
  const sensitivePatterns = ['email', 'contact', 'private', 'confidential', 'secret'];
  if (sensitivePatterns.some(pattern =>
    JSON.stringify(arguments).toLowerCase().includes(pattern)
  )) {
    level = level === 'critical' ? 'critical' : 'medium';
    factors.push('Access to potentially sensitive data');
  }
  
  return {
    level,
    factors,
    requiresEnhancedApproval: level === 'high' || level === 'critical'
  };
};
```

### Secure Approval UI

```typescript
// Enhanced approval component with security context
const SecureApprovalComponent = ({ item, onRespond }: ApprovalProps) => {
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const riskAssessment = assessToolExecutionRisk(
    item.name,
    item.arguments,
    item.serverConfig
  );
  
  const handleApprove = () => {
    if (riskAssessment.requiresEnhancedApproval && !confirmationRequired) {
      setConfirmationRequired(true);
      return;
    }
    
    // Log approval decision
    logSecurityEvent({
      type: 'tool_approved',
      details: {
        toolName: item.name,
        serverId: item.server_label,
        riskLevel: riskAssessment.level
      },
      timestamp: new Date(),
      risk_level: riskAssessment.level === 'critical' ? 'high' : 'medium'
    });
    
    onRespond(true, item.id);
  };
  
  const handleDecline = () => {
    logSecurityEvent({
      type: 'tool_declined',
      details: {
        toolName: item.name,
        serverId: item.server_label,
        riskLevel: riskAssessment.level
      },
      timestamp: new Date(),
      risk_level: 'low'
    });
    
    onRespond(false, item.id);
  };
  
  return (
    <div className="approval-panel">
      {/* Risk indicator */}
      <div className={`risk-indicator risk-${riskAssessment.level}`}>
        <span className="risk-icon">
          {riskAssessment.level === 'critical' ? '🚨' : 
           riskAssessment.level === 'high' ? '⚠️' : 
           riskAssessment.level === 'medium' ? '⚡' : '✅'}
        </span>
        Risk Level: {riskAssessment.level.toUpperCase()}
      </div>
      
      {/* Security warnings */}
      {riskAssessment.factors.length > 0 && (
        <div className="security-warnings">
          <h4>🔒 Security Considerations:</h4>
          <ul>
            {riskAssessment.factors.map((factor, index) => (
              <li key={index}>{factor}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Enhanced confirmation for high-risk operations */}
      {confirmationRequired && (
        <div className="enhanced-confirmation">
          <h4>⚠️ High-Risk Operation Confirmation</h4>
          <p>This operation has been flagged as high-risk. Please confirm you understand the implications:</p>
          <label>
            <input type="checkbox" onChange={(e) => setConfirmationRequired(!e.target.checked)} />
            I understand this operation may have significant impact
          </label>
        </div>
      )}
      
      {/* Tool execution details */}
      <div className="tool-details">
        <div><strong>Tool:</strong> {item.name}</div>
        <div><strong>Server:</strong> {item.server_label}</div>
        <div><strong>Server Type:</strong> {item.serverConfig?.type}</div>
        <details>
          <summary>View Arguments</summary>
          <pre>{JSON.stringify(item.arguments, null, 2)}</pre>
        </details>
      </div>
      
      {/* Approval actions */}
      <div className="approval-actions">
        <button 
          onClick={handleApprove}
          disabled={riskAssessment.requiresEnhancedApproval && confirmationRequired}
          className="approve-button"
        >
          {riskAssessment.requiresEnhancedApproval ? 'Confirm & Approve' : 'Approve'}
        </button>
        <button onClick={handleDecline} className="decline-button">
          Decline
        </button>
      </div>
    </div>
  );
};
```

## Credential Management Best Practices

### Secure Configuration Guidelines

#### 1. Minimal Permissions Principle

```typescript
// Recommended permission scopes for each server type
const recommendedPermissions = {
  github: {
    minimal: ['public_repo'],
    standard: ['repo', 'read:org'],
    administrative: ['repo', 'admin:org', 'delete_repo'] // Use with extreme caution
  },
  
  supabase: {
    read_only: ['SELECT'],
    standard: ['SELECT', 'INSERT', 'UPDATE'],
    administrative: ['ALL'] // Use with extreme caution
  },
  
  pipedream: {
    minimal: ['workflows:read'],
    standard: ['workflows:read', 'workflows:write'],
    administrative: ['workflows:admin'] // Use with extreme caution
  }
};

// Validate permission levels
const validatePermissionLevel = (server: McpServerConfig, requestedLevel: string): ValidationResult => {
  const serverPerms = recommendedPermissions[server.type];
  if (!serverPerms || !serverPerms[requestedLevel]) {
    return {
      valid: false,
      issues: [`Invalid permission level: ${requestedLevel}`],
      recommendations: [`Available levels: ${Object.keys(serverPerms).join(', ')}`]
    };
  }
  
  if (requestedLevel === 'administrative') {
    return {
      valid: true,
      issues: [],
      recommendations: ['Administrative permissions granted - use with extreme caution']
    };
  }
  
  return { valid: true, issues: [], recommendations: [] };
};
```

#### 2. Environment Variable Security

```typescript
// Secure environment variable creation
const createSecureEnvironment = (server: McpServerConfig): Record<string, string> => {
  const env: Record<string, string> = {};
  
  // Only include validated, non-empty credentials
  switch (server.type) {
    case 'docker':
      if (server.auth_config.github_token && 
          validateTokenFormat(server.auth_config.github_token, 'docker')) {
        env.GITHUB_PERSONAL_ACCESS_TOKEN = server.auth_config.github_token;
        
        // Optional environment variables
        if (server.auth_config.github_toolsets) {
          env.GITHUB_TOOLSETS = server.auth_config.github_toolsets;
        }
        
        if (server.auth_config.github_read_only !== undefined) {
          env.GITHUB_READ_ONLY = server.auth_config.github_read_only.toString();
        }
      }
      break;
      
    case 'query_api':
      if (server.auth_config.query_api_key &&
          validateTokenFormat(server.auth_config.query_api_key, 'query_api')) {
        env.QUERY_API_KEY = server.auth_config.query_api_key;
        
        // Optional Supabase-specific variables
        if (server.auth_config.supabase_url) {
          env.SUPABASE_URL = server.auth_config.supabase_url;
        }
        if (server.auth_config.supabase_anon_key) {
          env.SUPABASE_ANON_KEY = server.auth_config.supabase_anon_key;
        }
        if (server.auth_config.supabase_service_role_key) {
          env.SUPABASE_SERVICE_ROLE_KEY = server.auth_config.supabase_service_role_key;
        }
      }
      break;
  }
  
  // Log environment variable creation (without values)
  logSecurityEvent({
    type: 'env_vars_created',
    details: {
      serverId: server.id,
      variables: Object.keys(env)
    },
    timestamp: new Date(),
    risk_level: 'low'
  });
  
  return env;
};
```

## Privacy Considerations

### Data Minimization Strategies

#### 1. Conversation Data Filtering

```typescript
// Privacy-preserving conversation filtering
interface PrivacySettings {
  shareConversationHistory: boolean;
  maxHistoryLength: number;
  excludePersonalInfo: boolean;
  excludeCodeSnippets: boolean;
  dataRetentionDays: number;
}

const filterConversationData = (
  messages: any[],
  server: McpServerConfig,
  privacySettings: PrivacySettings
): any[] => {
  if (!privacySettings.shareConversationHistory) {
    // Only share the current message
    return messages.slice(-1);
  }
  
  // Limit history length
  let filteredMessages = messages.slice(-privacySettings.maxHistoryLength);
  
  if (privacySettings.excludePersonalInfo) {
    filteredMessages = filteredMessages.map(removePersonalInfo);
  }
  
  if (privacySettings.excludeCodeSnippets) {
    filteredMessages = filteredMessages.map(removeCodeSnippets);
  }
  
  return filteredMessages;
};

// Remove personally identifiable information
const removePersonalInfo = (message: any): any => {
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone number
  ];
  
  let content = message.content || '';
  
  piiPatterns.forEach(pattern => {
    content = content.replace(pattern, '[REDACTED]');
  });
  
  return { ...message, content };
};

// Remove code snippets if requested
const removeCodeSnippets = (message: any): any => {
  let content = message.content || '';
  
  // Remove code blocks
  content = content.replace(/```[\s\S]*?```/g, '[CODE_BLOCK_REMOVED]');
  
  // Remove inline code
  content = content.replace(/`[^`]+`/g, '[CODE_REMOVED]');
  
  return { ...message, content };
};
```

#### 2. Server-Specific Privacy Controls

```typescript
// Privacy controls per server type
const getServerPrivacyLevel = (server: McpServerConfig): PrivacyLevel => {
  switch (server.type) {
    case 'docker':
      // GitHub servers may access repository content
      return {
        level: 'medium',
        dataTypes: ['code', 'issues', 'pull_requests'],
        recommendations: [
          'Use read-only tokens when possible',
          'Limit toolsets to required functionality',
          'Regularly audit repository access'
        ]
      };
      
    case 'query_api':
      // Database servers may access sensitive data
      return {
        level: 'high',
        dataTypes: ['database_content', 'user_data', 'business_data'],
        recommendations: [
          'Use service accounts with minimal permissions',
          'Enable row-level security where possible',
          'Audit database queries regularly'
        ]
      };
      
    case 'remote_pipedream':
      // External services may access various data types
      return {
        level: 'medium',
        dataTypes: ['emails', 'calendar', 'contacts', 'messages'],
        recommendations: [
          'Review OAuth scopes carefully',
          'Use application-specific permissions',
          'Monitor third-party access regularly'
        ]
      };
      
    default:
      return {
        level: 'unknown',
        dataTypes: [],
        recommendations: ['Review privacy implications before use']
      };
  }
};
```

## Security Monitoring and Auditing

### Comprehensive Logging System

```typescript
// Security event logging with risk classification
interface SecurityEvent {
  type: SecurityEventType;
  serverId?: string;
  userId?: string;
  timestamp: Date;
  details: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high';
  ip_address?: string;
  user_agent?: string;
}

type SecurityEventType = 
  | 'auth_success' 
  | 'auth_failure' 
  | 'token_created' 
  | 'token_revoked' 
  | 'config_changed'
  | 'tool_executed'
  | 'tool_approved'
  | 'tool_declined'
  | 'server_enabled'
  | 'server_disabled'
  | 'security_violation';

const securityLogger = {
  log: (event: SecurityEvent) => {
    // Validate event structure
    if (!event.type || !event.timestamp || !event.risk_level) {
      console.error('Invalid security event structure');
      return;
    }
    
    // Add runtime context
    const enrichedEvent = {
      ...event,
      session_id: getSessionId(),
      ip_address: event.ip_address || getClientIP(),
      user_agent: event.user_agent || navigator.userAgent
    };
    
    // Local development logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Security Event]', enrichedEvent);
    }
    
    // Production logging (implement based on your infrastructure)
    if (process.env.NODE_ENV === 'production') {
      sendToSecurityLog(enrichedEvent);
    }
    
    // Store in local audit trail
    addToAuditTrail(enrichedEvent);
    
    // Trigger alerts for high-risk events
    if (event.risk_level === 'high') {
      triggerSecurityAlert(enrichedEvent);
    }
  },
  
  query: (filters: SecurityEventFilters): SecurityEvent[] => {
    return getAuditTrail().filter(event => {
      if (filters.type && event.type !== filters.type) return false;
      if (filters.serverId && event.serverId !== filters.serverId) return false;
      if (filters.riskLevel && event.risk_level !== filters.riskLevel) return false;
      if (filters.startDate && event.timestamp < filters.startDate) return false;
      if (filters.endDate && event.timestamp > filters.endDate) return false;
      return true;
    });
  }
};
```

### Automated Security Monitoring

```typescript
// Real-time security monitoring
const securityMonitor = {
  // Check for suspicious patterns
  detectAnomalies: (): SecurityAlert[] => {
    const alerts: SecurityAlert[] = [];
    const events = securityLogger.query({ startDate: new Date(Date.now() - 3600000) }); // Last hour
    
    // Rapid configuration changes
    const configChanges = events.filter(e => e.type === 'config_changed');
    if (configChanges.length > 10) {
      alerts.push({
        type: 'rapid_config_changes',
        severity: 'medium',
        message: `${configChanges.length} configuration changes in the last hour`,
        events: configChanges
      });
    }
    
    // Authentication failures
    const authFailures = events.filter(e => e.type === 'auth_failure');
    if (authFailures.length > 5) {
      alerts.push({
        type: 'auth_failure_spike',
        severity: 'high',
        message: `${authFailures.length} authentication failures detected`,
        events: authFailures
      });
    }
    
    // High-risk tool executions
    const highRiskTools = events.filter(e => 
      e.type === 'tool_executed' && e.risk_level === 'high'
    );
    if (highRiskTools.length > 3) {
      alerts.push({
        type: 'high_risk_activity',
        severity: 'high',
        message: `${highRiskTools.length} high-risk tool executions`,
        events: highRiskTools
      });
    }
    
    return alerts;
  },
  
  // Scheduled security checks
  performSecurityAudit: (): SecurityAuditReport => {
    const timestamp = new Date();
    const checks: SecurityCheck[] = [];
    let overallStatus: 'pass' | 'warning' | 'fail' = 'pass';
    
    // Check enabled servers
    const enabledServers = getEnabledServers();
    
    for (const server of enabledServers) {
      // Token security check
      const tokenValidation = validateTokenSecurity(server);
      if (!tokenValidation.secure) {
        checks.push({
          name: `Token Security - ${server.name}`,
          status: 'fail',
          details: tokenValidation.issues.join(', ')
        });
        overallStatus = 'fail';
      }
      
      // Configuration security check
      if (server.skip_approval) {
        checks.push({
          name: `Approval Settings - ${server.name}`,
          status: 'warning',
          details: 'Approval bypass is enabled'
        });
        if (overallStatus === 'pass') overallStatus = 'warning';
      }
      
      // Permission level check
      const privacyLevel = getServerPrivacyLevel(server);
      if (privacyLevel.level === 'high') {
        checks.push({
          name: `Privacy Risk - ${server.name}`,
          status: 'warning',
          details: `High privacy risk server enabled (${privacyLevel.dataTypes.join(', ')})`
        });
        if (overallStatus === 'pass') overallStatus = 'warning';
      }
    }
    
    // Check for outdated configurations
    const configAge = getConfigurationAge();
    if (configAge > 90) {
      checks.push({
        name: 'Configuration Age',
        status: 'warning',
        details: `Configuration last updated ${configAge} days ago`
      });
      if (overallStatus === 'pass') overallStatus = 'warning';
    }
    
    return {
      timestamp,
      overall_status: overallStatus,
      checks,
      recommendations: generateSecurityRecommendations(checks)
    };
  }
};
```

## Incident Response Guidelines

### Security Incident Response Plan

#### Incident Classification and Response

```typescript
// Automated incident response system
interface SecurityIncident {
  id: string;
  type: IncidentType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedServers: string[];
  detectedAt: Date;
  status: 'detected' | 'investigating' | 'contained' | 'resolved';
}

type IncidentType = 
  | 'credential_compromise'
  | 'unauthorized_access'
  | 'data_exfiltration'
  | 'configuration_tampering'
  | 'malicious_tool_execution';

const incidentResponse = {
  // Immediate containment for critical incidents
  emergencyResponse: async (incident: SecurityIncident) => {
    if (incident.severity === 'critical') {
      // Immediate containment
      for (const serverId of incident.affectedServers) {
        // Disable server
        await updateMcpServer(serverId, { enabled: false });
        
        // Clear authentication
        await updateMcpServer(serverId, { 
          auth_config: {} as McpAuthConfig 
        });
        
        // Log containment action
        securityLogger.log({
          type: 'server_disabled',
          serverId,
          details: { reason: 'security_incident', incidentId: incident.id },
          timestamp: new Date(),
          risk_level: 'high'
        });
      }
      
      // Notify user immediately
      showCriticalSecurityAlert({
        title: 'Critical Security Incident',
        message: 'MCP servers have been automatically disabled due to a security incident.',
        incidentId: incident.id,
        actions: ['View Details', 'Contact Support']
      });
    }
  },
  
  // Investigation procedures
  investigate: (incident: SecurityIncident): InvestigationReport => {
    const startTime = new Date(incident.detectedAt.getTime() - 3600000); // 1 hour before
    const endTime = new Date();
    
    // Gather relevant security events
    const events = securityLogger.query({
      startDate: startTime,
      endDate: endTime
    });
    
    // Filter events related to affected servers
    const relevantEvents = events.filter(event =>
      !event.serverId || incident.affectedServers.includes(event.serverId)
    );
    
    // Analyze event patterns
    const analysis = analyzeEventPatterns(relevantEvents);
    
    return {
      incident_id: incident.id,
      investigation_started: new Date(),
      timeline: buildEventTimeline(relevantEvents),
      affected_systems: incident.affectedServers,
      root_cause_analysis: analysis.rootCause,
      impact_assessment: analysis.impact,
      evidence: relevantEvents,
      recommendations: generateIncidentRecommendations(analysis)
    };
  },
  
  // Recovery procedures
  recover: async (incidentId: string): Promise<RecoveryPlan> => {
    const incident = getIncidentById(incidentId);
    const investigation = getInvestigationReport(incidentId);
    
    const recoverySteps: RecoveryStep[] = [];
    
    // Security validation before recovery
    const securityAudit = securityMonitor.performSecurityAudit();
    if (securityAudit.overall_status === 'fail') {
      return {
        status: 'blocked',
        message: 'Security audit must pass before recovery can proceed',
        required_actions: securityAudit.checks
          .filter(check => check.status === 'fail')
          .map(check => check.name)
      };
    }
    
    // Generate recovery steps based on incident type
    switch (incident.type) {
      case 'credential_compromise':
        recoverySteps.push(
          {
            step: 'Revoke compromised credentials on external services',
            priority: 'critical',
            manual: true
          },
          {
            step: 'Generate new authentication credentials',
            priority: 'critical',
            manual: true
          },
          {
            step: 'Update server configurations with new credentials',
            priority: 'high',
            manual: false
          }
        );
        break;
        
      case 'unauthorized_access':
        recoverySteps.push(
          {
            step: 'Review and update access controls',
            priority: 'high',
            manual: true
          },
          {
            step: 'Enable enhanced monitoring',
            priority: 'medium',
            manual: false
          }
        );
        break;
    }
    
    return {
      status: 'ready',
      estimated_duration: '30-60 minutes',
      recovery_steps: recoverySteps,
      rollback_plan: generateRollbackPlan(incident)
    };
  }
};
```

This comprehensive security guide provides detailed considerations and implementation patterns for maintaining security across all aspects of the MCP multi-server system. Regular review and updates of these security measures are essential as threats evolve and the system grows.