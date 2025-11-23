# Fly.io Deployment Guide for ResolveAI 360

## ✅ Free Tier Available!

Fly.io offers a **free tier** with:
- **3 shared-cpu VMs** (256MB RAM each)
- **Apps don't sleep** (stay awake 24/7)
- **3GB persistent volume** storage
- **160GB outbound data transfer** per month
- Perfect for your ResolveAI 360 backend!

## Step 1: Install Fly CLI

**Windows:**
```powershell
# Using PowerShell
iwr https://fly.io/install.ps1 -useb | iex
```

**Or download from:** https://fly.io/docs/hands-on/install-flyctl/

**Verify installation:**
```bash
flyctl version
```

## Step 2: Sign Up / Login

```bash
flyctl auth signup
```

Or if you already have an account:
```bash
flyctl auth login
```

This will open a browser for authentication.

## Step 3: Initialize Fly.io App

```bash
cd c:\Users\RiddhiRainaPrasad\Downloads\ibm_watsonx
flyctl launch
```

This will:
- Ask for app name (or auto-generate one)
- Detect Node.js
- Create `fly.toml` configuration file
- Ask if you want to deploy now (say "no" for now)

## Step 4: Configure fly.toml

The `fly.toml` file will be created. Update it if needed:

```toml
app = "your-app-name"
primary_region = "iad"  # or your preferred region

[build]

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  memory_mb = 256
  cpu_kind = "shared"
  cpus = 1
```

## Step 5: Set Environment Variables

```bash
flyctl secrets set IBM_APIKEY=your_ibm_cloud_api_key
flyctl secrets set ORCHESTRATE_TOOL_KEY=XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct
flyctl secrets set NODE_ENV=production
flyctl secrets set PORT=8080
```

**View secrets:**
```bash
flyctl secrets list
```

## Step 6: Update server.js Port

Make sure your server uses the PORT environment variable (it already does):
```javascript
const PORT = process.env.PORT || 8080;
```

## Step 7: Deploy

```bash
flyctl deploy
```

This will:
- Build your app
- Deploy to Fly.io
- Give you a URL like: `https://your-app-name.fly.dev`

## Step 8: Get Your Backend URL

After deployment, your app URL will be:
```
https://your-app-name.fly.dev
```

**Get it via CLI:**
```bash
flyctl status
```

**Or check in dashboard:**
- Go to https://fly.io/dashboard
- Select your app
- See the URL in the overview

## Step 9: Verify Deployment

1. **Check app status:**
   ```bash
   flyctl status
   ```

2. **View logs:**
   ```bash
   flyctl logs
   ```

3. **Test health endpoint:**
   ```bash
   curl https://your-app-name.fly.dev/health
   ```

4. **Test a tool endpoint:**
   ```bash
   curl -X POST https://your-app-name.fly.dev/api/skills/create-ticket \
     -H "x-api-key: XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct" \
     -H "Content-Type: application/json" \
     -d '{"customer":{"id":"TEST"},"title":"Test","text":"Test","priority":"P3"}'
   ```

## Step 10: Update OpenAPI Spec

1. **Open** `tools/openapi-spec.json`
2. **Find** the `servers` section
3. **Replace** `"https://your-backend.com"` with your Fly.io URL:
   ```json
   "servers": [
     {
       "url": "https://your-app-name.fly.dev",
       "description": "Fly.io production server"
     }
   ]
   ```
4. **Save** and commit:
   ```bash
   git add tools/openapi-spec.json
   git commit -m "Update OpenAPI spec with Fly.io backend URL"
   git push
   ```

## Step 11: Upload to watsonx Orchestrate

1. Go to IBM watsonx Orchestrate UI
2. Tools → Create Tool → Upload `tools/openapi-spec.json`
3. Configure authentication: `x-api-key` = `XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct`

## Troubleshooting

### Deployment Fails
- **Check logs**: `flyctl logs`
- **Verify Node.js version**: Should be 18.x (in package.json)
- **Check fly.toml**: Ensure port matches your server

### App Not Accessible
- **Check status**: `flyctl status`
- **View logs**: `flyctl logs`
- **Restart app**: `flyctl apps restart your-app-name`

### 401 Unauthorized
- **Verify secrets**: `flyctl secrets list`
- **Check ORCHESTRATE_TOOL_KEY** matches in watsonx

## Free Tier Limits

- **3 shared-cpu VMs** (256MB RAM each)
- **3GB persistent volume** storage
- **160GB outbound data** per month
- **Apps stay awake** (no sleep!)

**If you exceed limits**, you'll be charged per-use. Monitor usage in dashboard.

## Useful Commands

```bash
# Deploy
flyctl deploy

# View logs
flyctl logs

# Check status
flyctl status

# Restart app
flyctl apps restart your-app-name

# View secrets
flyctl secrets list

# Set secret
flyctl secrets set KEY=value

# Open app in browser
flyctl open

# SSH into VM
flyctl ssh console
```

## Quick Reference

- **ORCHESTRATE_TOOL_KEY**: `XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct`
- **Fly.io Dashboard**: https://fly.io/dashboard
- **Documentation**: https://fly.io/docs

---

**Your backend will be free on Fly.io!** 🎉

