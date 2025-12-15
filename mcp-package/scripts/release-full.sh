#!/bin/bash

# Full release script - git operations + npm publish
# Usage: ./release-full.sh [patch|minor|major] (default: auto-detect)

set -e

# Get release type from argument (default: auto)
RELEASE_TYPE=${1:-"auto"}

echo "🚀 Starting full release process..."

# Run git release first
echo "📦 Running git release..."
./release-git.sh $RELEASE_TYPE

# Get the version
VERSION=$(node -p "require('./package.json').version")

# Ask about npm publish
echo ""
read -p "📦 Do you want to publish to npm now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Publishing to npm..."
    npm run publish
    echo ""
    echo "🎉 Complete release finished!"
    echo "📋 Summary:"
    echo "   - Version: $VERSION"
    echo "   - GitHub: https://github.com/drupaltools/drupaltools.github.io/releases/tag/v$VERSION"
    echo "   - npm: https://www.npmjs.com/package/@drupaltools/mcp/v/$VERSION"
    echo ""
    echo "💡 Users can now install with: npx @drupaltools/mcp@$VERSION"
else
    echo ""
    echo "✅ Git release completed!"
    echo "📦 To publish to npm later, run: npm run publish"
    echo "   or: cd dist && npm publish"
fi