"""
MCP Server Integration Configuration for Python.
Converted from config/mcp-server-integration.ts
"""

from typing import List, Dict, Optional, Union
from dataclasses import dataclass

@dataclass
class McpServerToolConfig:
    type: str  # "file_search" or "mcp"
    vector_store_ids: Optional[List[str]] = None
    server_label: Optional[str] = None
    server_url: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    allowed_tools: Optional[List[str]] = None
    require_approval: Optional[str] = None  # "never" or "always"

def get_original_mcp_configuration() -> List[McpServerToolConfig]:
    """
    Original MCP Server Configuration as requested by the user.
    Converted from TypeScript interface to Python dataclass.
    """
    return [
        # File search tool commented out due to placeholder vector store ID
        # Users should uncomment and add their own vector store ID
        # McpServerToolConfig(
        #     type="file_search",
        #     vector_store_ids=["YOUR_VECTOR_STORE_ID_HERE"]
        # ),
        
        # GitHub MCP server commented out due to authentication requirement
        # Users can uncomment and add their own GitHub token
        # McpServerToolConfig(
        #     type="mcp",
        #     server_label="GitHub",
        #     server_url="https://api.githubcopilot.com/mcp/",
        #     headers={
        #         "Authorization": "Bearer YOUR_GITHUB_TOKEN_HERE"
        #     },
        #     allowed_tools=[
        #         "add_issue_comment",
        #         "create_issue", 
        #         "create_pull_request",
        #         "get_file_contents",
        #         "search_code",
        #         "list_branches"
        #     ],
        #     require_approval="never"
        # ),
        
        McpServerToolConfig(
            type="mcp",
            server_label="Context7",
            server_url="https://mcp.context7.com/mcp",
            allowed_tools=[
                "resolve-library-id",
                "get-library-docs"
            ],
            require_approval="always"
        )
    ]

# Enhanced GitHub tools list based on the MCP server documentation
GITHUB_MCP_TOOLS = [
    "add_issue_comment", 
    "create_issue", 
    "create_pull_request", 
    "get_file_contents", 
    "search_code", 
    "list_branches",
    "get_issue",
    "list_issues",
    "get_pull_request",
    "list_pull_requests",
    "create_branch",
    "fork_repository",
    "get_issue_comments",
    "get_pull_request_comments",
    "get_pull_request_diff",
    "get_pull_request_files",
    "get_commit",
    "list_commits",
    "create_repository",
    "update_issue",
    "update_pull_request",
    "merge_pull_request",
    "search_repositories",
    "search_users",
    "get_pull_request_reviews",
    "create_pending_pull_request_review",
    "submit_pending_pull_request_review",
    "list_notifications",
    "get_me"
]

CONTEXT7_MCP_TOOLS = [
    "resolve-library-id",
    "get-library-docs"
]