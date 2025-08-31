"""
Tools list configuration for Python.
Converted from config/tools-list.ts
"""

# List of tools available to the assistant
# No need to include the top-level wrapper object as it is added in lib/tools/tools.py
# More information on function calling: https://platform.openai.com/docs/guides/function-calling

TOOLS_LIST = [
    {
        "name": "get_weather",
        "description": "Get the weather for a given location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "Location to get weather for",
                },
                "unit": {
                    "type": "string",
                    "description": "Unit to get weather in",
                    "enum": ["celsius", "fahrenheit"],
                },
            },
            "required": ["location", "unit"]
        },
    },
    {
        "name": "get_joke",
        "description": "Get a programming joke",
        "parameters": {
            "type": "object",
            "properties": {}
        },
    },
]