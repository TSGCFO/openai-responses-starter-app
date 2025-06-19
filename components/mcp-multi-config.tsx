"use client";
import React, { useState } from "react";
import useToolsStore from "@/stores/useToolsStore";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { McpServerConfig, validateServerConfig } from "@/config/mcp-servers";

interface ServerConfigProps {
  server: McpServerConfig;
  onUpdate: (serverId: string, updates: Partial<McpServerConfig>) => void;
  onToggle: (serverId: string) => void;
}

function ServerConfig({ server, onUpdate, onToggle }: ServerConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleUpdate = (field: string, value: any) => {
    const updates = { [field]: value };
    onUpdate(server.id, updates);
    
    // Validate after update
    const updatedServer = { ...server, ...updates };
    const validation = validateServerConfig(updatedServer);
    setErrors(validation.errors);
  };

  const handleAuthUpdate = (field: string, value: any) => {
    const authUpdates = { auth_config: { ...server.auth_config, [field]: value } };
    onUpdate(server.id, authUpdates);
  };

  const renderAuthFields = () => {
    switch (server.type) {
      case 'docker':
        return (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm w-32">GitHub Token</label>
              <Input
                type="password"
                placeholder="ghp_..."
                className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                value={server.auth_config.github_token || ''}
                onChange={(e) => handleAuthUpdate('github_token', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm w-32">Toolsets</label>
              <Input
                type="text"
                placeholder="issues,pulls,repos"
                className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                value={server.auth_config.github_toolsets || ''}
                onChange={(e) => handleAuthUpdate('github_toolsets', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm w-32">Read Only</label>
              <Switch
                checked={server.auth_config.github_read_only || false}
                onCheckedChange={(checked) => handleAuthUpdate('github_read_only', checked)}
              />
            </div>
          </>
        );
      
      case 'query_api':
        return (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm w-32">Query API Key</label>
              <Input
                type="password"
                placeholder="sk-..."
                className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                value={server.auth_config.query_api_key || ''}
                onChange={(e) => handleAuthUpdate('query_api_key', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm w-32">Supabase URL</label>
              <Input
                type="text"
                placeholder="https://xxx.supabase.co"
                className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                value={server.auth_config.supabase_url || ''}
                onChange={(e) => handleAuthUpdate('supabase_url', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm w-32">Anon Key</label>
              <Input
                type="password"
                placeholder="eyJ..."
                className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                value={server.auth_config.supabase_anon_key || ''}
                onChange={(e) => handleAuthUpdate('supabase_anon_key', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm w-32">Service Role Key</label>
              <Input
                type="password"
                placeholder="eyJ..."
                className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                value={server.auth_config.supabase_service_role_key || ''}
                onChange={(e) => handleAuthUpdate('supabase_service_role_key', e.target.value)}
              />
            </div>
          </>
        );
      
      case 'remote_pipedream':
        return (
          <div className="flex items-center gap-2">
            <label className="text-sm w-32">Pipedream API Key</label>
            <Input
              type="password"
              placeholder="pd_..."
              className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
              value={server.auth_config.pipedream_api_key || ''}
              onChange={(e) => handleAuthUpdate('pipedream_api_key', e.target.value)}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch
            checked={server.enabled}
            onCheckedChange={() => onToggle(server.id)}
          />
          <div>
            <div className="font-medium text-sm">{server.name}</div>
            <div className="text-xs text-zinc-500">{server.description}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Configure'}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <label className="text-sm w-32">Allowed Tools</label>
            <Input
              type="text"
              placeholder="tool1,tool2"
              className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
              value={server.allowed_tools}
              onChange={(e) => handleUpdate('allowed_tools', e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm w-32">Skip Approval</label>
            <Switch
              checked={server.skip_approval}
              onCheckedChange={(checked) => handleUpdate('skip_approval', checked)}
            />
          </div>

          {renderAuthFields()}

          {errors.length > 0 && (
            <div className="text-xs text-red-500 space-y-1">
              {errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function McpMultiConfig() {
  const { mcpServers, updateMcpServer, toggleMcpServer, resetMcpServers } = useToolsStore();

  const handleReset = () => {
    resetMcpServers();
  };

  const enabledCount = mcpServers.filter(server => server.enabled).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-zinc-600 text-sm">
          MCP Servers ({enabledCount} enabled)
        </div>
        <div
          className="text-zinc-400 text-sm px-1 transition-colors hover:text-zinc-600 cursor-pointer"
          onClick={handleReset}
        >
          Reset All
        </div>
      </div>

      <div className="space-y-3">
        {mcpServers.map(server => (
          <ServerConfig
            key={server.id}
            server={server}
            onUpdate={updateMcpServer}
            onToggle={toggleMcpServer}
          />
        ))}
      </div>

      <div className="text-xs text-zinc-500 space-y-1">
        <div>• GitHub: Requires Personal Access Token for repository management</div>
        <div>• Supabase: Query API Key required for database operations</div>
        <div>• Pipedream: Optional API key for enhanced functionality</div>
      </div>
    </div>
  );
}