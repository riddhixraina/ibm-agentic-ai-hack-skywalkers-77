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
// TEMPORARY: For demo purposes, allowing requests without API key if coming from Orchestrate
// TODO: Fix Orchestrate connection to send API key header properly
function requireApiKey(req, res, next) {
  const expectedKey = process.env.ORCHESTRATE_TOOL_KEY;
  
  // Check for API key in various header formats
  let key = null;
  
  // Check all possible header names (case-insensitive)
  for (const headerName of Object.keys(req.headers)) {
    const lowerName = headerName.toLowerCase();
    if (lowerName === 'x-api-key' || 
        lowerName === 'api-key' || 
        lowerName === 'x-apikey' ||
        lowerName === 'apikey') {
      key = req.headers[headerName];
      break;
    }
  }
  
  // Check Authorization header
  if (!key && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('ApiKey ') || authHeader.startsWith('Bearer ')) {
      key = authHeader.replace('ApiKey ', '').replace('Bearer ', '');
    } else if (authHeader === expectedKey) {
      key = authHeader;
    }
  }
  
  // Check for Orchestrate-specific headers (indicates request is from Orchestrate)
  const isFromOrchestrate = req.headers['x-ibm-wo-transaction-id'] || 
                            req.headers['x-ba-crn'] ||
                            req.headers['plan-id'] ||
                            req.headers['user-agent']?.includes('watson') ||
                            req.headers['user-agent']?.includes('orchestrate');
  
  // If API key is provided, validate it
  if (key) {
    if (key === expectedKey) {
      console.log('✅ API key validated successfully');
      return next();
    } else {
      console.warn('⚠️ Invalid API key provided');
      // For demo: still allow if from Orchestrate
      if (isFromOrchestrate) {
        console.warn('⚠️ Allowing request from Orchestrate despite invalid key (demo mode)');
        return next();
      }
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid API key' });
    }
  }
  
  // No API key found - check if we have the key in env
  if (!expectedKey) {
    console.error('❌ ORCHESTRATE_TOOL_KEY not set in environment variables');
    // Still allow for demo
    if (isFromOrchestrate) {
      console.warn('⚠️ Allowing Orchestrate request (ORCHESTRATE_TOOL_KEY not configured)');
      return next();
    }
  }
  
  // No API key found but request is from Orchestrate
  if (isFromOrchestrate) {
    // TEMPORARY FIX: Allow Orchestrate requests without API key for demo
    console.warn('⚠️ No API key found, but allowing Orchestrate request (demo mode)');
    console.warn('⚠️ Request from Orchestrate detected via headers:', {
      'x-ibm-wo-transaction-id': req.headers['x-ibm-wo-transaction-id'] ? 'present' : 'missing',
      'x-ba-crn': req.headers['x-ba-crn'] ? 'present' : 'missing',
      'plan-id': req.headers['plan-id'] ? 'present' : 'missing',
      'user-agent': req.headers['user-agent']
    });
    return next();
  }
  
  // Reject if not from Orchestrate and no API key
  console.error('❌ No API key found and request not from Orchestrate');
  return res.status(401).json({ 
    error: 'unauthorized',
    message: 'API key required'
  });
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
    // Dummy knowledge base data for demo
    const kbData = [
      // Outage/Service Issues
      { 
        id: 'KB-OUTAGE-001', 
        snippet: 'If you experience service outages or cannot access your storage buckets, check the status page at status.ibm.com. Common causes include scheduled maintenance or regional issues. Estimated resolution time is typically 15-30 minutes.', 
        confidence: 0.9,
        category: 'outage',
        keywords: ['outage', 'down', 'unavailable', 'access', 'bucket', 'storage', 'service']
      },
      {
        id: 'KB-OUTAGE-002',
        snippet: 'For cloud service disruptions, our engineering team is automatically notified. You can check real-time status updates on our status page. If the issue persists beyond 30 minutes, contact support.',
        confidence: 0.85,
        category: 'outage',
        keywords: ['cloud', 'disruption', 'status', 'engineering', 'support']
      },
      // Billing Issues
      {
        id: 'KB-BILLING-001',
        snippet: 'For billing questions or duplicate charges, visit the billing portal to view your invoices. Refunds are processed within 3-5 business days. Contact billing support for immediate assistance.',
        confidence: 0.8,
        category: 'billing',
        keywords: ['billing', 'charge', 'invoice', 'refund', 'payment', 'duplicate']
      },
      {
        id: 'KB-BILLING-002',
        snippet: 'If you were charged incorrectly, we can process a refund. Please provide your invoice number and the amount in question. Standard refund processing time is 3-5 business days.',
        confidence: 0.75,
        category: 'billing',
        keywords: ['refund', 'incorrect', 'charge', 'invoice', 'amount']
      },
      // Troubleshooting
      { 
        id: 'KB-TROUBLESHOOT-001', 
        snippet: 'If you see 500 errors, try clearing your browser cache, refreshing the page, or waiting a few minutes and retrying. If the issue persists, check our status page for known issues.', 
        confidence: 0.7,
        category: 'troubleshooting',
        keywords: ['500', 'error', 'cache', 'refresh', 'retry']
      },
      {
        id: 'KB-TROUBLESHOOT-002',
        snippet: 'For VM or instance crashes, check your resource limits and configuration. Review the logs in your dashboard. Common causes include insufficient memory or configuration errors.',
        confidence: 0.65,
        category: 'troubleshooting',
        keywords: ['vm', 'crash', 'instance', 'memory', 'config', 'logs']
      },
      // Security Issues
      {
        id: 'KB-SECURITY-001',
        snippet: 'If you suspect a security issue or unauthorized access, immediately change your password and enable two-factor authentication. Contact security support for account lockout or breach concerns.',
        confidence: 0.9,
        category: 'security',
        keywords: ['security', 'unauthorized', 'breach', 'password', '2fa', 'lockout']
      },
      // PR/Communication
      {
        id: 'KB-PR-001',
        snippet: 'For public relations inquiries or social media concerns, our PR team handles all external communications. Escalate to PR team for brand reputation issues or public statements.',
        confidence: 0.8,
        category: 'pr',
        keywords: ['pr', 'public', 'social', 'media', 'reputation', 'statement']
      },
      // General Support
      {
        id: 'KB-SUPPORT-001',
        snippet: 'For general support questions, check our documentation portal or submit a support ticket. Response time varies by priority: P1 (5 minutes), P2 (1 hour), P3 (24 hours).',
        confidence: 0.6,
        category: 'support',
        keywords: ['support', 'help', 'ticket', 'documentation', 'question']
      },
      // Crisis Response
      {
        id: 'KB-CRISIS-001',
        snippet: 'During a crisis, our automated system detects issues and escalates to operations within 2 minutes. P1 incidents trigger immediate ops notification, social media response, and ticket creation.',
        confidence: 0.95,
        category: 'crisis',
        keywords: ['crisis', 'incident', 'escalate', 'ops', 'p1', 'emergency']
      }
    ];
    
    // Enhanced keyword matching
    const queryLower = q.toLowerCase();
    const matched = kbData
      .map(item => {
        // Check snippet match
        const snippetMatch = item.snippet.toLowerCase().includes(queryLower);
        // Check category match
        const categoryMatch = item.category.toLowerCase().includes(queryLower);
        // Check keyword match
        const keywordMatch = item.keywords.some(keyword => 
          keyword.toLowerCase().includes(queryLower) || 
          queryLower.includes(keyword.toLowerCase())
        );
        
        // Calculate relevance score
        let score = item.confidence;
        if (snippetMatch) score += 0.2;
        if (categoryMatch) score += 0.15;
        if (keywordMatch) score += 0.1;
        
        return {
          ...item,
          relevanceScore: score,
          matched: snippetMatch || categoryMatch || keywordMatch
        };
      })
      .filter(item => item.matched)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Top 5 results
    
    return res.json({
      matched: matched.length > 0,
      top_snippets: matched.map(item => ({
        id: item.id,
        snippet: item.snippet,
        confidence: Math.min(item.relevanceScore, 1.0), // Cap at 1.0
        category: item.category
      })),
      query: q,
      total_results: matched.length
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
    // For demo: Return mock data if Orchestrate API is not configured
    if (!process.env.IBM_APIKEY) {
      return res.json({
        executions: [
          {
            id: 'exec-001',
            flow_name: 'RealTimeCrisisFlow',
            status: 'completed',
            created_at: new Date().toISOString(),
            input: { text: 'Is IBM cloud down?', channel: 'twitter' }
          },
          {
            id: 'exec-002',
            flow_name: 'RealTimeCrisisFlow',
            status: 'running',
            created_at: new Date(Date.now() - 60000).toISOString(),
            input: { text: 'Billing issue', channel: 'chat' }
          }
        ],
        total: 2,
        note: 'Mock data - configure IBM_APIKEY for real Orchestrate data'
      });
    }

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
    
    // Return mock data on error for demo purposes
    return res.json({
      executions: [
        {
          id: 'exec-001',
          flow_name: 'RealTimeCrisisFlow',
          status: 'completed',
          created_at: new Date().toISOString(),
          input: { text: 'Is IBM cloud down?', channel: 'twitter' }
        },
        {
          id: 'exec-002',
          flow_name: 'RealTimeCrisisFlow',
          status: 'running',
          created_at: new Date(Date.now() - 60000).toISOString(),
          input: { text: 'Billing issue', channel: 'chat' }
        }
      ],
      total: 2,
      note: 'Mock data - Orchestrate API error: ' + (e.message || 'Unknown error')
    });
  }
});

// === Get Specific Execution ===
app.get('/api/executions/:id', async (req, res) => {
  try {
    // For demo: Return mock data if Orchestrate API is not configured
    if (!process.env.IBM_APIKEY) {
      return res.json({
        id: req.params.id,
        flow_name: 'RealTimeCrisisFlow',
        status: 'completed',
        created_at: new Date().toISOString(),
        input: { text: 'Is IBM cloud down?', channel: 'twitter' },
        output: {
          crisis_detected: true,
          crisis_score: 0.92,
          priority: 'P1'
        },
        note: 'Mock data - configure IBM_APIKEY for real Orchestrate data'
      });
    }

    const token = await getIamToken();
    const executionId = req.params.id;
    const url = `https://api.ibm.com/watsonx/orchestrate/executions/${executionId}`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return res.json(response.data);
  } catch (e) {
    console.error('Get execution error:', e.response?.data || e.message);
    
    // Return mock data on error for demo
    return res.json({
      id: req.params.id,
      flow_name: 'RealTimeCrisisFlow',
      status: 'completed',
      created_at: new Date().toISOString(),
      input: { text: 'Test message', channel: 'twitter' },
      output: {
        crisis_detected: true,
        crisis_score: 0.85,
        priority: 'P1'
      },
      note: 'Mock data - Orchestrate API error: ' + (e.message || 'Unknown error')
    });
  }
});

// === Get Flow Details ===
app.get('/api/flows/:id', async (req, res) => {
  try {
    // For demo: Return mock data if Orchestrate API is not configured
    if (!process.env.IBM_APIKEY) {
      return res.json({
        id: req.params.id,
        name: 'RealTimeCrisisFlow',
        status: 'active',
        description: 'Real-time crisis detection and response flow',
        note: 'Mock data - configure IBM_APIKEY for real Orchestrate data'
      });
    }

    const token = await getIamToken();
    const flowId = req.params.id;
    const url = `https://api.ibm.com/watsonx/orchestrate/flows/${flowId}`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return res.json(response.data);
  } catch (e) {
    console.error('Get flow error:', e.response?.data || e.message);
    
    // Return mock data on error for demo
    return res.json({
      id: req.params.id,
      name: 'RealTimeCrisisFlow',
      status: 'active',
      description: 'Real-time crisis detection and response flow',
      note: 'Mock data - Orchestrate API error: ' + (e.message || 'Unknown error')
    });
  }
});

// === Get All Flows ===
app.get('/api/flows', async (req, res) => {
  try {
    // For demo: Return mock data if Orchestrate API is not configured
    if (!process.env.IBM_APIKEY) {
      return res.json({
        flows: [
          {
            id: 'flow-001',
            name: 'RealTimeCrisisFlow',
            status: 'active',
            description: 'Real-time crisis detection and response flow'
          },
          {
            id: 'flow-002',
            name: 'SocialScanScheduler',
            status: 'active',
            description: 'Periodic social media monitoring flow'
          }
        ],
        total: 2,
        note: 'Mock data - configure IBM_APIKEY for real Orchestrate data'
      });
    }

    const token = await getIamToken();
    const url = `https://api.ibm.com/watsonx/orchestrate/flows`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return res.json(response.data);
  } catch (e) {
    console.error('Get flows error:', e.response?.data || e.message);
    
    // Return mock data on error for demo
    return res.json({
      flows: [
        {
          id: 'flow-001',
          name: 'RealTimeCrisisFlow',
          status: 'active',
          description: 'Real-time crisis detection and response flow'
        }
      ],
      total: 1,
      note: 'Mock data - Orchestrate API error: ' + (e.message || 'Unknown error')
    });
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

