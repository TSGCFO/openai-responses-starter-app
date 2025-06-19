import { toolsList } from "../../config/tools-list";
import useToolsStore from "@/stores/useToolsStore";
import { WebSearchConfig } from "@/stores/useToolsStore";
import { getEnabledServers } from "@/config/mcp-servers";

interface WebSearchTool extends WebSearchConfig {
  type: "web_search";
}
export const getTools = () => {
  const {
    webSearchEnabled,
    fileSearchEnabled,
    functionsEnabled,
    codeInterpreterEnabled,
    vectorStore,
    webSearchConfig,
    mcpEnabled,
    mcpConfig,
    mcpServers,
  } = useToolsStore.getState();

  const tools = [];

  if (webSearchEnabled) {
    const webSearchTool: WebSearchTool = {
      type: "web_search",
    };
    if (
      webSearchConfig.user_location &&
      (webSearchConfig.user_location.country !== "" ||
        webSearchConfig.user_location.region !== "" ||
        webSearchConfig.user_location.city !== "")
    ) {
      webSearchTool.user_location = webSearchConfig.user_location;
    }

    tools.push(webSearchTool);
  }

  if (fileSearchEnabled) {
    // Filter out null/undefined vector store IDs to prevent OpenAI API errors
    const validVectorStoreIds = vectorStore?.id ? [vectorStore.id] : [];
    
    if (validVectorStoreIds.length > 0) {
      const fileSearchTool = {
        type: "file_search",
        vector_store_ids: validVectorStoreIds,
      };
      tools.push(fileSearchTool);
      console.log("Added file search tool with vector store IDs:", validVectorStoreIds);
    } else {
      console.warn("File search enabled but no valid vector store IDs found. Skipping file search tool.");
    }
  }

  if (codeInterpreterEnabled) {
    tools.push({ type: "code_interpreter", container: { type: "auto" } });
  }

  if (functionsEnabled) {
    tools.push(
      ...toolsList.map((tool) => {
        return {
          type: "function",
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object",
            properties: { ...tool.parameters },
            required: Object.keys(tool.parameters),
            additionalProperties: false,
          },
          strict: true,
        };
      })
    );
  }

  // Legacy single server support (backward compatibility)
  if (mcpEnabled && mcpConfig.server_url && mcpConfig.server_label) {
    const mcpTool: any = {
      type: "mcp",
      server_label: mcpConfig.server_label,
      server_url: mcpConfig.server_url,
    };
    if (mcpConfig.skip_approval) {
      mcpTool.require_approval = "never";
    }
    if (mcpConfig.allowed_tools.trim()) {
      mcpTool.allowed_tools = mcpConfig.allowed_tools
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    }
    tools.push(mcpTool);
  }

  // Multi-server MCP support
  const enabledServers = getEnabledServers(mcpServers);
  enabledServers.forEach(server => {
    const mcpTool: any = {
      type: "mcp",
      server_label: server.name,
    };

    // Configure based on server type
    if (server.type === 'docker') {
      mcpTool.docker_image = server.docker_image;
      if (server.auth_config.github_token) {
        mcpTool.env = {
          GITHUB_PERSONAL_ACCESS_TOKEN: server.auth_config.github_token,
          ...(server.auth_config.github_toolsets && { GITHUB_TOOLSETS: server.auth_config.github_toolsets }),
          ...(server.auth_config.github_read_only !== undefined && { GITHUB_READ_ONLY: server.auth_config.github_read_only.toString() }),
        };
      }
    } else if (server.type === 'query_api') {
      mcpTool.server_url = server.server_url;
      if (server.auth_config.query_api_key) {
        mcpTool.env = {
          QUERY_API_KEY: server.auth_config.query_api_key,
          ...(server.auth_config.supabase_url && { SUPABASE_URL: server.auth_config.supabase_url }),
          ...(server.auth_config.supabase_anon_key && { SUPABASE_ANON_KEY: server.auth_config.supabase_anon_key }),
          ...(server.auth_config.supabase_service_role_key && { SUPABASE_SERVICE_ROLE_KEY: server.auth_config.supabase_service_role_key }),
        };
      }
    } else if (server.type === 'remote_pipedream') {
      mcpTool.server_url = server.server_url;
      mcpTool.headers = {
        'X-App-Slug': server.app_slug,
        ...(server.auth_config.pipedream_api_key && { 'Authorization': `Bearer ${server.auth_config.pipedream_api_key}` }),
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

  console.log("Generated tools:", tools);
  console.log("Total tools count:", tools.length);

  return tools;
};
