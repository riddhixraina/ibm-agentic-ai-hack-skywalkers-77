#!/bin/bash
# IBM Code Engine Deployment Script for ResolveAI 360

echo "🚀 Deploying ResolveAI 360 to IBM Code Engine..."

# Check if logged in
if ! ibmcloud account show &> /dev/null; then
    echo "❌ Not logged in to IBM Cloud. Please run: ibmcloud login"
    exit 1
fi

# Set variables
PROJECT_NAME="resolveai360"
APP_NAME="resolveai360-backend"
REGION="us-south"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

# Source .env to get variables
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$IBM_APIKEY" ]; then
    echo "❌ IBM_APIKEY not set in .env"
    exit 1
fi

if [ -z "$ORCHESTRATE_TOOL_KEY" ]; then
    echo "❌ ORCHESTRATE_TOOL_KEY not set in .env"
    exit 1
fi

# Target region
echo "📍 Targeting region: $REGION"
ibmcloud target -r $REGION

# Create or select project
echo "📦 Creating/selecting project: $PROJECT_NAME"
ibmcloud ce project create --name $PROJECT_NAME 2>/dev/null || ibmcloud ce project select --name $PROJECT_NAME

# Deploy application
echo "🚀 Deploying application: $APP_NAME"
ibmcloud ce app create \
  --name $APP_NAME \
  --source . \
  --env IBM_APIKEY="$IBM_APIKEY" \
  --env ORCHESTRATE_TOOL_KEY="$ORCHESTRATE_TOOL_KEY" \
  --env PORT=8080 \
  --env NODE_ENV=production \
  --min-scale 1 \
  --max-scale 1 \
  --cpu 0.25 \
  --memory 0.5G

# Get the URL
echo ""
echo "✅ Deployment complete!"
echo "📋 Getting application URL..."
ibmcloud ce app get --name $APP_NAME --output json | grep -A 1 '"url"' | head -2

echo ""
echo "📝 Next steps:"
echo "1. Copy the URL above"
echo "2. Update tools/openapi-spec.json with this URL"
echo "3. Upload to watsonx Orchestrate"

