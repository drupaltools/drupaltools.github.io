#!/bin/bash

# Major release - convenience script for major releases
# Usage: ./release-major.sh [publish]

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "📦 Major release..."

if [ "$1" = "publish" ]; then
    "$SCRIPT_DIR/release-full.sh" major
else
    "$SCRIPT_DIR/release-git.sh" major
fi