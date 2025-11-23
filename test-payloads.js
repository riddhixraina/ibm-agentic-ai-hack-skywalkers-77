// test-payloads.js - Test script for ResolveAI 360
// Run with: node test-payloads.js

import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
const TEST_PAYLOADS = JSON.parse(fs.readFileSync('test-payloads.json', 'utf-8'));

async function testPayload(payload, testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Description: ${testCase.description}`);
  console.log(`   Payload:`, JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/trigger-flow`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log(`   ✅ Success! Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    
    // Check expected behavior
    if (testCase.expected_behavior) {
      console.log(`   Expected:`, testCase.expected_behavior);
    }
    
    return { success: true, response: response.data };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message };
  }
}

async function testToolEndpoint(toolName, payload, isGet = false) {
  const toolKey = process.env.ORCHESTRATE_TOOL_KEY;
  if (!toolKey) {
    console.error('❌ ORCHESTRATE_TOOL_KEY not set in .env');
    return;
  }
  
  console.log(`\n🔧 Testing Tool: ${toolName}`);
  
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': toolKey
      },
      timeout: 10000
    };
    
    let response;
    if (isGet) {
      response = await axios.get(`${BASE_URL}/api/skills/${toolName}`, config);
    } else {
      response = await axios.post(`${BASE_URL}/api/skills/${toolName}`, payload, config);
    }
    
    console.log(`   ✅ Success!`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    return { success: true, response: response.data };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 ResolveAI 360 Test Suite');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  // Test health endpoint
  try {
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is healthy:', health.data);
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    console.error('   Make sure the server is running: npm start');
    process.exit(1);
  }
  
  // Test individual tools
  console.log('\n📦 Testing Individual Tools...');
  
  await testToolEndpoint('create-ticket', {
    customer: { id: 'TEST-001', name: 'Test Customer' },
    title: 'Test Ticket',
    text: 'This is a test ticket',
    priority: 'P3'
  });
  
  await testToolEndpoint('kb-search?q=500%20error', {}, true);
  
  await testToolEndpoint('notify-ops', {
    priority: 'P1',
    incident_id: 'TEST-INCIDENT-001',
    summary: 'Test incident notification',
    links: []
  });
  
  // Test flow triggers
  console.log('\n🔄 Testing Flow Triggers...');
  
  for (const testCase of TEST_PAYLOADS.test_cases) {
    await testPayload(testCase.payload, testCase);
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✅ Test suite completed!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testPayload, testToolEndpoint, runTests };

