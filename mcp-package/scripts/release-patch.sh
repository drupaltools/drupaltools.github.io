#!/bin/bash

# Patch release - convenience script for patch releases
# Usage: ./release-patch.sh [publish]

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "📦 Patch release..."

if [ "$1" = "publish" ]; then
    "$SCRIPT_DIR/release-full.sh" patch
else
    "$SCRIPT_DIR/release-git.sh" patch
fi