#!/bin/bash

# Comprehensive release script for @drupaltools/mcp
# This script will:
# 1. Create a new version using standard-version
# 2. Build the package
# 3. Create and push git tag
# 4. Publish to npm

set -e

echo "🚀 Starting release process for @drupaltools/mcp"

# Check if we're on the main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "master" ]; then
    echo "⚠️  Warning: You're not on the master branch (current: $current_branch)"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# Get the current version
current_version=$(node -p "require('./package.json').version")
echo "📍 Current version: $current_version"

# Determine release type
release_type="patch"
if [ "$1" = "minor" ] || [ "$1" = "major" ]; then
    release_type="$1"
fi

echo "📦 Release type: $release_type"

# Run standard-version to update version and changelog
echo "📝 Updating version and changelog..."
npm run release:$release_type

# Get the new version
new_version=$(node -p "require('./package.json').version")
echo "📍 New version: $new_version"

# Build the package
echo "🔨 Building package..."
npm run build

# Add changes to git
echo "📤 Adding changes to git..."
git add package.json RELEASES.md
git commit -m "chore(release): $new_version"

# Create and push git tag
echo "🏷️  Creating git tag v$new_version..."
git tag -a "v$new_version" -m "Release $new_version"

echo "📤 Pushing changes and tag to origin..."
git push origin master
git push origin "v$new_version"

# Ask if user wants to publish to npm
read -p "📦 Do you want to publish to npm now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Publishing to npm..."
    npm run publish:npm
    echo "✅ Published to npm successfully!"
else
    echo "💡 To publish manually, run: npm run publish:npm"
fi

echo ""
echo "🎉 Release $new_version completed successfully!"
echo "📋 Summary:"
echo "   - Version bumped from $current_version to $new_version"
echo "   - Changelog updated in RELEASES.md"
echo "   - Git tag v$new_version created and pushed"
echo "   - Package built and ready for distribution"
echo ""
echo "🔗 View release: https://github.com/drupaltools/drupaltools.github.io/releases/tag/v$new_version"
echo "📦 npm package: https://www.npmjs.com/package/@drupaltools/mcp"