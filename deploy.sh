#!/bin/bash

# Build the project
echo "Building project..."
pip install -r requirements.txt

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
npx wrangler pages publish . --project-name codeium-quoting-tool
