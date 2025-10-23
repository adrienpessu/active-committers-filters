#!/bin/bash

# Build script for active-commiters-filters
# This script builds the application for multiple platforms

APP_NAME="active-commiters-filters"
BUILD_DIR="build"

# Create build directory
mkdir -p $BUILD_DIR

echo "Building $APP_NAME for multiple platforms..."

# Build for Windows (amd64)
echo "Building for Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -o $BUILD_DIR/${APP_NAME}-windows-amd64.exe .

# Build for macOS (arm64 - Apple Silicon)
echo "Building for macOS (arm64)..."
GOOS=darwin GOARCH=arm64 go build -o $BUILD_DIR/${APP_NAME}-darwin-arm64 .

# Build for macOS (amd64 - Intel)
echo "Building for macOS (amd64)..."
GOOS=darwin GOARCH=amd64 go build -o $BUILD_DIR/${APP_NAME}-darwin-amd64 .

# Build for Linux (amd64)
echo "Building for Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -o $BUILD_DIR/${APP_NAME}-linux-amd64 .

# Build for Linux (arm64)
echo "Building for Linux (arm64)..."
GOOS=linux GOARCH=arm64 go build -o $BUILD_DIR/${APP_NAME}-linux-arm64 .

echo "Build complete! Binaries are in the $BUILD_DIR directory:"
ls -la $BUILD_DIR/

echo ""
echo "Each binary is self-contained and includes the HTML template."
echo "You can distribute any of these binaries without additional files."
echo ""
echo "Usage: ./${APP_NAME}-<platform> <csv_file>"