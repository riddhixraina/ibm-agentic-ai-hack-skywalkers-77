import { useState, useEffect } from 'react';
import { api, flowsAPI } from '../services/api';

// Example responses for demo when watsonx isn't connected
const EXAMPLE_RESPONSES = [
  {
    id: 'resp-001',
    timestamp: new Date().toISOString(),
    prompt: 'Analyze this crisis: "Is IBM cloud down? can\'t access my bucket since 10:05. many people complaining #ibmclouddown"',
    response: {
      crisis_detected: true,
      crisis_score: 0.92,
      crisis_type: 'outage',
      priority: 'P1',
      reason: 'Rapid social spike (120 retweets), status page unreachable, multiple users reporting same issue',
      actions_taken: ['create_ticket', 'post_social', 'notify_ops'],
      generated_response: 'We\'re aware of an issue affecting storage. Engineers are investigating and we\'ll update within 30 mins. We\'re sorry for the disruption.',
      tools_called: [
        { name: 'CreateTicket', status: 'success', result: { ticketId: 'TICK-a1b2c3d4', status: 'created' } },
        { name: 'PostSocial', status: 'success', result: { postId: 'POST-xyz123', status: 'posted' } },
        { name: 'NotifyOps', status: 'success', result: { notified: true, channels: ['slack', 'pagerduty'] } }
      ]
    }
  },
  {
    id: 'resp-002',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    prompt: 'Check if this is a crisis: "Company tweeted wrong numbers and customers are upset; many retweets"',
    response: {
      crisis_detected: true,
      crisis_score: 0.78,
      crisis_type: 'PR',
      priority: 'P1',
      reason: 'High retweet/engagement (450 retweets), accusatory language, brand reputation risk',
      actions_taken: ['notify_ops', 'post_social'],
      generated_response: 'We\'re investigating the claim and will share a public update soon. If you\'re affected, please contact support.',
      tools_called: [
        { name: 'NotifyOps', status: 'success', result: { notified: true, channels: ['slack'] } },
        { name: 'PostSocial', status: 'success', result: { postId: 'POST-abc456', status: 'posted' } }
      ]
    }
  },
  {
    id: 'resp-003',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    prompt: 'Is this a crisis?: "My VM crashed, please help debug my config"',
    response: {
      crisis_detected: false,
      crisis_score: 0.12,
      crisis_type: 'other',
      priority: 'P3',
      reason: 'Single-user request, no evidence of widespread problem, standard support ticket',
      actions_taken: ['kb_search', 'create_ticket'],
      generated_response: 'For VM crashes, check your resource limits and configuration. Review the logs in your dashboard. I\'ve created a support ticket for you.',
      tools_called: [
        { name: 'FetchKB', status: 'success', result: { matched: true, top_snippets: [{ snippet: 'For VM or instance crashes, check your resource limits...' }] } },
        { name: 'CreateTicket', status: 'success', result: { ticketId: 'TICK-e5f6g7h8', status: 'created' } }
      ]
    }
  }
];

export default function WatsonxAgent() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Is IBM cloud down? can\'t access my bucket since 10:05. many people complaining #ibmclouddown');
  const [useExamples, setUseExamples] = useState(true);

  useEffect(() => {
    // Load example responses for demo
    if (useExamples) {
      setResponses(EXAMPLE_RESPONSES);
    }
  }, [useExamples]);

  const handleTest = async () => {
    if (!testPrompt.trim()) return;
    
    setLoading(true);
    const promptText = testPrompt;
    
    try {
      // Trigger flow via backend
      const flowInput = {
        text: promptText,
        channel: 'chat',
        metadata: {
          source: 'frontend',
          timestamp: new Date().toISOString()
        }
      };
      
      // Call backend to trigger flow and create execution
      const response = await api.post('/api/skills/ingest-event', {
        flow_name: 'RealTimeCrisisFlow',
        execution_id: `exec-${Date.now()}`,
        status: 'running',
        input: flowInput,
        output: {},
        timestamp: new Date().toISOString()
      }, {
        headers: { 'x-api-key': 'demo-key' }
      });
      
      // Also trigger tools based on content
      const isCrisis = promptText.toLowerCase().includes('down') || 
                      promptText.toLowerCase().includes('outage') ||
                      promptText.toLowerCase().includes('crisis');
      
      let toolsCalled = [];
      
      if (isCrisis) {
        // Create ticket
        try {
          const ticketRes = await api.post('/api/skills/create-ticket', {
            customer: { id: 'CUST-frontend', name: 'Frontend User' },
            title: 'Crisis detected from frontend',
            text: promptText,
            priority: 'P1',
            execution_id: `exec-${Date.now()}`
          }, {
            headers: { 'x-api-key': 'demo-key' }
          });
          toolsCalled.push({
            name: 'CreateTicket',
            status: 'success',
            result: ticketRes.data
          });
        } catch (e) {
          toolsCalled.push({
            name: 'CreateTicket',
            status: 'error',
            result: { error: e.message }
          });
        }
        
        // Notify ops
        try {
          const opsRes = await api.post('/api/skills/notify-ops', {
            priority: 'P1',
            incident_id: `INC-${Date.now()}`,
            summary: 'Crisis detected from frontend query',
            links: []
          }, {
            headers: { 'x-api-key': 'demo-key' }
          });
          toolsCalled.push({
            name: 'NotifyOps',
            status: 'success',
            result: opsRes.data
          });
        } catch (e) {
          toolsCalled.push({
            name: 'NotifyOps',
            status: 'error',
            result: { error: e.message }
          });
        }
      }
      
      // Search KB
      try {
        const kbRes = await api.get(`/api/skills/kb-search?q=${encodeURIComponent(promptText)}`, {
          headers: { 'x-api-key': 'demo-key' }
        });
        toolsCalled.push({
          name: 'FetchKB',
          status: 'success',
          result: kbRes.data
        });
      } catch (e) {
        toolsCalled.push({
          name: 'FetchKB',
          status: 'error',
          result: { error: e.message }
        });
      }
      
      // Create response
      const mockResponse = {
        id: `resp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        prompt: promptText,
        response: {
          crisis_detected: isCrisis,
          crisis_score: isCrisis ? 0.85 : 0.3,
          crisis_type: isCrisis ? 'outage' : 'other',
          priority: isCrisis ? 'P1' : 'P3',
          reason: isCrisis 
            ? 'Detected crisis keywords in message, high priority action required'
            : 'Normal support request, standard processing',
          actions_taken: isCrisis ? ['create_ticket', 'notify_ops', 'kb_search'] : ['kb_search'],
          generated_response: isCrisis
            ? 'We\'re aware of the issue and our team is investigating. We\'ve created a ticket and notified operations. Updates will be provided shortly.'
            : 'Thank you for your message. I\'ve searched our knowledge base and can help you with this. Let me know if you need further assistance.',
          tools_called: toolsCalled
        }
      };
      
      setResponses(prev => [mockResponse, ...prev]);
      setTestPrompt('');
      setLoading(false);
      
      // Show success message
      console.log('[WatsonxAgent] Flow triggered successfully');
    } catch (error) {
      console.error('[WatsonxAgent] Error triggering flow:', error);
      
      // Still show response even if backend call fails
      const mockResponse = {
        id: `resp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        prompt: promptText,
        response: {
          crisis_detected: promptText.toLowerCase().includes('down') || promptText.toLowerCase().includes('outage'),
          crisis_score: promptText.toLowerCase().includes('down') ? 0.85 : 0.3,
          crisis_type: promptText.toLowerCase().includes('down') ? 'outage' : 'other',
          priority: promptText.toLowerCase().includes('down') ? 'P1' : 'P3',
          reason: 'Analyzed message content (backend unavailable, using local analysis)',
          actions_taken: promptText.toLowerCase().includes('down') ? ['create_ticket', 'notify_ops'] : ['kb_search'],
          generated_response: 'We\'re investigating the issue and will provide updates shortly.',
          tools_called: [
            { name: 'CreateTicket', status: 'pending', result: { note: 'Backend unavailable' } }
          ]
        }
      };
      
      setResponses(prev => [mockResponse, ...prev]);
      setTestPrompt('');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test watsonx Agent</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Enter a message to analyze (e.g., 'Is IBM cloud down?')"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleTest()}
          />
          <button
            onClick={handleTest}
            disabled={loading || !testPrompt.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Analyze'}
          </button>
        </div>
        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            id="useExamples"
            checked={useExamples}
            onChange={(e) => setUseExamples(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="useExamples" className="text-sm text-gray-600">
            Show example responses
          </label>
        </div>
      </div>

      {/* Responses */}
      <div className="space-y-4">
        {responses.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.response.crisis_detected
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.response.crisis_detected ? '🚨 Crisis Detected' : '✅ Normal Request'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.response.priority === 'P1' ? 'bg-red-100 text-red-800' :
                    item.response.priority === 'P2' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    Priority: {item.response.priority}
                  </span>
                  <span className="text-sm text-gray-500">
                    Score: {(item.response.crisis_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Prompt:</strong> {item.prompt}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Type:</strong> {item.response.crisis_type} | 
                  <strong> Reason:</strong> {item.response.reason}
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(item.timestamp).toLocaleString()}
              </span>
            </div>

            {/* Generated Response */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Generated Response:</p>
              <p className="text-gray-900">{item.response.generated_response}</p>
            </div>

            {/* Tools Called */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Tools Executed:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {item.response.tools_called.map((tool, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{tool.name}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        tool.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tool.status}
                      </span>
                    </div>
                    {tool.result && (
                      <div className="text-xs text-gray-600">
                        {tool.name === 'CreateTicket' && `Ticket: ${tool.result.ticketId}`}
                        {tool.name === 'PostSocial' && `Post ID: ${tool.result.postId}`}
                        {tool.name === 'NotifyOps' && `Channels: ${tool.result.channels?.join(', ')}`}
                        {tool.name === 'FetchKB' && `Matched: ${tool.result.matched ? 'Yes' : 'No'}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {responses.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No responses yet. Test the agent with a message above.</p>
        </div>
      )}
    </div>
  );
}

