import { MODEL, DEVELOPER_PROMPT } from "@/config/constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getOriginalMcpConfiguration } from "@/config/mcp-server-integration";


interface ResponsesAPIMessage {
  role: "system" | "user" | "assistant";
  content: Array<{ type: "input_text"; text: string }>;
}

// Get MCP server tools configuration from the integration config
function getMcpServerTools(): any[] {
  return getOriginalMcpConfiguration();
}

// Convert chat messages to Responses API input format
function convertMessagesToInput(messages: any[]): ResponsesAPIMessage[] {
  const input: ResponsesAPIMessage[] = [];
  
  // Add system prompt as first message
  input.push({
    role: "system",
    content: [{ type: "input_text", text: DEVELOPER_PROMPT }]
  });
  
  // Convert user/assistant messages
  messages.forEach((message) => {
    if (message.role === "user" || message.role === "assistant") {
      const textContent = typeof message.content === "string" ? message.content : JSON.stringify(message.content);
      input.push({
        role: message.role,
        content: [{ type: "input_text", text: textContent }]
      });
    }
  });
  
  return input;
}

export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json();
    console.log("Received messages:", messages);
    
    // Validate tools array to prevent OpenAI API errors
    if (tools && Array.isArray(tools)) {
      console.log("Tools array:", JSON.stringify(tools, null, 2));
      
      // Check for potential issues in tools array
      tools.forEach((tool, index) => {
        if (tool.type === "file_search" && tool.vector_store_ids) {
          const invalidIds = tool.vector_store_ids.filter((id: string | null | undefined) => id == null || id === "");
          if (invalidIds.length > 0) {
            console.error(`Invalid vector store IDs found in tool[${index}]:`, invalidIds);
            throw new Error(`Invalid vector store IDs in tool[${index}]: expected strings, got null/undefined/empty values`);
          }
        }
      });
    }

    const openai = new OpenAI();

    // Convert messages to Responses API input format
    const input = convertMessagesToInput(messages);
    
    // Combine existing tools with MCP server tools for full integration
    const mcpServerTools = getMcpServerTools();
    const allTools = [...(tools || []), ...mcpServerTools];
    
    console.log("Using Responses API with MCP server integration");
    console.log("Input format:", JSON.stringify(input, null, 2));
    console.log("Tools (including MCP servers):", JSON.stringify(allTools, null, 2));

    // Use OpenAI Responses API (required for MCP server support)
    const response = await openai.responses.create({
      model: "gpt-4.1", // Use gpt-4.1 as required by Responses API for MCP
      input: input,
      tools: allTools.length > 0 ? allTools : undefined,
      store: true, // Enable response storage for MCP servers
    });

    console.log("Received response from OpenAI Responses API:", response);

    // Handle the Responses API output structure
    let responseText = "";
    const toolCalls: any[] = [];
    
    if (response.output && Array.isArray(response.output)) {
      response.output.forEach((item: any) => {
        if (item.type === "message") {
          // Extract text from message content
          if (item.content && Array.isArray(item.content)) {
            item.content.forEach((contentItem: any) => {
              if (contentItem.type === "text") {
                responseText += contentItem.text;
              }
            });
          }
        } else if (item.type === "function_call") {
          toolCalls.push(item);
        }
      });
    } else if (response.output_text) {
      responseText = response.output_text;
    }

    // Convert to chat completion format for compatibility with existing frontend
    const chatResponse = {
      id: response.id || "resp_" + Date.now(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "gpt-4.1",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: responseText,
          tool_calls: toolCalls.length > 0 ? toolCalls.map(tc => ({
            id: tc.call_id || tc.id,
            type: tc.type,
            function: tc.type === "function_call" ? {
              name: tc.name,
              arguments: tc.arguments
            } : undefined,
            mcp: tc.type === "mcp" ? {
              server_label: tc.server_label,
              tool_name: tc.name,
              arguments: tc.arguments
            } : undefined
          })) : undefined
        },
        finish_reason: "stop"
      }],
      usage: response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };

    // Return the complete response with MCP server support
    return NextResponse.json(chatResponse);

  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
