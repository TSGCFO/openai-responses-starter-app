"use client";
import React, { useState } from "react";
import useToolsStore from "@/stores/useToolsStore";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import McpMultiConfig from "./mcp-multi-config";

export default function McpConfig() {
  const { mcpConfig, setMcpConfig } = useToolsStore();
  const [useMultiServer, setUseMultiServer] = useState(true);

  const handleClear = () => {
    setMcpConfig({
      server_label: "",
      server_url: "",
      allowed_tools: "",
      skip_approval: false,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-zinc-600 text-sm">MCP Configuration</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Multi-Server</span>
          <Switch
            checked={useMultiServer}
            onCheckedChange={setUseMultiServer}
          />
        </div>
      </div>

      {useMultiServer ? (
        <McpMultiConfig />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-zinc-600 text-sm">Legacy Server Configuration</div>
            <div
              className="text-zinc-400 text-sm px-1 transition-colors hover:text-zinc-600 cursor-pointer"
              onClick={handleClear}
            >
              Clear
            </div>
          </div>
          <div className="space-y-3 text-zinc-400">
            <div className="flex items-center gap-2">
              <label htmlFor="server_label" className="text-sm w-24">
                Label
              </label>
              <Input
                id="server_label"
                type="text"
                placeholder="deepwiki"
                className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                value={mcpConfig.server_label}
                onChange={(e) =>
                  setMcpConfig({ ...mcpConfig, server_label: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="server_url" className="text-sm w-24">
                URL
              </label>
              <Input
                id="server_url"
                type="text"
                placeholder="https://example.com/mcp"
                className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                value={mcpConfig.server_url}
                onChange={(e) =>
                  setMcpConfig({ ...mcpConfig, server_url: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="allowed_tools" className="text-sm w-24">
                Allowed
              </label>
              <Input
                id="allowed_tools"
                type="text"
                placeholder="tool1,tool2"
                className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
                value={mcpConfig.allowed_tools}
                onChange={(e) =>
                  setMcpConfig({ ...mcpConfig, allowed_tools: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="skip_approval" className="text-sm w-24">
                Skip approval
              </label>
              <Switch
                id="skip_approval"
                checked={mcpConfig.skip_approval}
                onCheckedChange={(checked) =>
                  setMcpConfig({ ...mcpConfig, skip_approval: checked })
                }
              />
            </div>
          </div>
        </div>
      )}

      {!useMultiServer && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            Switch to Multi-Server mode to use the default GitHub, Supabase, Outlook, Teams, and Gmail integrations.
          </div>
        </div>
      )}
    </div>
  );
}
