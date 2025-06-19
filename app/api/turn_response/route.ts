import { MODEL } from "@/config/constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";

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
          const invalidIds = tool.vector_store_ids.filter(id => id == null || id === "");
          if (invalidIds.length > 0) {
            console.error(`Invalid vector store IDs found in tool[${index}]:`, invalidIds);
            throw new Error(`Invalid vector store IDs in tool[${index}]: expected strings, got null/undefined/empty values`);
          }
        }
      });
    }

    const openai = new OpenAI();

    const events = await openai.responses.create({
      model: MODEL,
      input: messages,
      tools,
      stream: true,
      parallel_tool_calls: false,
    });

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // Sending all events to the client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            });
            controller.enqueue(`data: ${data}\n\n`);
          }
          // End of stream
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
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
