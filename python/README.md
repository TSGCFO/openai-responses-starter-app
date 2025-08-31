# OpenAI Responses Starter App - Python Version

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
![Python](https://img.shields.io/badge/Built_with-Python-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)
![OpenAI API](https://img.shields.io/badge/Powered_by-OpenAI_API-orange)

This is a Python conversion of the NextJS starter app built on top of the [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses).

It includes both a **FastAPI web server** and a **command-line interface (CLI)** for interacting with the OpenAI Responses API.

## Features

- Multi-turn conversation handling
- OpenAI Responses API integration with streaming
- MCP (Model Context Protocol) server support
- Function calling (weather, jokes)
- Server-Sent Events (SSE) streaming for web interface
- Rich CLI interface with markdown rendering
- CORS-enabled FastAPI backend

## Prerequisites

- Python 3.8 or higher
- OpenAI API key

## Quick Setup

1. **Navigate to the Python directory:**
   ```bash
   cd python
   ```

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

3. **Set your OpenAI API key:**
   
   Edit the `.env` file and add your OpenAI API key:
   ```bash
   OPENAI_API_KEY=your-actual-api-key-here
   ```

## Usage

### Option 1: Command Line Interface (CLI)

The CLI provides a rich terminal interface for chatting with the AI:

```bash
source venv/bin/activate
python cli.py
```

Features:
- Interactive conversation with markdown rendering
- Real-time streaming responses
- Function calling support
- Rich terminal formatting

### Option 2: Web Server (FastAPI)

The FastAPI server provides HTTP endpoints compatible with the original frontend:

```bash
source venv/bin/activate
python main.py
```

The server will start on `http://localhost:8000`

**API Endpoints:**
- `POST /api/turn_response` - Main chat endpoint with SSE streaming
- `GET /` - Health check endpoint

You can test the API using curl:
```bash
curl -X POST "http://localhost:8000/api/turn_response" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is the weather in New York?"}
    ],
    "tools": []
  }'
```

## Manual Setup

If you prefer manual setup instead of using the setup script:

1. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

## Project Structure

```
python/
├── cli.py                     # Command-line interface
├── main.py                    # FastAPI web server
├── requirements.txt           # Python dependencies
├── setup.sh                   # Setup script
├── config/
│   ├── constants.py           # App constants and prompts
│   ├── mcp_server_integration.py  # MCP server configuration
│   └── tools_list.py          # Available tools configuration
└── functions/
    └── handlers.py            # Function implementations (weather, jokes)
```

## Differences from TypeScript Version

### Similarities:
- Same OpenAI Responses API integration
- Same function calling capabilities  
- Same MCP server configuration
- Same streaming response handling

### Key Differences:
- **Backend**: FastAPI instead of Next.js API routes
- **Frontend**: Rich CLI interface instead of React components
- **Language**: Python instead of TypeScript
- **Dependencies**: Python packages instead of npm packages

## Available Functions

The app includes these example functions:

1. **get_weather** - Get current weather for a location
2. **get_joke** - Get a programming joke

## MCP Server Integration

The app supports MCP (Model Context Protocol) servers, including:
- Context7 server for library documentation
- Configurable GitHub integration (commented out by default)

## Development

To modify the app:

1. **Add new functions**: Edit `functions/handlers.py` and `config/tools_list.py`
2. **Modify prompts**: Edit `config/constants.py`
3. **Configure MCP servers**: Edit `config/mcp_server_integration.py`

## Troubleshooting

**"OPENAI_API_KEY environment variable not set"**
- Make sure you've created a `.env` file with your API key
- Ensure you're in the `python/` directory when running the commands

**Import errors**
- Make sure you've activated the virtual environment: `source venv/bin/activate`
- Ensure all dependencies are installed: `pip install -r requirements.txt`

## License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.