"""
Command Line Interface for the OpenAI Responses starter app.
Simple alternative to the React frontend.
"""

import os
import json
import asyncio
from typing import List, Dict, Any
from datetime import datetime

import openai
from dotenv import load_dotenv
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Prompt

from config.constants import DEVELOPER_PROMPT, MODEL, INITIAL_MESSAGE
from config.mcp_server_integration import get_original_mcp_configuration
from functions.handlers import FUNCTIONS_MAP

# Load environment variables
load_dotenv()

# Initialize rich console for better CLI output
console = Console()

# Initialize OpenAI client
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class Message:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

class ConversationManager:
    def __init__(self):
        self.messages: List[Message] = []
        self.console = Console()
    
    def add_message(self, role: str, content: str):
        """Add a message to the conversation history"""
        self.messages.append(Message(role, content))
    
    def get_mcp_server_tools(self) -> List[Dict[str, Any]]:
        """
        Convert MCP server configuration to OpenAI tools format.
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
    
    def convert_messages_to_input(self, messages: List[Message]) -> str:
        """Convert chat messages to Responses API input format"""
        combined_input = ""
        
        for message in messages:
            if message.role == "system":
                combined_input += f"System: {message.content}\n\n"
            elif message.role == "user":
                combined_input += f"User: {message.content}\n\n"
            elif message.role == "assistant":
                combined_input += f"Assistant: {message.content}\n\n"
        
        return combined_input.strip()
    
    async def process_turn(self, user_input: str):
        """Process a user turn and get AI response"""
        # Add user message
        self.add_message("user", user_input)
        
        # Get MCP server tools
        mcp_tools = self.get_mcp_server_tools()
        
        # Prepare messages for API
        system_message = Message("system", DEVELOPER_PROMPT)
        all_messages = [system_message] + self.messages
        input_text = self.convert_messages_to_input(all_messages)
        
        try:
            # Create streaming response using Responses API
            stream = openai_client.responses.create(
                model=MODEL,
                input=input_text,
                tools=mcp_tools if mcp_tools else None,
                store=True,
                stream=True,
            )
            
            response_text = ""
            
            # Process streaming events
            response_text = ""
            
            for event in stream:
                if event.type == 'response.output_item.added':
                    # Handle new output items
                    if hasattr(event, 'output') and hasattr(event.output, 'content'):
                        for content in event.output.content:
                            if hasattr(content, 'text'):
                                response_text += content.text
                                self.console.print(content.text, end="")
                
                elif event.type == 'response.content_part.added':
                    # Handle content parts
                    if hasattr(event, 'part') and hasattr(event.part, 'text'):
                        response_text += event.part.text
                        self.console.print(event.part.text, end="")
                
                elif hasattr(event, 'delta'):
                    # Handle delta updates
                    response_text += event.delta
                    self.console.print(event.delta, end="")
                
                elif hasattr(event, 'text'):
                    # Handle text updates
                    response_text += event.text
                    self.console.print(event.text, end="")
            
            print()  # New line after streaming
            
            # Add assistant response to conversation
            if response_text:
                self.add_message("assistant", response_text)
            
        except Exception as e:
            self.console.print(f"[red]Error: {e}[/red]")
            return False
        
        return True

async def main():
    """Main CLI application loop"""
    console.print(Panel.fit(
        "[bold blue]OpenAI Responses Starter App - Python CLI[/bold blue]\n"
        "Type 'quit', 'exit', or press Ctrl+C to exit.",
        title="Welcome"
    ))
    
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        console.print("[red]Error: OPENAI_API_KEY environment variable not set![/red]")
        console.print("Please set your OpenAI API key in the .env file or as an environment variable.")
        return
    
    # Initialize conversation manager
    conversation = ConversationManager()
    
    # Display initial message
    console.print(Panel(Markdown(INITIAL_MESSAGE), title="Assistant"))
    
    try:
        while True:
            # Get user input
            user_input = Prompt.ask("\n[bold green]You[/bold green]")
            
            # Check for exit commands
            if user_input.lower() in ['quit', 'exit', 'q']:
                console.print("[yellow]Goodbye![/yellow]")
                break
            
            if user_input.strip() == "":
                continue
            
            # Display user message
            console.print(Panel(user_input, title="You"))
            
            # Process the turn
            console.print("\n[bold blue]Assistant:[/bold blue] ", end="")
            await conversation.process_turn(user_input)
    
    except KeyboardInterrupt:
        console.print("\n[yellow]Goodbye![/yellow]")
    except Exception as e:
        console.print(f"[red]Unexpected error: {e}[/red]")

if __name__ == "__main__":
    asyncio.run(main())