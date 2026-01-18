#!/bin/bash
set -e

echo "Starting SETUP..."

# 1. Build Java WASM
echo "Building Java WASM module..."
cd java-wasm
mvn clean package -Pnative
cd ..

# 2. Verify Sources
JAVA_TARGET="java-wasm/target"
echo "Checking build artifacts in $JAVA_TARGET..."
ls -l "$JAVA_TARGET/mathutils.js" "$JAVA_TARGET/mathutils.js.wasm" || { echo "Build Failed: specific files not found"; exit 1; }

# 3. Copy to React App
echo "Copying to react-app/public..."
mkdir -p react-app/public
cp "$JAVA_TARGET/mathutils.js" react-app/public/mathutils.js
cp "$JAVA_TARGET/mathutils.js.wasm" react-app/public/mathutils.js.wasm

# 4. Verify Destination
echo "Verifying react-app/public content:"
ls -l react-app/public/mathutils*

echo "Done! Please start the app with: cd react-app && npm run dev"
