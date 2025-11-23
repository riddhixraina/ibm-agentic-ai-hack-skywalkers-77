# AI Skill Prompts for ResolveAI 360

This directory contains the system and user prompts for all AI skills used in ResolveAI 360.

## Skills Overview

1. **CrisisDetector** - Detects if incoming messages signal a crisis
2. **TriageClassifier** - Classifies priority and determines required actions
3. **ResponseComposer** - Generates empathetic, channel-appropriate responses
4. **SentimentMonitor** - Analyzes sentiment and detects customer distress
5. **GovernanceAuditor** - Validates responses for safety, compliance, and accuracy

## How to Use in IBM watsonx Orchestrate

1. **Create AI Skill** in Orchestrate UI
2. **Copy System Prompt** from the corresponding `.md` file
3. **Set User Prompt Template** with variables (e.g., `{{text}}`, `{{channel}}`)
4. **Configure Model Settings** as specified in each prompt file
5. **Set Output Format** to JSON
6. **Test** with the provided few-shot examples

## Model Recommendations

- **Classification Tasks** (CrisisDetector, TriageClassifier, SentimentMonitor, GovernanceAuditor):
  - Model: Granite-3.1
  - Temperature: 0.0-0.1 (low for consistency)
  
- **Generation Tasks** (ResponseComposer):
  - Model: Granite-3.1 or Llama3-Chat
  - Temperature: 0.3-0.5 (higher for creativity)

## Output Validation

All skills return JSON. Always validate:
- Required fields are present
- Data types match specifications
- Values are within expected ranges
- No PII leakage in outputs

