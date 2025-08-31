# TypeScript to Python Conversion Guide

This document outlines the conversion from the Next.js TypeScript starter app to the Python implementation.

## File Mapping

| TypeScript Original | Python Equivalent | Description |
|---------------------|-------------------|-------------|
| `app/api/turn_response/route.ts` | `python/main.py` | Main API endpoint with FastAPI |
| `config/constants.ts` | `python/config/constants.py` | Configuration constants |
| `config/functions.ts` | `python/functions/handlers.py` | Function implementations |
| `config/mcp-server-integration.ts` | `python/config/mcp_server_integration.py` | MCP server config |
| `config/tools-list.ts` | `python/config/tools_list.py` | Tools configuration |
| `lib/assistant.ts` | `python/cli.py` + `python/simple_cli.py` | Assistant logic |
| `app/api/functions/*/route.ts` | `python/functions/handlers.py` | Function endpoints |
| React components | `python/static/index.html` | Simple web interface |

## Key Differences

### Backend Framework
- **TypeScript**: Next.js API routes with Edge Runtime
- **Python**: FastAPI with ASGI server (Uvicorn)

### API Endpoints
- **TypeScript**: `/api/turn_response` (Next.js route)
- **Python**: `/api/turn_response` (FastAPI endpoint with same interface)

### Streaming Implementation
- **TypeScript**: ReadableStream with Server-Sent Events
- **Python**: FastAPI StreamingResponse with SSE

### Frontend Options
- **TypeScript**: Full React application with components
- **Python**: 
  - Rich CLI interface (`simple_cli.py`)
  - Simple HTML/JS web interface (`static/index.html`)
  - Advanced CLI with Responses API (`cli.py`)

### Dependencies
- **TypeScript**: Next.js, React, OpenAI SDK, etc.
- **Python**: FastAPI, OpenAI SDK, Rich, httpx, etc.

## Feature Parity

### ✅ Fully Converted
- OpenAI Responses API integration
- Streaming chat responses
- Function calling (weather, jokes)
- MCP server configuration
- Server-Sent Events
- CORS handling
- Environment configuration

### ✅ Enhanced in Python
- Multiple interface options (CLI + Web)
- Rich terminal formatting
- Better error handling
- Simplified setup process

### 📝 Simplified in Python
- Web interface is simpler HTML/JS instead of full React app
- Reduced complexity for easier maintenance
- Focus on core functionality

## Usage Comparison

### TypeScript (Original)
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

### Python (Converted)
```bash
cd python
./setup.sh
source venv/bin/activate

# Option 1: CLI
python simple_cli.py

# Option 2: Web Server
python main.py
# Visit http://localhost:8000
```

## Code Structure Comparison

### TypeScript Function Definition
```typescript
export const get_weather = async ({
  location,
  unit,
}: {
  location: string;
  unit: string;
}) => {
  const res = await fetch(
    `/api/functions/get_weather?location=${location}&unit=${unit}`
  ).then((res) => res.json());
  return res;
};
```

### Python Function Definition
```python
async def get_weather(location: str, unit: str) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        geo_response = await client.get(
            f"https://nominatim.openstreetmap.org/search?q={location}&format=json"
        )
        geo_data = geo_response.json()
    # ... rest of implementation
    return {"temperature": current_temperature}
```

### TypeScript API Route
```typescript
export async function POST(request: NextRequest) {
  const { messages, tools = [] } = await request.json();
  const stream = await openai.responses.create({
    model: 'gpt-4o',
    input: input,
    tools: allTools.length > 0 ? allTools : undefined,
    store: true,
    stream: true,
  });
  // ... SSE handling
}
```

### Python FastAPI Route
```python
@app.post("/api/turn_response")
async def turn_response(request: TurnRequest):
    messages = request.messages
    tools = request.tools or []
    stream = openai_client.responses.create(
        model=MODEL,
        input=input_text,
        tools=all_tools if all_tools else None,
        store=True,
        stream=True,
    )
    return StreamingResponse(generate_sse_events(stream), ...)
```

## Benefits of Python Version

1. **Multiple Interfaces**: CLI and web options
2. **Simplified Setup**: Single setup script
3. **Better CLI Experience**: Rich formatting and markdown support
4. **Direct Function Calls**: Functions implemented directly vs API calls
5. **Type Safety**: Pydantic models for request validation
6. **Production Ready**: FastAPI with proper CORS and error handling

## Running Both Versions

You can run both the TypeScript and Python versions simultaneously:

- **TypeScript**: `npm run dev` (port 3000)
- **Python**: `python main.py` (port 8000)

This allows you to compare functionality and performance between implementations.