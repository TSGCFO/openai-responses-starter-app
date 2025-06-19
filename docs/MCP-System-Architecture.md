# MCP System Technical Architecture

## Overview

This document provides a comprehensive technical architecture overview of the Model Context Protocol (MCP) integration system. The application serves as an **MCP client** that connects to external MCP servers to extend the assistant's capabilities with remote tools and resources.

## System Architecture

### High-Level Architecture

The MCP system is built as a unified tool framework that seamlessly integrates MCP capabilities alongside other tool types:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Tools Panel  │  Chat Interface  │  MCP Components         │
│  • MCP Config │  • Message Flow  │  • Approval UI          │
│  • Settings   │  • Tool Calls    │  • Tools List          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  State Management Layer                     │
├─────────────────────────────────────────────────────────────┤
│  useToolsStore          │    useConversationStore          │
│  • MCP Configuration   │    • Chat Messages                │
│  • Tool Settings       │    • Conversation History        │
│  • Approval Settings   │    • Loading States               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Assistant Processing  │  Tool Management │  Event Handler │
│  • Message Processing  │  • Tool Builder  │  • Stream Proc │
│  • Event Handling      │  • MCP Integration│  • State Updates│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
├─────────────────────────────────────────────────────────────┤
│           OpenAI Responses API                              │
│           • Stream Processing                               │
│           • Tool Execution                                  │
│           • MCP Server Communication                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   External Systems                          │
├─────────────────────────────────────────────────────────────┤
│  MCP Servers  │  Web Search  │  File Search │ Code Interpreter│
│  • Remote     │  • External  │  • Vector    │  • Python       │
│  • Tools      │  • APIs      │  • Stores    │  • Execution    │
└─────────────────────────────────────────────────────────────┘
```

### Core Design Principles

1. **Unified Tool Framework**: MCP tools are treated as first-class citizens alongside built-in tools
2. **Client-Side Integration**: Application acts as MCP client, not server
3. **Stream-First Architecture**: Real-time processing of tool calls and responses
4. **Modular Component Design**: Separation of concerns between UI, state, and business logic
5. **Event-Driven Processing**: Reactive updates based on streaming events

## Data Flow Architecture

### User Interaction Flow

```
User Input → Configuration → Tool Selection → Execution → Results Display

1. User configures MCP server settings
   ├── Server URL, label, allowed tools
   ├── Approval preferences  
   └── Stored in useToolsStore

2. User sends chat message
   ├── Message added to conversation store
   ├── Triggers processMessages()
   └── Assistant loading state activated

3. Tool configuration built
   ├── MCP config retrieved from store
   ├── Combined with other enabled tools
   └── Sent to OpenAI API

4. Streaming response processing
   ├── Events received from OpenAI
   ├── Real-time UI updates
   └── State synchronization

5. Tool execution handling
   ├── MCP calls processed
   ├── Approval workflow (if required)
   └── Results streamed back
```

### MCP-Specific Data Flow

```
Configuration Flow:
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ MCP Config  │───▶│ useToolsStore│───▶│ Tool Builder│
│ Component   │    │ (Persistent) │    │ (getTools)  │
└─────────────┘    └──────────────┘    └─────────────┘

Execution Flow:
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ User Message│───▶│ OpenAI API   │───▶│ Event Stream│
└─────────────┘    └──────────────┘    └─────────────┘
                                               │
                   ┌─────────────┐            │
                   │ MCP Tool    │◄───────────┘
                   │ Execution   │
                   └─────────────┘
                           │
                   ┌─────────────┐
                   │ Approval    │
                   │ Workflow    │
                   └─────────────┘
                           │
                   ┌─────────────┐
                   │ Results     │
                   │ Display     │
                   └─────────────┘
```

### State Management Flow

The system uses two primary Zustand stores:

**useToolsStore**: Manages tool configurations

- MCP server settings (URL, label, allowed tools)
- Approval preferences (skip_approval flag)
- Other tool enable/disable states
- Persistent storage for user preferences

**useConversationStore**: Manages chat state

- Chat messages (display layer)
- Conversation items (API layer)
- Loading states
- Real-time message updates

## Component Relationship Architecture

### MCP Component Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                    tools-panel.tsx                          │
│                 (Configuration Hub)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ PanelConfig │  │ MCP Config  │  │ Other Tools │        │
│  │ (Wrapper)   │  │ Component   │  │ Configs     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      chat.tsx                               │
│                  (Message Display)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ MCP Tools   │  │ MCP Approval│  │ Tool Call   │        │
│  │ List        │  │ Component   │  │ Component   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   assistant.tsx                             │
│                 (Orchestration)                             │
├─────────────────────────────────────────────────────────────┤
│  • Message handling                                         │
│  • Approval response coordination                           │
│  • State management integration                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**mcp-config.tsx**:

- Renders configuration form for MCP server settings
- Handles user input for server URL, label, allowed tools
- Manages approval skip preference
- Integrates with useToolsStore for persistence

**mcp-approval.tsx**:

- Displays approval requests for MCP tool execution
- Provides approve/decline buttons
- Handles user approval decisions
- Communicates back to assistant through callback

**mcp-tools-list.tsx**:

- Displays available tools from MCP server
- Shows tool names and descriptions
- Expandable descriptions for better UX
- Read-only display component

**assistant.tsx**:

- Orchestrates message flow and approval responses
- Bridges UI events with business logic
- Manages conversation state transitions
- Handles error scenarios

## Technical Design Patterns

### 1. Observer Pattern (Event Streaming)

The system implements real-time event processing through OpenAI's streaming API:

```typescript
// Event handlers in assistant.ts
switch (event) {
  case "response.mcp_call_arguments.delta":
    // Real-time argument streaming
  case "response.mcp_call_arguments.done":
    // Final arguments processing
  case "response.completed":
    // Handle completion events
}
```

### 2. Strategy Pattern (Tool Type Handling)

Different tool types are handled uniformly through a common interface:

```typescript
// tools.ts - Unified tool building
if (mcpEnabled && mcpConfig.server_url) {
  const mcpTool = {
    type: "mcp",
    server_label: mcpConfig.server_label,
    server_url: mcpConfig.server_url,
    // ... additional config
  };
  tools.push(mcpTool);
}
```

### 3. Command Pattern (Tool Execution)

Tool execution follows a command pattern with consistent interfaces:

```typescript
// Different execution paths based on tool type
switch (toolCallMessage.tool_type) {
  case "function_call":
    await handleTool(name, arguments);
  case "mcp_call":
    // Handled by OpenAI/MCP server
  case "web_search_call":
    // External service call
}
```

### 4. Facade Pattern (API Abstraction)

Complex OpenAI streaming API is abstracted through clean interfaces:

```typescript
// assistant.ts - Clean abstraction
export const processMessages = async () => {
  const tools = getTools();
  await handleTurn(conversationItems, tools, eventHandler);
};
```

### 5. State Pattern (UI States)

Tool execution states are managed consistently:

```typescript
// Tool call states
status: "in_progress" | "completed" | "failed" | "searching"
```

## Integration Architecture

### MCP Integration Points

**1. Configuration Layer**:

- MCP settings integrated into unified tools panel
- Persistent storage using Zustand middleware
- Real-time configuration updates

**2. Tool Building Layer**:

- MCP tools included in unified tool list
- Conditional inclusion based on configuration
- OpenAI API compatibility

**3. Execution Layer**:

- MCP calls processed through OpenAI Responses API
- Approval workflow integration
- Result streaming and display

**4. UI Layer**:

- MCP-specific components for different interaction types
- Consistent styling with other tool types
- Real-time updates and state synchronization

### External System Integration

**OpenAI Responses API**:

- Primary integration point for MCP functionality
- Handles MCP server communication
- Provides streaming events for real-time updates

**MCP Servers**:

- External services providing tools and resources
- Configured through application UI
- Authentication and connection managed by OpenAI

## Security and Approval Architecture

### Approval Workflow

```
MCP Tool Call → Approval Check → User Decision → Execution/Cancellation

1. Tool call initiated by assistant
   ├── MCP server and tool identified
   └── Approval requirement checked

2. Approval UI displayed (if required)
   ├── Tool name and server shown
   ├── User presented with approve/decline
   └── Decision recorded

3. Response processed
   ├── Approval: Tool execution continues
   └── Decline: Tool execution cancelled

4. Results handled
   ├── Success: Results displayed
   └── Failure: Error handling
```

### Security Considerations

**Configuration Security**:

- MCP server URLs validated
- Allowed tools list enforced
- Approval settings respected

**Runtime Security**:

- Tool execution approval workflow
- User consent for external calls
- Error handling for failed connections

**Data Privacy**:

- User data only sent to configured servers
- Conversation context controlled
- No sensitive data exposure

## Performance and Scalability

### Stream Processing Optimization

**Real-time Updates**:

- Efficient event processing
- Minimal UI re-renders
- Optimized state updates

**Memory Management**:

- Conversation history management
- State cleanup for completed tools
- Efficient component re-rendering

### Error Handling Strategy

**Network Resilience**:

- Stream connection error handling
- MCP server timeout management
- Graceful degradation

**User Experience**:

- Clear error messaging
- Retry mechanisms
- Fallback options

## Conclusion

The MCP system architecture demonstrates a well-designed integration that:

1. **Seamlessly extends** the assistant's capabilities through external MCP servers
2. **Maintains consistency** with other tool types in the unified framework
3. **Provides real-time** interaction through streaming architecture
4. **Ensures security** through approval workflows and user control
5. **Delivers excellent UX** through modular, responsive components

The architecture successfully balances complexity with usability, creating a robust foundation for MCP integration that can scale with additional features and requirements.
