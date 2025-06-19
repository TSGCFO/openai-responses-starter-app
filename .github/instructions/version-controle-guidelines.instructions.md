---
applyTo: '**/*'
---
# Version Control Guidelines

After making changes to the codebase, it's crucial to follow proper version control practices. This ensures code integrity and facilitates collaboration. Follow these instructions to commit your changes and create a Pull Request (PR).

## Overview

Before we begin, here are the key details you need to know:

## Required Steps

Follow these steps carefully:

### 1. Create a New Branch

Create a new branch using the exact naming convention:

```text
roo/{FEATURE_NAME}/{CURRENT_DATE_TIME}
```

### 2. Stage and Commit Changes

```bash
git add .
git commit -m "Your descriptive commit message"
```
Stage and commit all your modifications to this newly created branch. Ensure your commit messages are descriptive and include relevant details about the modifications made.

### 3. Create a Pull Request

After committing your changes, immediately create a Pull Request (PR) to merge these changes back into the original branch you were working from (`{ORIGINAL_BRANCH}`).

### 4. PR Requirements

The PR should contain:

- A clear title
- A comprehensive description of changes
- Any necessary documentation updates

## Important Notes

> **Remember**: This branching strategy must be followed without exception for every code modification to maintain proper version control and enable code review processes.

## Summary Format

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
