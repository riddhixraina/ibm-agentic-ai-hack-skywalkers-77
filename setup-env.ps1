# PowerShell script to set up .env file with generated ORCHESTRATE_TOOL_KEY

Write-Host "Setting up ResolveAI 360 environment..." -ForegroundColor Cyan

# Generate a random key (64 characters)
$key = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host ""
Write-Host "Generated ORCHESTRATE_TOOL_KEY: $key" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (Test-Path .env) {
    Write-Host ".env file already exists. Updating ORCHESTRATE_TOOL_KEY..." -ForegroundColor Yellow
    $content = Get-Content .env
    $updated = $content | ForEach-Object {
        if ($_ -match "^ORCHESTRATE_TOOL_KEY=") {
            "ORCHESTRATE_TOOL_KEY=$key"
        } else {
            $_
        }
    }
    # If key doesn't exist, add it
    if ($content -notmatch "ORCHESTRATE_TOOL_KEY=") {
        $updated += "ORCHESTRATE_TOOL_KEY=$key"
    }
    $updated | Set-Content .env
} else {
    Write-Host "Creating new .env file..." -ForegroundColor Cyan
    $envContent = @"
# IBM watsonx Configuration
IBM_APIKEY=your_ibm_cloud_api_key_here
IBM_REGION=us-south
IBM_RESOURCE_CRN=your_watsonx_resource_crn_here

# Orchestrate Configuration
ORCHESTRATE_TOOL_KEY=$key
ORCHESTRATE_FLOW_ID=your_flow_id_after_creating_in_orchestrate

# Server Configuration
PORT=8080
NODE_ENV=development
"@
    $envContent | Set-Content .env
}

Write-Host ""
Write-Host ".env file ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env and add your IBM_APIKEY" -ForegroundColor White
Write-Host "2. Save this ORCHESTRATE_TOOL_KEY - you'll need it in watsonx:" -ForegroundColor White
Write-Host "   $key" -ForegroundColor Yellow
Write-Host "3. Deploy to IBM Cloud or Railway" -ForegroundColor White
Write-Host ""
