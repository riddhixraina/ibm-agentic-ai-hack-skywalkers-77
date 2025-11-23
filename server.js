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
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple x-api-key middleware for Orchestrate tool authentication
function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.ORCHESTRATE_TOOL_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
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
    io.emit('opsNotification', { 
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
    io.emit('newEvent', { eventId, event, timestamp: new Date().toISOString() });
    
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
  io.emit('flowUpdate', { ...req.body, timestamp: new Date().toISOString() });
  console.log('[Orchestrate Callback]', req.body);
  res.status(200).send('ok');
});

// === Human approval ===
app.post('/api/skills/human-approval', requireApiKey, async (req, res) => {
  const { flow_run_id, decision, comments } = req.body;
  
  try {
    // TODO: Use Orchestrate REST API to resume flow if needed
    // For demo: emit event
    io.emit('humanApproval', { 
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

// === Health check ===
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ResolveAI 360',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('UI connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('UI disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 ResolveAI 360 Server listening on port ${PORT}`);
  console.log(`📡 Socket.IO ready for real-time updates`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

