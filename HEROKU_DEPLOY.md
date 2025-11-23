# Heroku Deployment Guide for ResolveAI 360

## ✅ Code Already on GitHub
Your code is at: https://github.com/riddhixraina/ibm-agentic-ai-hack-skywalkers-77.git

## Step 1: Install Heroku CLI

**Windows:**
1. Download installer: https://devcenter.heroku.com/articles/heroku-cli
2. Or use winget:
   ```powershell
   winget install Heroku.CLI
   ```

**Or use npm:**
```bash
npm install -g heroku
```

## Step 2: Login to Heroku

```bash
heroku login
```
This will open a browser window for authentication.

## Step 3: Create Heroku App

```bash
cd c:\Users\RiddhiRainaPrasad\Downloads\ibm_watsonx
heroku create resolveai360-backend
```

Or create with a specific name:
```bash
heroku create your-app-name
```

**Note:** App names must be unique. If `resolveai360-backend` is taken, try:
- `resolveai360-riddhi`
- `resolveai360-skywalkers`
- `your-unique-name`

## Step 4: Set Environment Variables

Set all required environment variables:

```bash
heroku config:set IBM_APIKEY=your_ibm_cloud_api_key
heroku config:set ORCHESTRATE_TOOL_KEY=XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct
heroku config:set NODE_ENV=production
```

**Or set all at once:**
```bash
heroku config:set IBM_APIKEY=your_key ORCHESTRATE_TOOL_KEY=XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct NODE_ENV=production
```

## Step 5: Deploy to Heroku

**Option A: Deploy from GitHub (Recommended)**

1. **Go to Heroku Dashboard**: https://dashboard.heroku.com
2. **Select your app**
3. **Go to "Deploy" tab**
4. **Under "Deployment method"**, select **"GitHub"**
5. **Connect your GitHub account** (if not already connected)
6. **Search for repository**: `riddhixraina/ibm-agentic-ai-hack-skywalkers-77`
7. **Click "Connect"**
8. **Enable "Automatic deploys"** (optional - auto-deploys on push to main)
9. **Click "Deploy Branch"** → Select `main` branch
10. **Wait for deployment** to complete

**Option B: Deploy via CLI (Git)**

```bash
# Add Heroku remote
heroku git:remote -a your-app-name

# Deploy
git push heroku main
```

## Step 6: Get Your Backend URL

After deployment, your app URL will be:
```
https://your-app-name.herokuapp.com
```

**Get it via CLI:**
```bash
heroku info
```

**Or check in Dashboard:**
- Go to your app → Settings → Domains

**This is your backend URL!** 🎉

## Step 7: Verify Deployment

1. **Check app status:**
   ```bash
   heroku ps
   ```

2. **View logs:**
   ```bash
   heroku logs --tail
   ```

3. **Test health endpoint:**
   ```bash
   curl https://your-app-name.herokuapp.com/health
   ```
   Should return: `{"status":"ok","service":"ResolveAI 360",...}`

4. **Test a tool endpoint:**
   ```bash
   curl -X POST https://your-app-name.herokuapp.com/api/skills/create-ticket \
     -H "x-api-key: XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct" \
     -H "Content-Type: application/json" \
     -d '{"customer":{"id":"TEST"},"title":"Test","text":"Test","priority":"P3"}'
   ```

## Step 8: Update OpenAPI Spec

1. **Open** `tools/openapi-spec.json`
2. **Find** the `servers` section (around line 8):
   ```json
   "servers": [
     {
       "url": "https://your-backend.com",
       "description": "Production server (update with your backend URL)"
     }
   ]
   ```
3. **Replace** `"https://your-backend.com"` with your Heroku URL:
   ```json
   "servers": [
     {
       "url": "https://your-app-name.herokuapp.com",
       "description": "Heroku production server"
     }
   ]
   ```
4. **Save** the file
5. **Commit and push** to GitHub:
   ```bash
   git add tools/openapi-spec.json
   git commit -m "Update OpenAPI spec with Heroku backend URL"
   git push
   ```

## Step 9: Upload to watsonx Orchestrate

1. **Go to IBM watsonx Orchestrate UI**
2. **Navigate to Tools → Create Tool**
3. **Choose "Create with OpenAI" or "Import OpenAPI"**
4. **Upload** `tools/openapi-spec.json` (with updated Heroku URL)
5. **For each tool**, configure:
   - **Authentication**: Header `x-api-key`
   - **Value**: `XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct`
   - Store as secret in Orchestrate
6. **Test** each tool connection

## Troubleshooting

### Deployment Fails
- **Check logs**: `heroku logs --tail`
- **Verify Procfile exists**: Should have `web: node server.js`
- **Check package.json**: Must have `"start": "node server.js"` script
- **Verify Node.js version**: Heroku auto-detects, but you can specify in `package.json`:
  ```json
  "engines": {
    "node": "18.x"
  }
  ```

### App Crashes
- **Check logs**: `heroku logs --tail`
- **Verify environment variables**: `heroku config`
- **Check if port is correct**: Heroku assigns `PORT` automatically, your code should use `process.env.PORT`

### 401 Unauthorized Errors
- **Verify** `ORCHESTRATE_TOOL_KEY` matches in:
  - Heroku config: `heroku config:get ORCHESTRATE_TOOL_KEY`
  - watsonx Orchestrate tool configuration
- **Check** the key is exactly: `XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct`

### App Not Accessible
- **Check app status**: `heroku ps`
- **Verify app is running**: Should show `web.1: up`
- **Check dyno hours**: Free tier has 550-1000 hours/month limit
- **Upgrade if needed**: Or use Eco dyno ($5/month)

## Heroku Free Tier Limits

- **550-1000 dyno hours/month** (shared across apps)
- **Apps sleep after 30 minutes** of inactivity (free tier)
- **Eco dyno** ($5/month): No sleep, 1000 hours/month

**To prevent sleeping** (if on free tier):
- Use a service like https://cron-job.org to ping your app every 20 minutes
- Or upgrade to Eco dyno

## Quick Commands Reference

```bash
# Login
heroku login

# Create app
heroku create app-name

# Set config vars
heroku config:set KEY=value

# View config vars
heroku config

# View logs
heroku logs --tail

# Check app status
heroku ps

# Open app in browser
heroku open

# Restart app
heroku restart

# Scale dynos (if needed)
heroku ps:scale web=1
```

## Quick Reference

- **GitHub Repo**: https://github.com/riddhixraina/ibm-agentic-ai-hack-skywalkers-77.git
- **ORCHESTRATE_TOOL_KEY**: `XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct`
- **Heroku Dashboard**: https://dashboard.heroku.com

## Next Steps After Deployment

1. ✅ Code pushed to GitHub
2. ✅ Deploy to Heroku (follow steps above)
3. ✅ Get Heroku backend URL
4. ✅ Update OpenAPI spec with Heroku URL
5. ✅ Upload OpenAPI spec to watsonx
6. ✅ Configure tools with authentication
7. ✅ Create AI skills in Orchestrate
8. ✅ Create flows in Orchestrate
9. ✅ Test the complete system!

---

**Need help?** Check Heroku logs with `heroku logs --tail` or visit Heroku support.

