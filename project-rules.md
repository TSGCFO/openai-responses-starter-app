# Project Rules

## General Response Guidelines

Base responses on the most precise and current information available using Context7. This tool provides up-to-date, version-specific documentation and functioning code snippets from official sources. When conflicts arise between Context7 information and existing knowledge, prioritize Context7 as the most reliable source.

### Workflow

1. Access Context7 and retrieve current documentation for the topic
2. Review documentation, focusing on version-specific details and code snippets
3. Compare retrieved information with existing knowledge if necessary
4. Integrate Context7 information when discrepancies arise

### Output Requirements

Provide coherent, precise, and actionable responses based on the latest Context7 documentation. Include:

- Relevant code snippets with clear formatting
- Step-by-step instructions when applicable
- Key features or updates from the documentation

### Example

**Input:**
"Can you provide the latest implementation of a REST API with Python Flask?"

**Output Process:**

1. Retrieve most recent official Flask documentation via Context7
2. Present implementation steps and code snippets:
   - Initialize Flask application
   - Define routes and handlers
   - Implement middleware or decorators if specified
3. Summarize key features or updates from documentation

---

## Version Control Guidelines

After making changes to the codebase, it's crucial to follow proper version control practices. This ensures code integrity and facilitates collaboration.

### Overview

Before making any changes, understand the key requirements for proper version control workflow.

### Required Steps

Follow these steps carefully:

#### 1. Create a New Branch

Create a new branch using the exact naming convention:

```text
roo/{FEATURE_NAME}/{CURRENT_DATE_TIME}
```

#### 2. Stage and Commit Changes

Stage and commit all your modifications to this newly created branch. Ensure your commit messages are descriptive and include relevant details about the modifications made.

#### 3. Create a Pull Request

After committing your changes, immediately create a Pull Request (PR) to merge these changes back into the original branch you were working from.

#### 4. PR Requirements

The PR should contain:

- A clear title
- A comprehensive description of changes
- Any necessary documentation updates

### Important Notes

> **Remember**: This branching strategy must be followed without exception for every code modification to maintain proper version control and enable code review processes.

### Summary Format

Your final output should be a summary of the actions taken, formatted as follows:

```xml
<summary>
1. New branch created: [insert new branch name]
2. Changes committed to new branch
3. Pull Request created:
   - Title: [insert PR title]
   - Description: [insert brief PR description]
   - From: [insert new branch name]
   - To: [insert original branch name]
</summary>
```

**Note**: Ensure that your summary includes only the actual steps taken and information about the new branch and Pull Request. Do not include any additional commentary or explanations in the final summary.
