# watsonx Orchestrate Setup Guide

## Your Backend URL
**https://ibm-agentic-ai-hack-skywalkers-77.vercel.app**

---

## Step 1: Create Tools in Orchestrate

### Option A: Upload OpenAPI Spec (Recommended)

1. **Go to watsonx Orchestrate UI**
   - Navigate to: https://cloud.ibm.com → watsonx Orchestrate → Launch

2. **Create Tool from OpenAPI**
   - Click **"Tools"** in left sidebar
   - Click **"Create Tool"**
   - Choose **"Create with OpenAI"** or **"Import OpenAPI"**
   - **Upload** `tools/openapi-spec.json` (already updated with your Vercel URL)

3. **Configure Each Tool**
   - Orchestrate will parse the OpenAPI spec and show all 6 endpoints
   - For each endpoint you want to use:
     - **Select the endpoint**
     - **Verify URL** is correct: `https://ibm-agentic-ai-hack-skywalkers-77.vercel.app/api/skills/...`
     - **Set Authentication:**
       - Header: `x-api-key`
       - Value: `XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct`
       - Store as secret in Orchestrate
     - **Test Connection** - Click "Test" to verify it works
     - **Save**

### Option B: Create Tools Manually

If OpenAPI upload doesn't work, create each tool manually:

#### Tool 1: CreateTicket
- **Name:** CreateTicket
- **Type:** HTTP Tool
- **Method:** POST
- **URL:** `https://ibm-agentic-ai-hack-skywalkers-77.vercel.app/api/skills/create-ticket`
- **Headers:**
  - `x-api-key`: `XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct`
  - `Content-Type`: `application/json`
- **Body:** JSON with `customer`, `title`, `text`, `priority`
- **Test** and **Save**

#### Tool 2: PostSocial
- **Name:** PostSocial
- **Type:** HTTP Tool
- **Method:** POST
- **URL:** `https://ibm-agentic-ai-hack-skywalkers-77.vercel.app/api/skills/post-social`
- **Headers:** Same as above
- **Body:** JSON with `channel`, `message`, `dry_run` (optional)
- **Test** and **Save**

#### Tool 3: NotifyOps
- **Name:** NotifyOps
- **Type:** HTTP Tool
- **Method:** POST
- **URL:** `https://ibm-agentic-ai-hack-skywalkers-77.vercel.app/api/skills/notify-ops`
- **Headers:** Same as above
- **Body:** JSON with `priority`, `incident_id`, `summary`, `links`
- **Test** and **Save**

#### Tool 4: FetchKB
- **Name:** FetchKB
- **Type:** HTTP Tool
- **Method:** GET
- **URL:** `https://ibm-agentic-ai-hack-skywalkers-77.vercel.app/api/skills/kb-search?q={{query}}`
- **Headers:** `x-api-key` (same as above)
- **Test** and **Save**

#### Tool 5: IngestEvent
- **Name:** IngestEvent
- **Type:** HTTP Tool
- **Method:** POST
- **URL:** `https://ibm-agentic-ai-hack-skywalkers-77.vercel.app/api/skills/ingest-event`
- **Headers:** Same as above
- **Body:** JSON with `event_type`, `data`, `metadata`
- **Test** and **Save**

#### Tool 6: SocialMediaMonitor
- **Name:** SocialMediaMonitor
- **Type:** HTTP Tool
- **Method:** GET
- **URL:** `https://ibm-agentic-ai-hack-skywalkers-77.vercel.app/api/skills/social-monitor?platform={{platform}}&keywords={{keywords}}`
- **Headers:** `x-api-key` (same as above)
- **Test** and **Save**

---

## Step 2: Create AI Skills

### Skill 1: CrisisDetector

1. **Skills** → **Create Skill** → **AI Skill**
2. **Name:** CrisisDetector
3. **System Prompt:** (Copy from `prompts/crisis-detector-prompt.md`)
   ```
   You are CrisisDetector, an expert AI system that analyzes customer messages to detect company-level crises. Given an incoming customer message and metadata, determine if it signals a crisis (outage, safety, PR, billing, security) and explain why.

   CRITICAL: Return STRICT JSON only with these exact keys:
   - is_crisis: boolean (true|false)
   - crisis_score: number (0.0-1.0)
   - crisis_type: string ("outage"|"safety"|"PR"|"billing"|"security"|"other")
   - reason: string (2-3 short bullets explaining evidence)

   Be conservative: Label is_crisis as true only when you have high confidence (score >= 0.7).
   ```
4. **User Prompt Template:**
   ```
   Message: "{{text}}"
   Channel: {{channel}}
   Metadata: {{metadata}}
   ```
5. **Model Settings:**
   - Model: **Granite-3.1**
   - Temperature: **0.1**
   - Max Tokens: **256**
   - Output Format: **JSON**
6. **Test** with:
   ```json
   {
     "text": "Is IBM cloud down?",
     "channel": "twitter",
     "metadata": {"retweets": 120}
   }
   ```
7. **Save**

### Skill 2: TriageClassifier

1. **Create Skill:** TriageClassifier
2. **System Prompt:** (Copy from `prompts/triage-classifier-prompt.md`)
   ```
   You are TriageClassifier, an expert system that prioritizes customer issues and determines appropriate actions. Given message text, crisis type, crisis score, and SLA policy, output JSON with:
   - priority: string ("P1"|"P2"|"P3")
   - suggested_template_id: string (e.g., "TEMPLATE_XXX")
   - required_actions: array of strings (e.g., ["create_ticket", "post_social", "notify_ops"])
   - fields: object (additional context fields)

   Priority Guidelines:
   - P1: Immediate ops escalation + social response (crisis_score >= 0.7)
   - P2: Next-hour support follow-up (crisis_score 0.4-0.69)
   - P3: Normal queue (crisis_score < 0.4)
   ```
3. **User Prompt Template:**
   ```
   text="{{text}}"
   crisis_type={{crisis_type}}
   crisis_score={{crisis_score}}
   sla_policy={{sla_policy}}
   ```
4. **Model:** Granite-3.1, Temp: 0.1, Max Tokens: 200
5. **Save**

### Skill 3: ResponseComposer

1. **Create Skill:** ResponseComposer
2. **System Prompt:** (Copy from `prompts/response-composer-prompt.md`)
   ```
   You are ResponseComposer, an expert at crafting empathetic, channel-appropriate customer responses. Using template_id and custom_fields, generate a concise, empathetic response appropriate for the specified channel and language.

   CRITICAL RULES:
   - Do NOT promise anything not verified
   - Keep under 280 characters for Twitter/X
   - Be empathetic but factual
   - Match channel tone (Twitter = concise, Email = formal, Chat = friendly)
   - Return STRICT JSON: {"message": "...", "tone": "empathetic|formal|concise", "sendable": true|false}
   ```
3. **User Prompt Template:**
   ```
   template_id={{template_id}}
   channel={{channel}}
   fields={{custom_fields}}
   language={{language}}
   ```
4. **Model:** Granite-3.1, Temp: 0.35, Max Tokens: 220
5. **Save**

### Skill 4: SentimentMonitor

1. **Create Skill:** SentimentMonitor
2. **System Prompt:** (Copy from `prompts/sentiment-monitor-prompt.md`)
   ```
   You are SentimentMonitor, an expert at analyzing customer sentiment and detecting emotional distress. For the input text, return JSON with:
   - sentiment: string ("positive"|"neutral"|"negative")
   - emotion_score: number (0.0-1.0, where 1.0 = most intense)
   - distress_flag: boolean (true if language suggests high emotional distress, panic, threats, or self-harm signals)
   ```
3. **User Prompt Template:**
   ```
   text="{{text}}"
   channel={{channel}}
   timestamp={{timestamp}}
   ```
4. **Model:** Granite-3.1, Temp: 0.0, Max Tokens: 100
5. **Save**

### Skill 5: GovernanceAuditor

1. **Create Skill:** GovernanceAuditor
2. **System Prompt:** (Copy from `prompts/governance-auditor-prompt.md`)
   ```
   You are GovernanceAuditor, a compliance and safety expert that validates automated replies and actions. Evaluate planned_actions and reply_text for:
   1. Hallucination: Unsupported claims or promises not backed by evidence
   2. PII Leakage: Personal information exposed inappropriately
   3. Policy Violations: Tone, content, or actions that violate company policy
   4. Inappropriate Tone: Unprofessional, offensive, or insensitive language

   Return JSON: {"verdict": "APPROVE"|"REVIEW_REQUIRED"|"BLOCK", "reasons": [...], "confidence": 0.0-1.0}
   ```
3. **User Prompt Template:**
   ```
   planned_actions={{planned_actions}}
   reply_text="{{reply_text}}"
   evidence={{evidence}}
   model_versions={{model_versions}}
   ```
4. **Model:** Granite-3.1, Temp: 0.0, Max Tokens: 200
5. **Save**

---

## Step 3: Create Flow (RealTimeCrisisFlow)

1. **Flows** → **Create Flow**
2. **Name:** RealTimeCrisisFlow
3. **Trigger:** Webhook (POST)
4. **Copy the webhook URL** (you'll need this later)

### Build the Flow:

**Step 1: CrisisDetector**
- Add AI Skill: CrisisDetector
- Inputs: `{{input.text}}`, `{{input.channel}}`, `{{input.metadata}}`
- Outputs: `is_crisis`, `crisis_score`, `crisis_type`, `reason`

**Step 2: Decision Node**
- Condition: `{{crisis_detector.is_crisis}} == true && {{crisis_detector.crisis_score}} >= 0.7`
- True → HighSeverityBranch
- False → LowSeverityBranch

**HighSeverityBranch:**
- **Step 3:** TriageClassifier (AI Skill)
  - Inputs: `{{input.text}}`, `{{crisis_detector.crisis_type}}`, `{{crisis_detector.crisis_score}}`
- **Step 4:** ResponseComposer (AI Skill)
  - Inputs: `{{triage.suggested_template_id}}`, `{{input.channel}}`, `{{triage.fields}}`
- **Step 5:** GovernanceAuditor (AI Skill)
  - Inputs: `{{triage.required_actions}}`, `{{response.message}}`, `{{crisis_detector}}`
- **Step 6:** Decision (Governance verdict)
  - If APPROVE → Execute Actions
  - If REVIEW_REQUIRED → Human Review
  - If BLOCK → Log and Create Internal Ticket
- **Step 7:** Execute Actions (Loop)
  - For each action in `{{triage.required_actions}}`:
    - If "create_ticket" → Call CreateTicket tool
    - If "post_social" → Call PostSocial tool
    - If "notify_ops" → Call NotifyOps tool
- **Step 8:** IngestEvent tool

**LowSeverityBranch:**
- **Step 3:** FetchKB tool
- **Step 4:** Decision (KB matched?)
  - If matched → ResponseComposer → Send reply
  - If not → CreateTicket (P3)
- **Step 5:** IngestEvent tool

5. **Save** the flow
6. **Note the Flow ID** (you'll need it for `ORCHESTRATE_FLOW_ID`)

---

## Step 4: Configure Callback URL

1. **In your flow settings**, find **"Callbacks"** or **"Webhooks"**
2. **Set callback URL:**
   ```
   https://ibm-agentic-ai-hack-skywalkers-77.vercel.app/api/orchestrate/callback
   ```
3. **Save**

This allows Orchestrate to send execution updates to your backend.

---

## Step 5: Test the Flow

1. **Go to your flow** (RealTimeCrisisFlow)
2. **Click "Test"** or **"Run"**
3. **Enter test payload:**
   ```json
   {
     "text": "Is IBM cloud down? can't access my bucket since 10:05. many people complaining #ibmclouddown",
     "channel": "twitter",
     "metadata": {
       "retweets": 120,
       "mentions": ["#ibmclouddown"],
       "timestamp": "2025-11-20T10:08:00Z"
     }
   }
   ```
4. **Watch the flow execute:**
   - CrisisDetector runs → detects crisis
   - TriageClassifier runs → assigns P1 priority
   - ResponseComposer runs → generates response
   - GovernanceAuditor runs → validates response
   - Tools execute → CreateTicket, PostSocial, NotifyOps
5. **Check execution results** in Orchestrate UI

---

## Step 6: Update Backend Environment Variable

After creating the flow, update your Vercel environment variables:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add/Update:**
   - `ORCHESTRATE_FLOW_ID` = (your flow ID from Step 3)

---

## Quick Reference

### Backend URL
```
https://ibm-agentic-ai-hack-skywalkers-77.vercel.app
```

### Tool Endpoints
- CreateTicket: `POST /api/skills/create-ticket`
- PostSocial: `POST /api/skills/post-social`
- NotifyOps: `POST /api/skills/notify-ops`
- FetchKB: `GET /api/skills/kb-search?q=query`
- IngestEvent: `POST /api/skills/ingest-event`
- SocialMonitor: `GET /api/skills/social-monitor`

### Authentication
- Header: `x-api-key`
- Value: `XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct`

### Callback URL
```
https://ibm-agentic-ai-hack-skywalkers-77.vercel.app/api/orchestrate/callback
```

---

## Testing Checklist

- [ ] All 6 tools created and tested
- [ ] All 5 AI skills created and tested
- [ ] Flow created and saved
- [ ] Callback URL configured
- [ ] Flow tested with sample payload
- [ ] Tools execute successfully
- [ ] Execution visible in Orchestrate UI

---

**You're ready to demo!** 🚀

