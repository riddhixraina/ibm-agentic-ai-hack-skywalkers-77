# Tool Definitions for IBM watsonx Orchestrate

This directory contains tool definitions in OpenAI format for use with IBM watsonx Orchestrate.

## Files

- **`openapi-spec.json`** - OpenAPI 3.0 specification in JSON format ⭐ **USE THIS**
- **`openapi-spec.yaml`** - OpenAPI 3.0 specification in YAML format ⭐ **USE THIS**
- **`openai-tools.json`** - OpenAI function calling format (for reference, not for watsonx upload)
- **`openai-tools.yaml`** - OpenAI function calling format (for reference, not for watsonx upload)

**Important**: watsonx Orchestrate requires **OpenAPI 3.0 specification format**, not OpenAI function calling format. Use `openapi-spec.json` or `openapi-spec.yaml`.

## How to Use in watsonx Orchestrate

### Step 1: Create Tool with OpenAI

1. Open **IBM watsonx Orchestrate UI**
2. Navigate to **Tools** → **Create Tool**
3. Select **"Create with OpenAI"** option
4. You'll be prompted to upload a JSON or YAML file

### Step 2: Upload OpenAPI Specification

**Upload the OpenAPI spec file:**
- Upload `openapi-spec.json` or `openapi-spec.yaml`
- This defines all 6 API endpoints as HTTP operations (GET, POST)

**Before uploading:**
1. **Update the server URL** in the spec file:
   - Open `openapi-spec.json` or `openapi-spec.yaml`
   - Find the `servers` section
   - Replace `https://your-backend.com` with your actual backend URL
   - Example: `https://abc123.ngrok.io` (for testing) or `https://your-app.ibmcodeengine.app` (for production)

**Note**: The OpenAPI spec defines all endpoints in one file. watsonx will parse this and allow you to select which endpoints to create as tools.

### Step 3: Configure Tools After Upload

After uploading the OpenAPI spec, watsonx will parse it and show you the available endpoints. For each endpoint you want to use:

1. **Select the endpoint** from the parsed OpenAPI spec
2. **Tool Name**: watsonx will suggest a name based on the operationId (e.g., "createTicket")
3. **Endpoint URL**: Should be auto-filled from the OpenAPI spec, but verify it matches your backend
4. **Authentication**:
   - The spec defines `x-api-key` header authentication
   - In watsonx, configure the header value as your `ORCHESTRATE_TOOL_KEY`
   - Store the key as a secret in Orchestrate and reference it
5. **Test Connection**: Verify the tool can reach your backend
6. **Save**

**Note**: You may need to create each tool separately, or watsonx might allow you to create multiple tools from one OpenAPI spec. Follow the UI prompts.

## Tool List

| Tool Name | Endpoint | Method | Description |
|-----------|----------|--------|-------------|
| `create_ticket` | `/api/skills/create-ticket` | POST | Creates support tickets |
| `post_social` | `/api/skills/post-social` | POST | Posts to social media |
| `notify_ops` | `/api/skills/notify-ops` | POST | Notifies operations team |
| `fetch_kb` | `/api/skills/kb-search` | GET | Searches knowledge base |
| `ingest_event` | `/api/skills/ingest-event` | POST | Logs events |
| `social_monitor` | `/api/skills/social-monitor` | GET | Monitors social media |

## OpenAPI Format Reference

The OpenAPI 3.0 specification defines HTTP endpoints with:

- **Paths**: URL paths (e.g., `/api/skills/create-ticket`)
- **Methods**: HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **Request Bodies**: For POST/PUT requests
- **Parameters**: Query parameters, path parameters, headers
- **Responses**: Response schemas
- **Security**: Authentication schemes (API key in header)

Example endpoint definition:
```yaml
/api/skills/create-ticket:
  post:
    summary: Creates a support ticket
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateTicketRequest'
    responses:
      '200':
        description: Success
```

## Why OpenAPI Instead of OpenAI Format?

watsonx Orchestrate expects **OpenAPI 3.0** specification because:
- It defines actual HTTP endpoints (not just function signatures)
- It includes request/response schemas
- It supports authentication schemes
- It's the standard for API documentation and tooling

## Customization

To customize tools for your use case:

1. **Edit the JSON/YAML files** with your specific parameters
2. **Update descriptions** to match your domain
3. **Add/remove parameters** as needed
4. **Update endpoint URLs** to match your backend

## Testing

After creating tools in Orchestrate:

1. Use the **Test** button in Orchestrate UI
2. Or test directly from your backend:
```bash
curl -X POST https://your-backend.com/api/skills/create-ticket \
  -H 'x-api-key: your-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer": {"id": "TEST-001"},
    "title": "Test",
    "text": "Test ticket",
    "priority": "P3"
  }'
```

## Troubleshooting

### Tool not connecting
- Verify backend is accessible (HTTPS required)
- Check `x-api-key` header matches your secret
- Verify endpoint path is correct
- Check backend logs for errors

### Tool execution fails
- Verify request format matches tool definition
- Check parameter types match (string, number, object, array)
- Review backend error logs
- Test endpoint directly with curl/Postman

### Tool not appearing in flow
- Ensure tool is saved and published
- Check tool permissions
- Verify you're using the correct tool name in flows

---

For more details, see the main [README.md](../README.md) and [SETUP_GUIDE.md](../SETUP_GUIDE.md).

