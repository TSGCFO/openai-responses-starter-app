"""
Configuration constants for the Python OpenAI Responses starter app.
Converted from config/constants.ts
"""

MODEL = "gpt-4o"

# Developer prompt for the assistant
DEVELOPER_PROMPT = """
You are a helpful assistant helping users with their queries.
If they need up to date information, you can use the web search tool to search the web for relevant information. Only use web search once at a time, if you've already used it an there is no new information, don't use it again.
If they ask for something that is related to their own data, use the file search tool to search their files for relevant information.
If they ask something that could be solved through code, use the code interpreter tool to solve it.
"""

# Initial message that will be displayed in the chat
INITIAL_MESSAGE = """
Hi, how can I help you?
"""

DEFAULT_VECTOR_STORE = {
    "id": "",
    "name": "Example",
}