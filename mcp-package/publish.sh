#!/bin/bash

# Script to publish @drupaltools/mcp to npm
set -e

echo "📦 Publishing @drupaltools/mcp to npm..."

# Check if user is logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ You are not logged in to npm. Please run: npm login"
    exit 1
fi

# Build the package
echo "🔨 Building the package..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

# Ask for version
if [ -z "$1" ]; then
    read -p "Enter version to publish (e.g., 1.0.0): " VERSION
else
    VERSION=$1
fi

# Update version
echo "📝 Updating version to $VERSION..."
npm version $VERSION --no-git-tag-version
cd dist
npm version $VERSION --no-git-tag-version
cd ..

# Publish to npm
echo "🚀 Publishing to npm..."
cd dist
npm publish

echo "✅ Successfully published @drupaltools/mcp@$VERSION"
echo ""
echo "Users can now install with:"
echo "  npx @drupaltools/mcp@$VERSION"
echo ""
echo "Or configure in Claude Desktop:"
echo '  "drupaltools": {'
echo '    "type": "stdio",'
echo '    "command": "npx",'
echo "    \"args\": [\"@drupaltools/mcp@$VERSION\"]"
echo '  }'