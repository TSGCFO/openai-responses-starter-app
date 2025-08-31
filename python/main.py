"""
Main FastAPI server for the Python OpenAI Responses starter app.
Converted from app/api/turn_response/route.ts
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
from dotenv import load_dotenv

from config.constants import DEVELOPER_PROMPT, MODEL
from config.mcp_server_integration import get_original_mcp_configuration
from functions.handlers import FUNCTIONS_MAP

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="OpenAI Responses Starter App", version="0.1.0")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class Message(BaseModel):
    role: str
    content: str

class TurnRequest(BaseModel):
    messages: List[Message]
    tools: Optional[List[Dict[str, Any]]] = []

def get_mcp_server_tools() -> List[Dict[str, Any]]:
    """
    Convert MCP server configuration to OpenAI tools format.
    Converted from getMcpServerTools() in route.ts
    """
    mcp_config = get_original_mcp_configuration()
    tools = []
    
    for config in mcp_config:
        if config.type == "mcp" and config.allowed_tools:
            for tool_name in config.allowed_tools:
                if tool_name == "resolve-library-id":
                    tools.append({
                        "type": "function",
                        "name": "resolve_library_id",
                        "description": "Resolves a package/product name to a Context7-compatible library ID",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "libraryName": {
                                    "type": "string",
                                    "description": "Library name to search for and retrieve a Context7-compatible library ID"
                                }
                            },
                            "required": ["libraryName"]
                        }
                    })
                elif tool_name == "get-library-docs":
                    tools.append({
                        "type": "function",
                        "name": "get_library_docs",
                        "description": "Fetches up-to-date documentation for a library using Context7-compatible library ID",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "context7CompatibleLibraryID": {
                                    "type": "string",
                                    "description": "Exact Context7-compatible library ID (e.g., '/mongodb/docs', '/vercel/next.js')"
                                },
                                "topic": {
                                    "type": "string",
                                    "description": "Topic to focus documentation on (e.g., 'hooks', 'routing')"
                                },
                                "tokens": {
                                    "type": "number",
                                    "description": "Maximum number of tokens of documentation to retrieve (default: 10000)"
                                }
                            },
                            "required": ["context7CompatibleLibraryID"]
                        }
                    })
    
    return tools

def convert_messages_to_input(messages: List[Message]) -> str:
    """
    Convert chat messages to Responses API input format.
    Converted from convertMessagesToInput() in route.ts
    """
    combined_input = ""
    
    for message in messages:
        if message.role == "system":
            combined_input += f"System: {message.content}\n\n"
        elif message.role == "user":
            combined_input += f"User: {message.content}\n\n"
        elif message.role == "assistant":
            combined_input += f"Assistant: {message.content}\n\n"
    
    return combined_input.strip()

async def generate_sse_events(stream):
    """
    Process OpenAI stream events and convert to Server-Sent Events format.
    Converted from the ReadableStream logic in route.ts
    """
    try:
        for event in stream:
            print(f"Stream event: {event.type} {event}")
            
            # Handle events generically and extract relevant data
            event_data = event.__dict__ if hasattr(event, '__dict__') else event
            
            # Handle output item events
            if event.type == 'response.output_item.added':
                sse_event = f"data: {json.dumps({
                    'event': 'response.output_item.added',
                    'data': event_data
                })}\n\n"
                yield sse_event
            
            elif event.type == 'response.output_item.done':
                sse_event = f"data: {json.dumps({
                    'event': 'response.output_item.done',
                    'data': {
                        'finish_reason': 'stop'
                    }
                })}\n\n"
                yield sse_event
            
            # Handle content part events
            elif event.type == 'response.content_part.added':
                sse_event = f"data: {json.dumps({
                    'event': 'response.content_part.added',
                    'data': event_data
                })}\n\n"
                yield sse_event
            
            elif event.type == 'response.content_part.done':
                sse_event = f"data: {json.dumps({
                    'event': 'response.content_part.done',
                    'data': event_data
                })}\n\n"
                yield sse_event
            
            # Handle reasoning events (if available)
            elif event.type.startswith('response.reasoning'):
                sse_event = f"data: {json.dumps({
                    'event': event.type,
                    'data': event_data
                })}\n\n"
                yield sse_event
            
            # Handle function call events
            elif event.type.startswith('response.function_call'):
                sse_event = f"data: {json.dumps({
                    'event': 'response.tool_calls.delta',
                    'data': {
                        'tool_calls': event_data
                    }
                })}\n\n"
                yield sse_event
            
            # Handle completion events
            elif event.type == 'response.completed':
                sse_event = f"data: {json.dumps({
                    'event': 'response.completed',
                    'data': {
                        'usage': getattr(event, 'usage', {})
                    }
                })}\n\n"
                yield sse_event
            
            # Handle failure events
            elif event.type == 'response.failed':
                error_msg = getattr(getattr(event, 'error', None), 'message', 'Unknown error')
                sse_event = f"data: {json.dumps({
                    'event': 'error',
                    'data': { 
                        'error': 'Response failed', 
                        'details': error_msg
                    }
                })}\n\n"
                yield sse_event
            
            # Handle any text-related events that contain deltas
            elif hasattr(event, 'delta') or hasattr(event, 'text'):
                delta = getattr(event, 'delta', None) or getattr(event, 'text', '')
                sse_event = f"data: {json.dumps({
                    'event': 'response.output_text.delta',
                    'data': {
                        'delta': delta,
                        'item_id': f'msg_{int(datetime.now().timestamp() * 1000)}'
                    }
                })}\n\n"
                yield sse_event
            
            # Handle any other event types generically
            else:
                sse_event = f"data: {json.dumps({
                    'event': event.type,
                    'data': event_data
                })}\n\n"
                yield sse_event
        
        # Send final completion marker
        yield "data: [DONE]\n\n"
        
    except Exception as error:
        print(f"Streaming error: {error}")
        error_message = str(error)
        error_event = f"data: {json.dumps({
            'event': 'error',
            'data': {'error': 'Streaming failed', 'details': error_message}
        })}\n\n"
        yield error_event

@app.post("/api/turn_response")
async def turn_response(request: TurnRequest):
    """
    Main endpoint for handling chat turns with OpenAI Responses API.
    Converted from POST handler in app/api/turn_response/route.ts
    """
    try:
        messages = request.messages
        tools = request.tools or []
        
        print(f"Received messages: {messages}")
        
        # Get MCP server tools
        mcp_tools = get_mcp_server_tools()
        all_tools = tools + mcp_tools
        
        print(f"Available tools: {len(all_tools)} tools")
        
        # Convert messages to Responses API input format
        system_message = Message(role="system", content=DEVELOPER_PROMPT)
        all_messages = [system_message] + messages
        input_text = convert_messages_to_input(all_messages)
        
        # Create streaming response using Responses API
        stream = openai_client.responses.create(
            model=MODEL,
            input=input_text,
            tools=all_tools if all_tools else None,
            store=True,
            stream=True,
        )

        # Return streaming response as Server-Sent Events
        return StreamingResponse(
            generate_sse_events(stream),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }
        )
        
    except Exception as error:
        print(f"Error in turn_response: {error}")
        
        # Return error as SSE format to match frontend expectations
        async def error_stream():
            error_message = str(error)
            error_event = f"data: {json.dumps({
                'event': 'error',
                'data': {'error': 'Internal server error', 'details': error_message}
            })}\n\n"
            yield error_event
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            error_stream(),
            status_code=500,
            media_type="text/event-stream",
            headers={
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )

@app.options("/api/turn_response")
async def turn_response_options():
    """
    Handle OPTIONS requests for CORS.
    Converted from OPTIONS handler in route.ts
    """
    return {
        "status": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    }

@app.get("/api/functions/get_weather")
async def api_get_weather(location: str, unit: str = "celsius"):
    """Weather function endpoint"""
    from functions.handlers import get_weather
    result = await get_weather(location, unit)
    return result

@app.get("/api/functions/get_joke")
async def api_get_joke():
    """Joke function endpoint"""
    from functions.handlers import get_joke
    result = await get_joke()
    return result

@app.get("/")
async def root():
    """Serve the web interface"""
    return FileResponse('static/index.html')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)