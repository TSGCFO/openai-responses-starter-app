"""
Enhanced Python CLI with better OpenAI Responses API integration.
This version uses simpler API calls that are more likely to work.
"""

import os
import json
import asyncio
import sys
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
from config.tools_list import TOOLS_LIST
from functions.handlers import FUNCTIONS_MAP

# Load environment variables
load_dotenv()

# Initialize rich console for better CLI output
console = Console()

class SimpleConversationManager:
    def __init__(self):
        self.messages: List[Dict[str, str]] = []
        self.console = Console()
        
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            self.console.print("[red]Error: OPENAI_API_KEY environment variable not set![/red]")
            self.console.print("Please set your OpenAI API key in the .env file or as an environment variable.")
            sys.exit(1)
            
        self.openai_client = openai.OpenAI(api_key=api_key)
    
    def add_message(self, role: str, content: str):
        """Add a message to the conversation history"""
        self.messages.append({"role": role, "content": content})
    
    def get_tools_for_openai(self) -> List[Dict[str, Any]]:
        """
        Get tools in OpenAI function calling format.
        """
        tools = []
        for tool in TOOLS_LIST:
            tools.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["parameters"]
                }
            })
        return tools
    
    async def execute_function(self, function_name: str, arguments: Dict[str, Any]) -> str:
        """Execute a function call"""
        if function_name in FUNCTIONS_MAP:
            try:
                if function_name == "get_weather":
                    result = await FUNCTIONS_MAP[function_name](
                        arguments.get("location", ""), 
                        arguments.get("unit", "celsius")
                    )
                else:
                    result = await FUNCTIONS_MAP[function_name]()
                return json.dumps(result)
            except Exception as e:
                return json.dumps({"error": str(e)})
        else:
            return json.dumps({"error": f"Function {function_name} not found"})
    
    async def process_turn(self, user_input: str):
        """Process a user turn and get AI response"""
        # Add user message
        self.add_message("user", user_input)
        
        # Prepare messages for API
        system_message = {"role": "system", "content": DEVELOPER_PROMPT}
        all_messages = [system_message] + self.messages
        
        tools = self.get_tools_for_openai()
        
        try:
            # Use the chat completions API with function calling for better compatibility
            response = self.openai_client.chat.completions.create(
                model=MODEL,
                messages=all_messages,
                tools=tools if tools else None,
                stream=True
            )
            
            response_text = ""
            function_calls = []
            
            # Process streaming response
            for chunk in response:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    response_text += content
                    self.console.print(content, end="")
                
                # Handle function calls
                if chunk.choices[0].delta.tool_calls:
                    for tool_call in chunk.choices[0].delta.tool_calls:
                        if tool_call.function:
                            function_calls.append(tool_call)
            
            print()  # New line after streaming
            
            # Execute any function calls
            if function_calls:
                for tool_call in function_calls:
                    if tool_call.function and tool_call.function.name:
                        self.console.print(f"[yellow]Executing function: {tool_call.function.name}[/yellow]")
                        
                        try:
                            args = json.loads(tool_call.function.arguments or "{}")
                            result = await self.execute_function(tool_call.function.name, args)
                            self.console.print(f"[green]Function result: {result}[/green]")
                            
                            # Add function call and result to conversation
                            self.add_message("assistant", response_text)
                            self.messages.append({
                                "role": "tool",
                                "content": result,
                                "tool_call_id": tool_call.id
                            })
                            
                            # Get another response with the function result
                            follow_up = self.openai_client.chat.completions.create(
                                model=MODEL,
                                messages=[system_message] + self.messages,
                                stream=True
                            )
                            
                            follow_up_text = ""
                            for chunk in follow_up:
                                if chunk.choices[0].delta.content is not None:
                                    content = chunk.choices[0].delta.content
                                    follow_up_text += content
                                    self.console.print(content, end="")
                            
                            print()  # New line
                            if follow_up_text:
                                self.add_message("assistant", follow_up_text)
                            
                        except Exception as e:
                            self.console.print(f"[red]Function execution error: {e}[/red]")
            
            # Add assistant response to conversation
            elif response_text:
                self.add_message("assistant", response_text)
            
        except Exception as e:
            self.console.print(f"[red]Error: {e}[/red]")
            return False
        
        return True

async def main():
    """Main CLI application loop"""
    console.print(Panel.fit(
        "[bold blue]OpenAI Responses Starter App - Python CLI[/bold blue]\n"
        "Type 'quit', 'exit', or press Ctrl+C to exit.\n"
        "Try: 'What's the weather in London?' or 'Tell me a joke'",
        title="Welcome"
    ))
    
    # Initialize conversation manager
    conversation = SimpleConversationManager()
    
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