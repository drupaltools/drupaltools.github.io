#!/bin/bash

# Git-only release script - updates version, builds, commits, tags, and pushes
# Usage: ./release-git.sh [patch|minor|major] (default: auto-detect)

set -e

# Get release type from argument (default: auto)
RELEASE_TYPE=${1:-"auto"}

echo "🚀 Starting git-only release process..."

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📍 Current version: $CURRENT_VERSION"

# Run standard-version
if [ "$RELEASE_TYPE" = "auto" ]; then
    echo "📝 Updating version and changelog (auto-detect)..."
    npm run release
else
    echo "📝 Updating version and changelog ($RELEASE_TYPE)..."
    npm run release:$RELEASE_TYPE
fi

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "📍 New version: $NEW_VERSION"

# Build the package
echo "🔨 Building package..."
npm run build

# Commit and tag
echo "📤 Committing and tagging..."
git add package.json RELEASES.md
git commit -m "chore(release): $NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release $NEW_VERSION"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin master
git push origin "v$NEW_VERSION"

echo "✅ Release $NEW_VERSION pushed to GitHub!"
echo "🔗 View: https://github.com/drupaltools/drupaltools.github.io/releases/tag/v$NEW_VERSION"