"use client";
import React from "react";
import useToolsStore from "@/stores/useToolsStore";
import { getEnabledServers } from "@/config/mcp-servers";

export default function McpToolsList() {
  const { mcpServers, mcpEnabled, mcpConfig } = useToolsStore();
  
  const enabledServers = getEnabledServers(mcpServers);
  const hasLegacyServer = mcpEnabled && mcpConfig.server_url && mcpConfig.server_label;
  
  if (enabledServers.length === 0 && !hasLegacyServer) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-sm mb-2">No MCP servers enabled</div>
        <div className="text-xs">Enable servers in the MCP configuration panel</div>
      </div>
    );
  }

  const getServerTypeInfo = (type: string) => {
    switch (type) {
      case 'docker':
        return { icon: '🐳', label: 'Docker', color: 'bg-blue-100 text-blue-800' };
      case 'query_api':
        return { icon: '🗄️', label: 'Query API', color: 'bg-green-100 text-green-800' };
      case 'remote_pipedream':
        return { icon: '🔌', label: 'Pipedream', color: 'bg-purple-100 text-purple-800' };
      default:
        return { icon: '⚙️', label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getToolsInfo = (server: any) => {
    const allowedTools = server.allowed_tools?.trim();
    if (allowedTools) {
      const tools = allowedTools.split(',').map((t: string) => t.trim()).filter((t: string) => t);
      return tools.length > 0 ? tools : ['All tools'];
    }
    return ['All tools'];
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 mb-3">
        Active MCP Servers ({enabledServers.length + (hasLegacyServer ? 1 : 0)})
      </div>

      {/* Legacy server display */}
      {hasLegacyServer && (
        <div className="border rounded-lg p-3 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <div>
                <div className="font-medium text-sm">{mcpConfig.server_label}</div>
                <div className="text-xs text-gray-600">Legacy Configuration</div>
              </div>
            </div>
            <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
              Legacy
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <div>URL: {mcpConfig.server_url}</div>
            <div>Tools: {getToolsInfo(mcpConfig).join(', ')}</div>
            <div>Approval: {mcpConfig.skip_approval ? 'Disabled' : 'Required'}</div>
          </div>
        </div>
      )}

      {/* Multi-server display */}
      {enabledServers.map(server => {
        const typeInfo = getServerTypeInfo(server.type);
        const tools = getToolsInfo(server);
        
        return (
          <div key={server.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeInfo.icon}</span>
                <div>
                  <div className="font-medium text-sm">{server.name}</div>
                  <div className="text-xs text-gray-600">{server.description}</div>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${typeInfo.color}`}>
                {typeInfo.label}
              </div>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              {server.type === 'docker' && server.docker_image && (
                <div>Image: {server.docker_image}</div>
              )}
              {server.type === 'query_api' && server.server_url && (
                <div>URL: {server.server_url}</div>
              )}
              {server.type === 'remote_pipedream' && (
                <div>
                  URL: {server.server_url}
                  {server.app_slug && <span> • App: {server.app_slug}</span>}
                </div>
              )}
              <div>Tools: {tools.join(', ')}</div>
              <div>Approval: {server.skip_approval ? 'Disabled' : 'Required'}</div>
              
              {/* Authentication status */}
              <div className="flex items-center gap-1 mt-1">
                <span>Auth:</span>
                {server.type === 'docker' && (
                  <span className={server.auth_config.github_token ? 'text-green-600' : 'text-red-600'}>
                    {server.auth_config.github_token ? '✓ Token Set' : '✗ Token Missing'}
                  </span>
                )}
                {server.type === 'query_api' && (
                  <span className={server.auth_config.query_api_key ? 'text-green-600' : 'text-red-600'}>
                    {server.auth_config.query_api_key ? '✓ API Key Set' : '✗ API Key Missing'}
                  </span>
                )}
                {server.type === 'remote_pipedream' && (
                  <span className={server.auth_config.pipedream_api_key ? 'text-green-600' : 'text-orange-600'}>
                    {server.auth_config.pipedream_api_key ? '✓ API Key Set' : '○ Optional'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {enabledServers.length > 0 && (
        <div className="text-xs text-gray-500 pt-2 border-t">
          <div>💡 Tips:</div>
          <div>• Docker servers run in isolated containers</div>
          <div>• Query API servers connect directly to databases</div>
          <div>• Pipedream servers provide cloud-based integrations</div>
        </div>
      )}
    </div>
  );
}
