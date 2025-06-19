import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultVectorStore } from "@/config/constants";
import { McpServerConfig, defaultMcpServers } from "@/config/mcp-servers";

type File = {
  id: string;
  name: string;
  content: string;
};

type VectorStore = {
  id: string;
  name: string;
  files?: File[];
};

export type WebSearchConfig = {
  user_location?: {
    type: "approximate";
    country?: string;
    city?: string;
    region?: string;
  };
};

// Legacy single server config for backward compatibility
export type McpConfig = {
  server_label: string;
  server_url: string;
  allowed_tools: string;
  skip_approval: boolean;
};

interface StoreState {
  fileSearchEnabled: boolean;
  //previousFileSearchEnabled: boolean;
  setFileSearchEnabled: (enabled: boolean) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  functionsEnabled: boolean;
  //previousFunctionsEnabled: boolean;
  setFunctionsEnabled: (enabled: boolean) => void;
  codeInterpreterEnabled: boolean;
  setCodeInterpreterEnabled: (enabled: boolean) => void;
  vectorStore: VectorStore | null;
  setVectorStore: (store: VectorStore) => void;
  webSearchConfig: WebSearchConfig;
  setWebSearchConfig: (config: WebSearchConfig) => void;
  
  // Legacy single server MCP config (maintained for backward compatibility)
  mcpEnabled: boolean;
  setMcpEnabled: (enabled: boolean) => void;
  mcpConfig: McpConfig;
  setMcpConfig: (config: McpConfig) => void;
  
  // New multi-server MCP config
  mcpServers: McpServerConfig[];
  setMcpServers: (servers: McpServerConfig[]) => void;
  updateMcpServer: (serverId: string, updates: Partial<McpServerConfig>) => void;
  toggleMcpServer: (serverId: string) => void;
  resetMcpServers: () => void;
}

const useToolsStore = create<StoreState>()(
  persist(
    (set) => ({
      vectorStore: defaultVectorStore.id !== "" ? defaultVectorStore : null,
      webSearchConfig: {
        user_location: {
          type: "approximate",
          country: "",
          city: "",
          region: "",
        },
      },
      mcpConfig: {
        server_label: "",
        server_url: "",
        allowed_tools: "",
        skip_approval: true,
      },
      mcpServers: defaultMcpServers,
      fileSearchEnabled: false,
      previousFileSearchEnabled: false,
      setFileSearchEnabled: (enabled) => {
        set({ fileSearchEnabled: enabled });
      },
      webSearchEnabled: false,
      setWebSearchEnabled: (enabled) => {
        set({ webSearchEnabled: enabled });
      },
      functionsEnabled: true,
      previousFunctionsEnabled: true,
      setFunctionsEnabled: (enabled) => {
        set({ functionsEnabled: enabled });
      },
      mcpEnabled: false,
      setMcpEnabled: (enabled) => {
        set({ mcpEnabled: enabled });
      },
      codeInterpreterEnabled: false,
      setCodeInterpreterEnabled: (enabled) => {
        set({ codeInterpreterEnabled: enabled });
      },
      setVectorStore: (store) => set({ vectorStore: store }),
      setWebSearchConfig: (config) => set({ webSearchConfig: config }),
      setMcpConfig: (config) => set({ mcpConfig: config }),
      setMcpServers: (servers) => set({ mcpServers: servers }),
      updateMcpServer: (serverId, updates) => set((state) => ({
        mcpServers: state.mcpServers.map(server =>
          server.id === serverId ? { ...server, ...updates } : server
        )
      })),
      toggleMcpServer: (serverId) => set((state) => ({
        mcpServers: state.mcpServers.map(server =>
          server.id === serverId ? { ...server, enabled: !server.enabled } : server
        )
      })),
      resetMcpServers: () => set({ mcpServers: defaultMcpServers }),
    }),
    {
      name: "tools-store",
    }
  )
);

export default useToolsStore;
