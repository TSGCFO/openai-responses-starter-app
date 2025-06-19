#!/bin/bash
# Setup script to configure git hooks for @claude automation

echo "Setting up @claude automation git hooks..."

# Create .githooks directory if it doesn't exist
mkdir -p .githooks

# Make the commit-msg hook executable
chmod +x .githooks/commit-msg

# Configure git to use the shared hooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks configured successfully!"
echo "All commits will now be prefixed with '@claude' automatically."
echo ""
echo "To test the hook, try making a commit:"
echo "git commit -m 'test commit message'"