import { NextRequest } from "next/server";
import OpenAI from "openai";
import { DEVELOPER_PROMPT } from "@/config/constants";
import { getOriginalMcpConfiguration } from "@/config/mcp-server-integration";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Convert MCP server configuration to OpenAI tools format
function getMcpServerTools() {
  const mcpConfig = getOriginalMcpConfiguration();
  const tools: any[] = [];
  
  mcpConfig.forEach(config => {
    if (config.type === "mcp" && config.allowed_tools) {
      config.allowed_tools.forEach(toolName => {
        if (toolName === "resolve-library-id") {
          tools.push({
            type: "function",
            name: "resolve_library_id",
            description: "Resolves a package/product name to a Context7-compatible library ID",
            parameters: {
              type: "object",
              properties: {
                libraryName: {
                  type: "string",
                  description: "Library name to search for and retrieve a Context7-compatible library ID"
                }
              },
              required: ["libraryName"]
            }
          });
        } else if (toolName === "get-library-docs") {
          tools.push({
            type: "function",
            name: "get_library_docs",
            description: "Fetches up-to-date documentation for a library using Context7-compatible library ID",
            parameters: {
              type: "object",
              properties: {
                context7CompatibleLibraryID: {
                  type: "string",
                  description: "Exact Context7-compatible library ID (e.g., '/mongodb/docs', '/vercel/next.js')"
                },
                topic: {
                  type: "string",
                  description: "Topic to focus documentation on (e.g., 'hooks', 'routing')"
                },
                tokens: {
                  type: "number",
                  description: "Maximum number of tokens of documentation to retrieve (default: 10000)"
                }
              },
              required: ["context7CompatibleLibraryID"]
            }
          });
        }
      });
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
    
    console.log("Available tools:", allTools.length, "tools");
    
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
