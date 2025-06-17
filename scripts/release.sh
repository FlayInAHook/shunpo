#!/bin/bash

# Script to bump version and create a release tag
# Usage: ./release.sh [patch|minor|major]

set -e

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "npm is required but not installed."
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "git is required but not installed."
    exit 1
fi

# Default to patch if no argument provided
VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Invalid version type. Use: patch, minor, or major"
    exit 1
fi

echo "Bumping $VERSION_TYPE version..."

# Bump version in package.json
npm version $VERSION_TYPE --no-git-tag-version

# Get the new version
NEW_VERSION=$(node -p "require('./package.json').version")

echo "New version: $NEW_VERSION"

# Stage the package.json change
git add package.json

# Commit the version bump
git commit -m "bump version to v$NEW_VERSION"

# Create and push the tag
git tag "v$NEW_VERSION"

echo "Created tag: v$NEW_VERSION"
echo ""
echo "To trigger the release build, push the tag:"
echo "git push origin v$NEW_VERSION"
echo ""
echo "Or push everything:"
echo "git push && git push --tags"
