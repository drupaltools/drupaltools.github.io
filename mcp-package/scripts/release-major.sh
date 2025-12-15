#!/bin/bash

# Major release - convenience script for major releases
# Usage: ./release-major.sh [publish]

echo "📦 Major release..."

if [ "$1" = "publish" ]; then
    ./release-full.sh major
else
    ./release-git.sh major
fi