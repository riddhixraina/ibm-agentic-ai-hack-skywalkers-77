// server.js - ResolveAI 360 Backend Server
// Handles all tool endpoints for IBM watsonx Orchestrate

import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io - optional (won't work on Vercel, but won't break the app)
let io = null;
try {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
} catch (error) {
  console.warn('Socket.io initialization failed (this is OK on Vercel):', error.message);
}

// Helper function to safely emit Socket.io events
function emitSocketEvent(event, data) {
  if (io) {
    io.emit(event, data);
  }
  // If Socket.io not available, events are still logged
  console.log(`[Event] ${event}:`, data);
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple x-api-key middleware for Orchestrate tool authentication
// Accepts multiple header name variations for compatibility
function requireApiKey(req, res, next) {
  // Log all headers for debugging (in production, remove sensitive data)
  const allHeaders = Object.keys(req.headers);
  const relevantHeaders = {};
  allHeaders.forEach(h => {
    const lower = h.toLowerCase();
    if (lower.includes('api') || lower.includes('auth') || lower.includes('key')) {
      relevantHeaders[h] = req.headers[h];
    }
  });
  console.log('🔐 Auth check - Relevant headers:', relevantHeaders);
  console.log('🔐 Auth check - All headers:', Object.keys(req.headers));
  
  // Try different header name variations (case-insensitive check)
  let key = null;
  const expectedKey = process.env.ORCHESTRATE_TOOL_KEY;
  
  // Check all possible header names (case-insensitive)
  for (const headerName of Object.keys(req.headers)) {
    const lowerName = headerName.toLowerCase();
    if (lowerName === 'x-api-key' || 
        lowerName === 'api-key' || 
        lowerName === 'x-apikey' ||
        lowerName === 'apikey') {
      key = req.headers[headerName];
      console.log(`🔑 Found API key in header: ${headerName}`);
      break;
    }
  }
  
  // Also check Authorization header
  if (!key && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('ApiKey ') || authHeader.startsWith('Bearer ')) {
      key = authHeader.replace('ApiKey ', '').replace('Bearer ', '');
      console.log(`🔑 Found API key in Authorization header`);
    } else if (authHeader === expectedKey) {
      key = authHeader;
      console.log(`🔑 Found API key as raw Authorization value`);
    }
  }
  
  if (!key) {
    console.error('❌ No API key found in request headers');
    console.error('Available headers:', Object.keys(req.headers));
    return res.status(401).json({ 
      error: 'unauthorized',
      message: 'API key not found in request headers',
      debug: process.env.NODE_ENV === 'development' ? { receivedHeaders: relevantHeaders } : undefined
    });
  }
  
  if (key !== expectedKey) {
    console.error('❌ API key mismatch');
    console.error('Expected:', expectedKey?.substring(0, 10) + '...');
    console.error('Received:', key?.substring(0, 10) + '...');
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid API key' });
  }
  
  console.log('✅ API key validated successfully');
  next();
}

// === IBM IAM helper ===
async function getIamToken() {
  try {
    const res = await axios.post(
      'https://iam.cloud.ibm.com/identity/token',
      new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: process.env.IBM_APIKEY
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return res.data.access_token;
  } catch (error) {
    console.error('IAM token error:', error.response?.data || error.message);
    throw error;
  }
}

// === Trigger Orchestrate flow ===
app.post('/api/trigger-flow', async (req, res) => {
  try {
    const token = await getIamToken();
    const flowId = process.env.ORCHESTRATE_FLOW_ID;
    const url = `https://api.ibm.com/watsonx/orchestrate/flows/${flowId}/run`;
    
    const response = await axios.post(
      url,
      { input: req.body },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return res.json(response.data);
  } catch (e) {
    console.error('Flow trigger error:', e.response?.data || e.message);
    return res.status(500).json({ error: 'flow trigger failed', details: e.message });
  }
});

// === Tool: CreateTicket ===
app.post('/api/skills/create-ticket', requireApiKey, async (req, res) => {
  const { customer, title, text, priority, attachments } = req.body;
  
  try {
    // For demo: create stub ticket or call Zendesk API
    // TODO: Integrate with actual Zendesk/Salesforce API
    const ticketId = 'TICK-' + crypto.randomBytes(4).toString('hex');
    const ticketUrl = `https://demo.zendesk.com/tickets/${ticketId}`;
    
    // Log ticket creation
    console.log(`[CreateTicket] Priority: ${priority}, Title: ${title}`);
    
    // Store in DB if required (TODO: add database integration)
    
    res.json({ 
      ticketId, 
      ticketUrl, 
      status: 'created',
      priority,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Ticket creation error:', err);
    res.status(500).json({ error: 'ticket creation failed', details: err.message });
  }
});

// === Tool: PostSocial ===
app.post('/api/skills/post-social', requireApiKey, async (req, res) => {
  const { channel, message, in_reply_to_id, attachments, dry_run } = req.body;
  
  try {
    if (dry_run) {
      console.log(`[PostSocial] DRY RUN - Channel: ${channel}, Message: ${message}`);
      return res.json({ postId: null, status: 'dry-run', message: 'Would post: ' + message });
    }
    
    // TODO: Integrate with Twitter/X API, Facebook API, etc.
    // For demo: generate stub post ID
    const postId = 'POST-' + crypto.randomBytes(4).toString('hex');
    
    console.log(`[PostSocial] Posted to ${channel}: ${message}`);
    
    return res.json({ 
      postId, 
      status: 'posted',
      channel,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Post social error:', err);
    res.status(500).json({ error: 'post social failed', details: err.message });
  }
});

// === Tool: NotifyOps ===
app.post('/api/skills/notify-ops', requireApiKey, async (req, res) => {
  const { priority, incident_id, summary, links } = req.body;
  
  try {
    // TODO: Call Slack, PagerDuty adapters here
    // For demo: emit socket event
    emitSocketEvent('opsNotification', { 
      priority, 
      incident_id, 
      summary, 
      links,
      timestamp: new Date().toISOString()
    });
    
    console.log(`[NotifyOps] Priority: ${priority}, Incident: ${incident_id}`);
    
    return res.json({ 
      notified: true, 
      channels: ['slack', 'pagerduty'],
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Notify ops error:', err);
    res.status(500).json({ error: 'notify ops failed', details: err.message });
  }
});

// === Tool: FetchKB (Knowledge Base Search) ===
app.get('/api/skills/kb-search', requireApiKey, async (req, res) => {
  const q = req.query.q || '';
  
  try {
    // TODO: Replace with real KB search (watsonx Discovery, Elasticsearch, etc.)
    // Simple in-memory KB search for demo
    const kbData = [
      { 
        id: 'KB1', 
        snippet: 'If you see 500 errors, try clearing cache and refreshing the page', 
        confidence: 0.6,
        category: 'troubleshooting'
      },
      {
        id: 'KB2',
        snippet: 'Storage bucket access issues: Check IAM permissions and bucket policy',
        confidence: 0.8,
        category: 'storage'
      },
      {
        id: 'KB3',
        snippet: 'Billing refunds are processed within 3-5 business days',
        confidence: 0.9,
        category: 'billing'
      },
      {
        id: 'KB4',
        snippet: 'Service outages are posted on status.example.com',
        confidence: 0.7,
        category: 'status'
      }
    ];
    
    const queryLower = q.toLowerCase();
    const snippets = kbData.filter(s => 
      s.snippet.toLowerCase().includes(queryLower) ||
      s.category.toLowerCase().includes(queryLower)
    );
    
    res.json({ 
      matched: snippets.length > 0, 
      top_snippets: snippets,
      query: q
    });
  } catch (err) {
    console.error('KB search error:', err);
    res.status(500).json({ error: 'kb search failed', details: err.message });
  }
});

// === Tool: IngestEvent (Event Logging) ===
app.post('/api/skills/ingest-event', requireApiKey, async (req, res) => {
  const event = req.body;
  
  try {
    // TODO: Store in database or object storage (watsonx.data, Cloud Object Storage, etc.)
    const eventId = 'EVT-' + crypto.randomBytes(4).toString('hex');
    
    // Push to dashboard via socket
    emitSocketEvent('newEvent', { eventId, event, timestamp: new Date().toISOString() });
    
    console.log(`[IngestEvent] Stored event: ${eventId}`);
    
    res.json({ stored: true, eventId, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Ingest event error:', err);
    res.status(500).json({ error: 'ingest event failed', details: err.message });
  }
});

// === Tool: SocialMediaMonitor ===
app.get('/api/skills/social-monitor', requireApiKey, async (req, res) => {
  const { platform, keywords, since } = req.query;
  
  try {
    // TODO: Integrate with Twitter/X API, Facebook API, etc.
    // For demo: return mock data
    const mockPosts = [
      {
        id: 'TWEET-001',
        text: 'Is IBM Cloud down? can\'t access my bucket since 10:05',
        platform: 'twitter',
        author: '@user123',
        timestamp: new Date().toISOString(),
        retweets: 120,
        mentions: ['#ibmclouddown']
      }
    ];
    
    res.json({ 
      posts: mockPosts,
      count: mockPosts.length,
      platform: platform || 'all'
    });
  } catch (err) {
    console.error('Social monitor error:', err);
    res.status(500).json({ error: 'social monitor failed', details: err.message });
  }
});

// === Orchestrate callback endpoint ===
app.post('/api/orchestrate/callback', async (req, res) => {
  // Orchestrate will post step updates here; broadcast to UI
  emitSocketEvent('flowUpdate', { ...req.body, timestamp: new Date().toISOString() });
  console.log('[Orchestrate Callback]', req.body);
  res.status(200).send('ok');
});

// === Get Orchestrate Executions ===
app.get('/api/executions', async (req, res) => {
  try {
    const token = await getIamToken();
    const { limit = 50, offset = 0, status, flowId } = req.query;
    
    // Build query params
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    if (status) params.append('status', status);
    if (flowId) params.append('flow_id', flowId);
    
    const url = `https://api.ibm.com/watsonx/orchestrate/executions?${params.toString()}`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return res.json(response.data);
  } catch (e) {
    console.error('Get executions error:', e.response?.data || e.message);
    return res.status(500).json({ error: 'failed to fetch executions', details: e.message });
  }
});

// === Get Specific Execution ===
app.get('/api/executions/:id', async (req, res) => {
  try {
    const token = await getIamToken();
    const executionId = req.params.id;
    const url = `https://api.ibm.com/watsonx/orchestrate/executions/${executionId}`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return res.json(response.data);
  } catch (e) {
    console.error('Get execution error:', e.response?.data || e.message);
    return res.status(500).json({ error: 'failed to fetch execution', details: e.message });
  }
});

// === Get Flow Details ===
app.get('/api/flows/:id', async (req, res) => {
  try {
    const token = await getIamToken();
    const flowId = req.params.id;
    const url = `https://api.ibm.com/watsonx/orchestrate/flows/${flowId}`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return res.json(response.data);
  } catch (e) {
    console.error('Get flow error:', e.response?.data || e.message);
    return res.status(500).json({ error: 'failed to fetch flow', details: e.message });
  }
});

// === Get All Flows ===
app.get('/api/flows', async (req, res) => {
  try {
    const token = await getIamToken();
    const url = `https://api.ibm.com/watsonx/orchestrate/flows`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return res.json(response.data);
  } catch (e) {
    console.error('Get flows error:', e.response?.data || e.message);
    return res.status(500).json({ error: 'failed to fetch flows', details: e.message });
  }
});

// === Human approval ===
app.post('/api/skills/human-approval', requireApiKey, async (req, res) => {
  const { flow_run_id, decision, comments } = req.body;
  
  try {
    // TODO: Use Orchestrate REST API to resume flow if needed
    // For demo: emit event
    emitSocketEvent('humanApproval', { 
      flow_run_id, 
      decision, 
      comments,
      timestamp: new Date().toISOString()
    });
    
    console.log(`[HumanApproval] Flow: ${flow_run_id}, Decision: ${decision}`);
    
    res.json({ status: 'received', flow_run_id, decision });
  } catch (err) {
    console.error('Human approval error:', err);
    res.status(500).json({ error: 'human approval failed', details: err.message });
  }
});

// === Root endpoint ===
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ResolveAI 360 Backend',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      triggerFlow: '/api/trigger-flow',
      tools: '/api/skills/*',
      orchestrateCallback: '/api/orchestrate/callback',
      executions: '/api/executions',
      flows: '/api/flows'
    },
    timestamp: new Date().toISOString(),
    note: 'Tool endpoints require POST method and x-api-key header. Use /test-tool for browser testing.'
  });
});

// === Test endpoint for browser testing ===
app.get('/test-tool', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ResolveAI 360 - Tool Tester</title>
      <style>
        body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { display: inline-block; padding: 3px 8px; border-radius: 3px; font-weight: bold; }
        .post { background: #4CAF50; color: white; }
        .get { background: #2196F3; color: white; }
        code { background: #eee; padding: 2px 6px; border-radius: 3px; }
        .test-btn { background: #2196F3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .test-btn:hover { background: #1976D2; }
        #result { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>🔧 ResolveAI 360 - Tool Tester</h1>
      <p>Test your backend endpoints. All endpoints require <code>x-api-key</code> header.</p>
      
      <div class="endpoint">
        <h3><span class="method post">POST</span> CreateTicket</h3>
        <p><code>/api/skills/create-ticket</code></p>
        <button class="test-btn" onclick="testCreateTicket()">Test CreateTicket</button>
      </div>
      
      <div class="endpoint">
        <h3><span class="method get">GET</span> FetchKB</h3>
        <p><code>/api/skills/kb-search?q=test</code></p>
        <button class="test-btn" onclick="testFetchKB()">Test FetchKB</button>
      </div>
      
      <div class="endpoint">
        <h3><span class="method get">GET</span> Health Check</h3>
        <p><code>/health</code></p>
        <button class="test-btn" onclick="testHealth()">Test Health</button>
      </div>
      
      <div id="result"></div>
      
      <script>
        const API_KEY = 'XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct';
        const BASE_URL = window.location.origin;
        
        async function testCreateTicket() {
          const resultDiv = document.getElementById('result');
          resultDiv.textContent = 'Testing CreateTicket...';
          
          try {
            const response = await fetch(BASE_URL + '/api/skills/create-ticket', {
              method: 'POST',
              headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                customer: { id: 'TEST', name: 'Test User' },
                title: 'Test Ticket',
                text: 'Testing from browser',
                priority: 'P3'
              })
            });
            
            const data = await response.json();
            resultDiv.textContent = '✅ CreateTicket Response:\n' + JSON.stringify(data, null, 2);
          } catch (error) {
            resultDiv.textContent = '❌ Error: ' + error.message;
          }
        }
        
        async function testFetchKB() {
          const resultDiv = document.getElementById('result');
          resultDiv.textContent = 'Testing FetchKB...';
          
          try {
            const response = await fetch(BASE_URL + '/api/skills/kb-search?q=500', {
              method: 'GET',
              headers: {
                'x-api-key': API_KEY
              }
            });
            
            const data = await response.json();
            resultDiv.textContent = '✅ FetchKB Response:\n' + JSON.stringify(data, null, 2);
          } catch (error) {
            resultDiv.textContent = '❌ Error: ' + error.message;
          }
        }
        
        async function testHealth() {
          const resultDiv = document.getElementById('result');
          resultDiv.textContent = 'Testing Health...';
          
          try {
            const response = await fetch(BASE_URL + '/health');
            const data = await response.json();
            resultDiv.textContent = '✅ Health Response:\n' + JSON.stringify(data, null, 2);
          } catch (error) {
            resultDiv.textContent = '❌ Error: ' + error.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// === Health check ===
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ResolveAI 360',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handler (only if Socket.io is available)
if (io) {
  io.on('connection', (socket) => {
    console.log('UI connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('UI disconnected:', socket.id);
    });
  });
} else {
  console.log('Socket.io not available (serverless environment) - REST API only');
}

// Export for Vercel serverless
export default app;

// Only start HTTP server if not in serverless environment (Vercel)
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`🚀 ResolveAI 360 Server listening on port ${PORT}`);
    if (io) {
      console.log(`📡 Socket.IO ready for real-time updates`);
    } else {
      console.log(`📡 REST API mode (Socket.IO not available)`);
    }
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
} else {
  console.log('Running in serverless mode (Vercel) - REST API only');
}

