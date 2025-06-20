import { NextRequest } from "next/server";
import OpenAI from "openai";
import { DEVELOPER_PROMPT } from "@/config/constants";
import { getOriginalMcpConfiguration } from "@/config/mcp-server-integration";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Convert MCP server configuration to Responses API MCP tools format
function getMcpServerTools() {
  const mcpConfig = getOriginalMcpConfiguration();
  const tools: any[] = [];
  
  mcpConfig.forEach((config, index) => {
    if (config.type === "mcp" && config.allowed_tools) {
      // Validate required MCP tool parameters
      const missingParams = [];
      if (!config.server_url) missingParams.push('server_url');
      if (!config.server_label) missingParams.push('server_label');
      if (!config.allowed_tools || config.allowed_tools.length === 0) missingParams.push('allowed_tools');
      if (!config.require_approval) missingParams.push('require_approval');
      
      if (missingParams.length > 0) {
        console.error(`MCP tool at index ${index} missing required parameters:`, missingParams);
        console.error('Config:', JSON.stringify(config, null, 2));
        return; // Skip this tool
      }

      // Add MCP tool in the format expected by Responses API
      const mcpTool = {
        type: "mcp",
        server_label: config.server_label,
        server_url: config.server_url,
        allowed_tools: config.allowed_tools,
        require_approval: config.require_approval
      };
      
      console.log(`Adding MCP tool for ${config.server_label}:`, JSON.stringify(mcpTool, null, 2));
      tools.push(mcpTool);
    }
  });
  
  return tools;
}

// Convert chat messages to Responses API input format
function convertMessagesToInput(messages: any[]) {
  // Combine all messages into a single input string
  let combinedInput = "";
  
  messages.forEach(message => {
    if (message.role === "system") {
      combinedInput += `System: ${message.content}\n\n`;
    } else if (message.role === "user") {
      combinedInput += `User: ${message.content}\n\n`;
    } else if (message.role === "assistant") {
      combinedInput += `Assistant: ${message.content}\n\n`;
    }
  });
  
  return combinedInput.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { messages, tools = [] } = await request.json();
    console.log("Received messages:", messages);
    
    // Get MCP server tools
    const mcpTools = getMcpServerTools();
    const allTools = [...tools, ...mcpTools];
    
    console.log("=== TOOLS DEBUG ===");
    console.log("Regular tools count:", tools.length);
    console.log("MCP tools count:", mcpTools.length);
    console.log("Total tools count:", allTools.length);
    console.log("Regular tools:", JSON.stringify(tools, null, 2));
    console.log("MCP tools:", JSON.stringify(mcpTools, null, 2));
    console.log("All tools being sent to API:", JSON.stringify(allTools, null, 2));
    console.log("=== END TOOLS DEBUG ===");
    
    // Convert messages to Responses API input format
    const systemMessage = { role: "system", content: DEVELOPER_PROMPT };
    const allMessages = [systemMessage, ...messages];
    const input = convertMessagesToInput(allMessages);
    
    // Create streaming response using Responses API
    const stream = await openai.responses.create({
      model: 'gpt-4o',
      input: input,
      tools: allTools.length > 0 ? allTools : undefined,
      store: true,
      stream: true,
    });

    // Create ReadableStream for SSE response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            console.log("Stream event:", event.type, event);
            
            // Handle events generically and extract relevant data
            const eventData: any = event;
            
            // Handle output item events
            if (event.type === 'response.output_item.added') {
              const sseEvent = `data: ${JSON.stringify({
                event: 'response.output_item.added',
                data: eventData
              })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }
            
            else if (event.type === 'response.output_item.done') {
              const sseEvent = `data: ${JSON.stringify({
                event: 'response.output_item.done',
                data: {
                  finish_reason: 'stop'
                }
              })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }
            
            // Handle content part events
            else if (event.type === 'response.content_part.added') {
              const sseEvent = `data: ${JSON.stringify({
                event: 'response.content_part.added',
                data: eventData
              })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }
            
            else if (event.type === 'response.content_part.done') {
              const sseEvent = `data: ${JSON.stringify({
                event: 'response.content_part.done',
                data: eventData
              })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }
            
            // Handle reasoning events (if available)
            else if (event.type.startsWith('response.reasoning')) {
              const sseEvent = `data: ${JSON.stringify({
                event: event.type,
                data: eventData
              })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }
            
            // Handle function call events
            else if (event.type.startsWith('response.function_call')) {
              const sseEvent = `data: ${JSON.stringify({
                event: 'response.tool_calls.delta',
                data: {
                  tool_calls: eventData
                }
              })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }
            
            // Handle completion events
            else if (event.type === 'response.completed') {
              const sseEvent = `data: ${JSON.stringify({
                event: 'response.completed',
                data: {
                  usage: eventData.usage || {}
                }
              })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }
            
            // Handle failure events
            else if (event.type === 'response.failed') {
              const sseEvent = `data: ${JSON.stringify({
                event: 'error',
                data: { 
                  error: 'Response failed', 
                  details: eventData.error?.message || 'Unknown error' 
                }
              })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }
            
            // Handle any text-related events that contain deltas
            else if (eventData.delta || eventData.text) {
              const sseEvent = `data: ${JSON.stringify({
                event: 'response.output_text.delta',
                data: {
                  delta: eventData.delta || eventData.text || '',
                  item_id: `msg_${Date.now()}`
                }
              })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }
            
            // Handle any other event types generically
            else {
              const sseEvent = `data: ${JSON.stringify({
                event: event.type,
                data: eventData
              })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }
          }
          
          // Send final completion marker
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
          
        } catch (error) {
          console.error("Streaming error:", error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorEvent = `data: ${JSON.stringify({
            event: 'error',
            data: { error: 'Streaming failed', details: errorMessage }
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error("Error in turn_response:", error);
    
    // Return error as SSE format to match frontend expectations
    const encoder = new TextEncoder();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStream = new ReadableStream({
      start(controller) {
        const errorEvent = `data: ${JSON.stringify({
          event: 'error',
          data: { error: 'Internal server error', details: errorMessage }
        })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });

    return new Response(errorStream, {
      status: 500,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
