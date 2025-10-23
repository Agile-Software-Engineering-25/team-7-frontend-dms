#!/bin/bash
# Migration script for shared-components v2.1.0
# ⚠️ Must be executed in Git Bash on Windows

set -e

echo "Updating @agile-software/shared-components to v2.1.0 in package.json..."
if grep -q '"@agile-software/shared-components":' package.json; then
  sed -i.bak 's|"@agile-software/shared-components": *"[^"]*"|"@agile-software/shared-components": "^2.1.0"|' package.json
  rm package.json.bak
  echo "Dependency updated."
else
  echo "Dependency @agile-software/shared-components not found in package.json."
fi

echo "Removing 'init' script from package.json..."
if grep -q '"init":' package.json; then
  sed -i.bak '/"init":/d' package.json
  rm package.json.bak
  echo "'init' script removed."
else
  echo "No 'init' script found in package.json."
fi

echo "Removing local shared-components directory..."
git config -f .gitmodules --remove-section submodule.shared-components || true
git config -f .git/config --remove-section submodule.shared-components || true
git stage .
git rm --cached shared-components || true
rm -rf shared-components

echo "Removing .gitmodules file..."
rm -f .gitmodules

echo "Removing script directory..."
rm -rf scripts

echo "Removing src/@types/agile-shared-components.d.ts if it exists..."
if [ -f "src/@types/agile-shared-components.d.ts" ]; then
  rm "src/@types/agile-shared-components.d.ts"
  echo "File deleted."
else
  echo "File not found, skipping."
fi

echo "Staging changes..."
git stage .

echo "Done. ✅"