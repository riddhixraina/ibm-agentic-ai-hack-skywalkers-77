# Workflow Definitions for ResolveAI 360

This directory contains JSON workflow definitions for IBM watsonx Orchestrate flows.

## Flows Overview

### 1. RealTimeCrisisFlow
**Purpose**: Main flow that processes incoming customer messages and detects/responds to crises in real-time.

**Trigger**: HTTP Webhook (POST)

**Key Steps**:
- Crisis detection using CrisisDetector AI skill
- Priority classification and triage
- Response composition
- Governance validation
- Automated action execution (tickets, social posts, ops notifications)
- Event logging

**Branches**:
- High Severity: Full crisis response workflow
- Low Severity: KB search or ticket creation

### 2. SocialScanScheduler
**Purpose**: Periodically monitors social media platforms for emerging crises.

**Trigger**: Cron (every 5 minutes)

**Key Steps**:
- Fetch recent social media posts
- Run crisis detection on each post
- Trigger RealTimeCrisisFlow for detected crises
- Log scan results

### 3. HumanReviewFlow
**Purpose**: Handles human review requests when GovernanceAuditor flags content.

**Trigger**: HTTP Webhook (POST)

**Key Steps**:
- Create review ticket and notify ops
- Wait for human decision
- Resume or reject based on decision
- Log approval/rejection

## How to Import in Orchestrate

1. **Open Orchestrate UI** → Flows → Create Flow
2. **Use Flow Designer** to build the flow visually, OR
3. **Import JSON** (if supported) or manually recreate using these definitions
4. **Configure Triggers**:
   - Set webhook endpoints
   - Configure cron schedules
5. **Connect Tools**:
   - Link HTTP tools to your backend endpoints
   - Attach AI skills with prompts from `/prompts` directory
6. **Test** with sample payloads from `/test-payloads.json`

## Flow Dependencies

```
SocialScanScheduler
    └──> RealTimeCrisisFlow

RealTimeCrisisFlow
    ├──> HumanReviewFlow (if governance requires review)
    └──> Tools (CreateTicket, PostSocial, NotifyOps, etc.)

HumanReviewFlow
    └──> RealTimeCrisisFlow (resume on approval)
```

## Variables Reference

- `{{input.*}}` - Input from trigger
- `{{crisis_detector.*}}` - Output from CrisisDetector skill
- `{{triage.*}}` - Output from TriageClassifier skill
- `{{response.*}}` - Output from ResponseComposer skill
- `{{governance.*}}` - Output from GovernanceAuditor skill
- `{{kb.*}}` - Output from FetchKB tool
- `{{social_posts.*}}` - Output from SocialMediaMonitor tool

## Notes

- All flows should log events using `IngestEvent` tool
- Governance checks are mandatory for all automated responses
- Human review is triggered when `verdict == "REVIEW_REQUIRED"`
- Timeouts should be configured appropriately (default: 3600 seconds)

