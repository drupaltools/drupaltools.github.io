#!/bin/bash

# Minor release - convenience script for minor releases
# Usage: ./release-minor.sh [publish]

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "📦 Minor release..."

if [ "$1" = "publish" ]; then
    "$SCRIPT_DIR/release-full.sh" minor
else
    "$SCRIPT_DIR/release-git.sh" minor
fi