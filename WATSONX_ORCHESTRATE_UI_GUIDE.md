# Using watsonx Orchestrate UI as Frontend

## Overview

**watsonx Orchestrate UI** is your complete frontend for managing and monitoring ResolveAI 360. You don't need a separate frontend - the Orchestrate UI provides everything you need!

## Accessing watsonx Orchestrate UI

### Step 1: Login to IBM Cloud

1. Go to: https://cloud.ibm.com
2. Login with your IBM Cloud account
3. Make sure you have **watsonx Orchestrate** enabled

### Step 2: Navigate to Orchestrate

1. In IBM Cloud dashboard, search for **"watsonx Orchestrate"**
2. Click on your watsonx Orchestrate instance
3. Click **"Launch Orchestrate"** or **"Open Orchestrate UI"**

**Direct URL format:**
```
https://dataplatform.cloud.ibm.com/orchestrate
```

---

## Orchestrate UI Components

The Orchestrate UI has several sections that act as your "frontend":

### 1. **Tools** (Your Backend Endpoints)

**Location:** Left sidebar → **Tools**

**What you can do:**
- View all your backend tools
- Test tool connections
- See tool execution history
- Monitor tool performance

**How to use:**
1. Click **"Tools"** in sidebar
2. See list of all tools (CreateTicket, PostSocial, etc.)
3. Click on a tool to:
   - View configuration
   - Test the tool
   - See execution logs
   - Check response times

---

### 2. **Skills** (AI Models)

**Location:** Left sidebar → **Skills**

**What you can do:**
- Create AI skills (CrisisDetector, TriageClassifier, etc.)
- Configure prompts
- Test AI responses
- Monitor AI performance

**How to use:**
1. Click **"Skills"** → **"Create Skill"**
2. Choose **"AI Skill"**
3. Paste your prompt from `prompts/` directory
4. Configure model (Granite-3.1)
5. Test with sample inputs
6. Save

**Example - Creating CrisisDetector:**
```
1. Skills → Create Skill → AI Skill
2. Name: "CrisisDetector"
3. System Prompt: (copy from prompts/crisis-detector-prompt.md)
4. User Prompt Template: "Message: {{text}}\nChannel: {{channel}}"
5. Model: Granite-3.1
6. Temperature: 0.1
7. Max Tokens: 256
8. Output Format: JSON
9. Test with: {"text": "Is IBM cloud down?", "channel": "twitter"}
10. Save
```

---

### 3. **Flows** (Your Workflows)

**Location:** Left sidebar → **Flows**

**What you can do:**
- Create and edit workflows
- Visual flow designer
- Test flows
- Monitor flow executions
- View execution history

**How to use:**

#### Create a Flow:
1. Click **"Flows"** → **"Create Flow"**
2. Name: "RealTimeCrisisFlow"
3. Choose trigger type: **Webhook**
4. Use **Flow Designer** to:
   - Drag and drop skills
   - Connect tools
   - Add decision nodes
   - Configure branches

#### Visual Flow Designer:
```
┌─────────────┐
│  Webhook    │ (Trigger)
│   Input     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Crisis      │ (AI Skill)
│ Detector    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Decision   │ (If crisis?)
│   Node      │
└──┬──────┬───┘
   │      │
   ▼      ▼
High    Low
Severity Severity
```

#### Test a Flow:
1. Click on your flow
2. Click **"Test"** or **"Run"**
3. Enter test payload:
   ```json
   {
     "text": "Is IBM cloud down?",
     "channel": "twitter",
     "metadata": {"retweets": 120}
   }
   ```
4. Watch the flow execute step-by-step
5. See results and outputs

---

### 4. **Executions** (Monitoring & Logs)

**Location:** Left sidebar → **Executions** or **Runs**

**What you can do:**
- View all flow executions
- See real-time execution status
- Check execution logs
- Debug failed executions
- View execution history

**How to use:**
1. Click **"Executions"** or **"Runs"**
2. See list of all flow runs
3. Filter by:
   - Status (Success, Failed, Running)
   - Flow name
   - Date range
4. Click on an execution to:
   - See step-by-step execution
   - View inputs/outputs at each step
   - Check error messages
   - See execution time

**Example View:**
```
Execution #12345 - RealTimeCrisisFlow
Status: ✅ Success
Duration: 2.3s
Steps:
  ✅ CrisisDetector (0.5s)
  ✅ TriageClassifier (0.4s)
  ✅ ResponseComposer (0.6s)
  ✅ GovernanceAuditor (0.3s)
  ✅ CreateTicket (0.5s)
```

---

### 5. **Agents** (Optional - For Chat Interfaces)

**Location:** Left sidebar → **Agents**

**What you can do:**
- Create AI agents
- Configure agent behavior
- Connect agents to flows
- Use agents in chat interfaces

**For ResolveAI 360:**
- You can create an agent that uses your flows
- Agent can handle customer interactions
- Agent triggers your crisis detection flows

---

## Using Orchestrate UI as Your Frontend

### Dashboard View

**Main Dashboard shows:**
- Recent executions
- Flow performance metrics
- Tool usage statistics
- Error rates
- Success rates

### Real-Time Monitoring

1. **Open Executions tab**
2. See flows running in real-time
3. Watch step-by-step execution
4. Monitor for errors

### Testing Your System

1. **Go to Flows**
2. Select your flow (e.g., RealTimeCrisisFlow)
3. Click **"Test"** or **"Run"**
4. Enter test payload
5. Watch execution
6. See results

### Configuration Management

1. **Tools tab:** Manage all backend endpoints
2. **Skills tab:** Configure AI models and prompts
3. **Flows tab:** Design and edit workflows
4. **Settings:** Configure webhooks, secrets, etc.

---

## Step-by-Step: Setting Up ResolveAI 360 in Orchestrate UI

### Phase 1: Create Tools

1. **Tools** → **Create Tool**
2. Upload `tools/openapi-spec.json`
3. Configure each tool:
   - Set endpoint URL (your Fly.io backend)
   - Set authentication (`x-api-key` header)
   - Test connection
4. Save

### Phase 2: Create AI Skills

1. **Skills** → **Create Skill** → **AI Skill**
2. For each skill in `prompts/`:
   - Copy system prompt
   - Configure model settings
   - Test with examples
   - Save

**Skills to create:**
- CrisisDetector
- TriageClassifier
- ResponseComposer
- SentimentMonitor
- GovernanceAuditor

### Phase 3: Create Flows

1. **Flows** → **Create Flow**
2. Use Flow Designer:
   - Add trigger (Webhook)
   - Add AI skills
   - Add tools
   - Add decision nodes
   - Connect everything
3. Test the flow
4. Save

### Phase 4: Monitor & Test

1. **Executions** tab: Watch flow runs
2. **Test flows** with sample payloads
3. **Check logs** for errors
4. **View metrics** on dashboard

---

## Example: Testing Crisis Detection

### Step 1: Open Flow
1. Go to **Flows**
2. Click on **RealTimeCrisisFlow**

### Step 2: Test Flow
1. Click **"Test"** or **"Run"**
2. Enter payload:
   ```json
   {
     "text": "Is IBM cloud down? Can't access my bucket!",
     "channel": "twitter",
     "metadata": {
       "retweets": 150,
       "mentions": ["#ibmclouddown"]
     }
   }
   ```

### Step 3: Watch Execution
- See CrisisDetector run
- See TriageClassifier classify
- See ResponseComposer generate response
- See GovernanceAuditor validate
- See CreateTicket tool execute
- See final result

### Step 4: View Results
- Check if crisis was detected
- See priority assigned
- View generated response
- See ticket created
- Check governance verdict

---

## Advanced Features

### 1. **Webhooks** (Trigger Flows from External Systems)

**Location:** Flow settings → Triggers

**How to use:**
1. Create a flow with webhook trigger
2. Copy the webhook URL
3. Use it in your external systems:
   ```bash
   curl -X POST https://your-webhook-url \
     -H "Content-Type: application/json" \
     -d '{"text": "Crisis detected!", "channel": "twitter"}'
   ```

### 2. **Secrets Management**

**Location:** Settings → Secrets

**How to use:**
1. Store sensitive values (API keys, tokens)
2. Reference in flows: `{{secret.ORCHESTRATE_TOOL_KEY}}`
3. Keep credentials secure

### 3. **Scheduled Flows** (Cron Jobs)

**Location:** Flow settings → Triggers → Schedule

**How to use:**
1. Create flow with schedule trigger
2. Set cron expression: `*/5 * * * *` (every 5 minutes)
3. Flow runs automatically
4. Perfect for SocialScanScheduler

### 4. **Flow Templates**

**Location:** Flows → Templates

**How to use:**
1. Save your flows as templates
2. Reuse for similar workflows
3. Share with team

---

## Tips & Best Practices

### 1. **Organize with Tags**
- Tag flows by category
- Tag tools by function
- Easy filtering

### 2. **Use Variables**
- Store common values as variables
- Reference in multiple places
- Easy updates

### 3. **Test Frequently**
- Test each skill individually
- Test tools separately
- Test complete flows
- Catch errors early

### 4. **Monitor Executions**
- Check execution logs regularly
- Watch for errors
- Monitor performance
- Optimize slow steps

### 5. **Version Control**
- Save flow versions
- Test changes before deploying
- Rollback if needed

---

## Troubleshooting

### Flow Not Executing
- Check trigger configuration
- Verify webhook URL is accessible
- Check execution logs

### Tool Connection Failed
- Verify backend URL is correct
- Check authentication header
- Test tool endpoint directly

### AI Skill Not Working
- Check model availability
- Verify prompt format
- Check output format (JSON)
- Review skill logs

### Execution Failed
- Check execution logs
- See which step failed
- Verify inputs/outputs
- Check error messages

---

## Summary

**watsonx Orchestrate UI IS your frontend!** It provides:

✅ **Configuration UI** - Set up tools, skills, flows
✅ **Visual Flow Designer** - Build workflows visually
✅ **Testing Interface** - Test everything in UI
✅ **Monitoring Dashboard** - Real-time execution monitoring
✅ **Execution Logs** - Debug and troubleshoot
✅ **Metrics & Analytics** - Performance insights

**You don't need a separate frontend** - Orchestrate UI has everything you need for managing and monitoring ResolveAI 360!

---

## Quick Reference

- **Access:** https://cloud.ibm.com → watsonx Orchestrate → Launch
- **Tools:** Configure backend endpoints
- **Skills:** Create AI models
- **Flows:** Build workflows
- **Executions:** Monitor and debug
- **Dashboard:** Overview and metrics

**Start using it now!** 🚀

