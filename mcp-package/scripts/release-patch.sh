#!/bin/bash

# Patch release - convenience script for patch releases
# Usage: ./release-patch.sh [publish]

echo "📦 Patch release..."

if [ "$1" = "publish" ]; then
    ./release-full.sh patch
else
    ./release-git.sh patch
fi