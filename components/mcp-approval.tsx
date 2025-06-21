"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { McpApprovalRequestItem } from "@/lib/assistant";
import useToolsStore from "@/stores/useToolsStore";

interface Props {
  item: McpApprovalRequestItem;
  onRespond: (approve: boolean, id: string) => void;
}

export default function McpApproval({ item, onRespond }: Props) {
  const [disabled, setDisabled] = useState(false);
  const { mcpServers } = useToolsStore();

  const handle = (approve: boolean) => {
    setDisabled(true);
    onRespond(approve, item.id);
  };

  // Find the server configuration to display more detailed information
  const serverConfig = mcpServers.find(server => server.name === item.server_label);
  const serverType = serverConfig?.type || 'unknown';
  const serverDescription = serverConfig?.description || '';

  const getServerTypeIcon = (type: string) => {
    switch (type) {
      case 'docker':
        return '🐳';
      case 'query_api':
        return '🗄️';
      case 'remote_pipedream':
        return '🔌';
      default:
        return '⚙️';
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex">
        <div className="mr-4 rounded-[16px] p-4 md:mr-24 text-black bg-gray-100 font-light">
          <div className="mb-2 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span>{getServerTypeIcon(serverType)}</span>
              <span>Request to execute tool{" "}
                <span className="font-medium">{item.name}</span> on server{" "}
                <span className="font-medium">{item.server_label}</span>
              </span>
            </div>
            {serverDescription && (
              <div className="text-xs text-gray-600 mb-2">
                {serverDescription}
              </div>
            )}
            {serverConfig && (
              <div className="text-xs text-gray-500">
                Type: {serverType}
                {serverConfig.type === 'docker' && serverConfig.docker_image && (
                  <span> • Image: {serverConfig.docker_image}</span>
                )}
                {serverConfig.type === 'remote_pipedream' && serverConfig.app_slug && (
                  <span> • App: {serverConfig.app_slug}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={disabled} onClick={() => handle(true)}>
              Approve
            </Button>
            <Button
              size="sm"
              disabled={disabled}
              onClick={() => handle(false)}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-800"
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
