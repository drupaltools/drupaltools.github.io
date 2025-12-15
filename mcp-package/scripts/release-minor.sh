#!/bin/bash

# Minor release - convenience script for minor releases
# Usage: ./release-minor.sh [publish]

echo "📦 Minor release..."

if [ "$1" = "publish" ]; then
    ./release-full.sh minor
else
    ./release-git.sh minor
fi