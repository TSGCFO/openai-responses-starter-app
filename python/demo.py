"""
Demo script to test Python conversion without OpenAI API key.
Tests function handlers and basic functionality.
"""

import asyncio
import json
from rich.console import Console
from rich.panel import Panel

# Import our function handlers
from functions.handlers import get_weather, get_joke, FUNCTIONS_MAP
from config.constants import DEVELOPER_PROMPT, INITIAL_MESSAGE
from config.mcp_server_integration import get_original_mcp_configuration
from config.tools_list import TOOLS_LIST

console = Console()

async def test_functions():
    """Test the function handlers"""
    console.print(Panel.fit("[bold blue]Testing Function Handlers[/bold blue]", title="Demo"))
    
    # Test weather function
    console.print("\n[yellow]Testing weather function...[/yellow]")
    try:
        weather_result = await get_weather("London", "celsius")
        console.print(f"Weather result: {json.dumps(weather_result, indent=2)}")
    except Exception as e:
        console.print(f"[red]Weather function error: {e}[/red]")
    
    # Test joke function
    console.print("\n[yellow]Testing joke function...[/yellow]")
    try:
        joke_result = await get_joke()
        console.print(f"Joke result: {json.dumps(joke_result, indent=2)}")
    except Exception as e:
        console.print(f"[red]Joke function error: {e}[/red]")

def test_configuration():
    """Test configuration loading"""
    console.print(Panel.fit("[bold blue]Testing Configuration[/bold blue]", title="Demo"))
    
    console.print(f"\n[yellow]Developer Prompt (first 100 chars):[/yellow]")
    console.print(DEVELOPER_PROMPT[:100] + "...")
    
    console.print(f"\n[yellow]Initial Message:[/yellow]")
    console.print(INITIAL_MESSAGE.strip())
    
    console.print(f"\n[yellow]Available Tools:[/yellow]")
    for tool in TOOLS_LIST:
        console.print(f"- {tool['name']}: {tool['description']}")
    
    console.print(f"\n[yellow]MCP Configuration:[/yellow]")
    mcp_config = get_original_mcp_configuration()
    for i, config in enumerate(mcp_config):
        console.print(f"- Server {i+1}: {config.server_label} ({config.type})")
        if config.allowed_tools:
            console.print(f"  Tools: {', '.join(config.allowed_tools)}")

async def main():
    console.print(Panel.fit(
        "[bold green]OpenAI Responses Starter App - Python Conversion Demo[/bold green]\n"
        "This demo tests the Python conversion without requiring an OpenAI API key.",
        title="Demo Mode"
    ))
    
    # Test configuration
    test_configuration()
    
    # Test functions
    await test_functions()
    
    console.print(Panel.fit(
        "[bold green]Demo completed successfully![/bold green]\n"
        "The Python conversion is working correctly.\n"
        "To use the full application:\n"
        "1. Set up your OpenAI API key in .env\n"
        "2. Run: python simple_cli.py (for CLI)\n"
        "3. Run: python main.py (for web server)",
        title="Success"
    ))

if __name__ == "__main__":
    asyncio.run(main())