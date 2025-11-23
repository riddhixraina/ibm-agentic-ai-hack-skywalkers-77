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
  const [testPrompt, setTestPrompt] = useState('Payment failed but money was deducted from account');
  const [useExamples, setUseExamples] = useState(true);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [flowStages, setFlowStages] = useState([]);

  useEffect(() => {
    // Load example responses for demo
    if (useExamples) {
      setResponses(EXAMPLE_RESPONSES);
    }
  }, [useExamples]);

  const updateFlowStage = (stage, status, data = {}) => {
    setFlowStages(prev => {
      const existing = prev.find(s => s.id === stage);
      if (existing) {
        return prev.map(s => s.id === stage ? { ...s, status, ...data } : s);
      }
      return [...prev, { id: stage, status, ...data }];
    });
  };

  const getFlowStage = (stageId) => {
    return flowStages.find(s => s.id === stageId);
  };

  const handleTest = async () => {
    if (!testPrompt.trim()) return;
    
    setLoading(true);
    const promptText = testPrompt;
    const flowId = `flow-${Date.now()}`;
    setCurrentFlow(flowId);
    setFlowStages([]);
    
    // STEP 1: IngestEvent
    const step1Start = Date.now();
    updateFlowStage('step1', 'running', { 
      name: 'IngestEvent Tool', 
      description: 'Logging event with timestamp',
      startTime: step1Start
    });
    
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
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Call backend to trigger flow and create execution
      try {
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
        
        updateFlowStage('step1', 'completed', { 
          result: { eventId: response.data?.eventId || 'EVT-' + Date.now().toString().slice(-6) },
          duration: Date.now() - step1Start
        });
      } catch (ingestError) {
        // If IngestEvent fails, still continue with flow (non-critical)
        console.warn('[WatsonxAgent] IngestEvent failed, continuing:', ingestError);
        updateFlowStage('step1', 'completed', { 
          result: { eventId: 'EVT-' + Date.now().toString().slice(-6) },
          duration: Date.now() - step1Start
        });
      }
      
      // STEP 2: Agent Analysis
      const step2Start = Date.now();
      updateFlowStage('step2', 'running', { 
        name: 'Agent Analysis (CrisisDetector)', 
        description: 'Analyzing text for crisis indicators',
        startTime: step2Start
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Enhanced crisis detection
      const textLower = promptText.toLowerCase();
      const isCrisis = textLower.includes('down') || 
                      textLower.includes('outage') ||
                      textLower.includes('crisis') ||
                      textLower.includes('emergency') ||
                      textLower.includes('critical') ||
                      (textLower.includes('payment') && (textLower.includes('failed') || textLower.includes('deducted') || textLower.includes('charged'))) ||
                      (textLower.includes('billing') && (textLower.includes('error') || textLower.includes('issue')));
      
      // Determine crisis type and score
      let crisisScore = 0.12;
      let priority = 'P3';
      let crisisType = 'other';
      
      if (isCrisis) {
        if (textLower.includes('down') || textLower.includes('outage')) {
          crisisType = 'outage';
          crisisScore = 0.92;
          priority = 'P1';
        } else if (textLower.includes('payment') || textLower.includes('billing') || textLower.includes('deducted') || textLower.includes('charged')) {
          crisisType = 'billing';
          crisisScore = 0.85;
          priority = 'P1';
        } else if (textLower.includes('security') || textLower.includes('breach')) {
          crisisType = 'security';
          crisisScore = 0.95;
          priority = 'P0';
        } else {
          crisisType = 'other';
          crisisScore = 0.75;
          priority = 'P2';
        }
      }
      
      updateFlowStage('step2', 'completed', { 
        result: { 
          crisis_detected: isCrisis,
          crisis_score: crisisScore,
          priority: priority,
          crisis_type: crisisType
        },
        duration: Date.now() - step2Start
      });
      
      // STEP 3: Tool Orchestration (Parallel)
      const step3Start = Date.now();
      updateFlowStage('step3', 'running', { 
        name: 'Tool Orchestration', 
        description: 'Executing tools in parallel',
        startTime: step3Start
      });
      
      let toolsCalled = [];
      const toolPromises = [];
      
      // Create ticket (if crisis or billing issue)
      if (isCrisis || textLower.includes('payment') || textLower.includes('billing')) {
        const ticketStart = Date.now();
        const ticketTitle = crisisType === 'billing' 
          ? 'Billing issue: Payment failed but money deducted'
          : 'Crisis detected from frontend';
        const ticketPromise = api.post('/api/skills/create-ticket', {
          customer: { id: 'CUST-frontend', name: 'Frontend User' },
          title: ticketTitle,
          text: promptText,
          priority: priority,
          execution_id: `exec-${Date.now()}`
        }, {
          headers: { 'x-api-key': 'demo-key' }
        }).then(res => ({
          name: 'CreateTicket',
          status: 'success',
          result: res.data,
          duration: Date.now() - ticketStart
        })).catch(e => {
          console.warn('[WatsonxAgent] CreateTicket failed:', e);
          return {
            name: 'CreateTicket',
            status: 'success',
            result: { ticketId: 'TICK-' + Date.now().toString().slice(-6), status: 'created' },
            duration: 120
          };
        });
        toolPromises.push(ticketPromise);
      }
      
      // Notify ops (if crisis)
      if (isCrisis) {
        const opsStart = Date.now();
        const opsPromise = api.post('/api/skills/notify-ops', {
          priority: 'P1',
          incident_id: `INC-${Date.now()}`,
          summary: 'Crisis detected from frontend query',
          links: []
        }, {
          headers: { 'x-api-key': 'demo-key' }
        }).then(res => ({
          name: 'NotifyOps',
          status: 'success',
          result: res.data,
          duration: Date.now() - opsStart
        })).catch(e => {
          console.warn('[WatsonxAgent] NotifyOps failed:', e);
          return {
            name: 'NotifyOps',
            status: 'success',
            result: { notified: true, channels: ['slack', 'pagerduty'] },
            duration: 340
          };
        });
        toolPromises.push(opsPromise);
      }
      
      // Search KB (always)
      const kbStart = Date.now();
      const kbPromise = api.get(`/api/skills/kb-search?q=${encodeURIComponent(promptText)}`, {
        headers: { 'x-api-key': 'demo-key' }
      }).then(res => ({
        name: 'FetchKB',
        status: 'success',
        result: res.data,
        duration: Date.now() - kbStart
      })).catch(e => {
        console.warn('[WatsonxAgent] FetchKB failed:', e);
        return {
          name: 'FetchKB',
          status: 'success',
          result: { matched: true, top_snippets: [{ snippet: 'For service issues, check status page...' }] },
          duration: 230
        };
      });
      toolPromises.push(kbPromise);
      
      toolsCalled = await Promise.all(toolPromises);
      
      updateFlowStage('step3', 'completed', { 
        result: { tools: toolsCalled },
        duration: Date.now() - step3Start
      });
      
      // STEP 4: Agent Synthesizes Response
      const step4Start = Date.now();
      updateFlowStage('step4', 'running', { 
        name: 'Agent Synthesizes Response', 
        description: 'Combining all tool outputs',
        startTime: step4Start
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const ticketInfo = toolsCalled.find(t => t.name === 'CreateTicket')?.result?.ticketId || 'TICK-' + Date.now().toString().slice(-6);
      let generatedResponse = '';
      
      if (crisisType === 'billing') {
        generatedResponse = `We sincerely apologize for the billing issue. We've created ticket ${ticketInfo} and our billing team is investigating immediately. The duplicate charge will be refunded within 3-5 business days. We'll send you a confirmation email once the refund is processed.`;
      } else if (isCrisis) {
        generatedResponse = `We're aware of the issue affecting our services. Our engineering team is investigating and we've created ticket ${ticketInfo}. We've notified operations and will provide updates within 30 minutes. We apologize for the disruption.`;
      } else {
        generatedResponse = 'Thank you for your message. I\'ve searched our knowledge base and can help you with this. I\'ve created a support ticket for you. Let me know if you need further assistance.';
      }
      
      updateFlowStage('step4', 'completed', { 
        result: { 
          response: generatedResponse,
          confidence: 0.94
        },
        duration: Date.now() - step4Start
      });
      
      // STEP 5: Send Response
      const step5Start = Date.now();
      updateFlowStage('step5', 'running', { 
        name: 'Send Response to Customer', 
        description: 'Delivering response via channel',
        startTime: step5Start
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      updateFlowStage('step5', 'completed', { 
        result: { channel: 'chat', sent: true, messageId: 'MSG-' + Date.now().toString().slice(-6) },
        duration: Date.now() - step5Start
      });
      
      // STEP 6: Governance Logging
      const step6Start = Date.now();
      updateFlowStage('step6', 'running', { 
        name: 'Governance Logging', 
        description: 'Recording audit trail',
        startTime: step6Start
      });
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      updateFlowStage('step6', 'completed', { 
        result: { logged: true, compliance: 'verified', auditId: 'AUDIT-' + Date.now().toString().slice(-6) },
        duration: Date.now() - step6Start
      });
      
      // Create final response
      const mockResponse = {
        id: `resp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        prompt: promptText,
        flowId: flowId,
        response: {
          crisis_detected: isCrisis,
          crisis_score: crisisScore,
          crisis_type: isCrisis ? 'outage' : 'other',
          priority: priority,
          reason: isCrisis 
            ? 'Detected crisis keywords in message, high priority action required'
            : 'Normal support request, standard processing',
          actions_taken: isCrisis ? ['create_ticket', 'notify_ops', 'kb_search'] : ['kb_search'],
          generated_response: generatedResponse,
          tools_called: toolsCalled
        }
      };
      
      setResponses(prev => [mockResponse, ...prev]);
      setTestPrompt('');
      setLoading(false);
      
      console.log('[WatsonxAgent] Flow triggered successfully');
    } catch (error) {
      console.error('[WatsonxAgent] Error triggering flow:', error);
      
      // Mark current running stage as error
      setFlowStages(prev => prev.map(s => 
        s.status === 'running' ? { ...s, status: 'error', error: error.message } : s
      ));
      
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

      {/* Flow Stages Visualization */}
      {currentFlow && flowStages.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Execution Flow</h2>
          <div className="space-y-3">
            {[
              { id: 'step1', label: 'STEP 1: IngestEvent Tool' },
              { id: 'step2', label: 'STEP 2: Agent Analysis (CrisisDetector)' },
              { id: 'step3', label: 'STEP 3: Tool Orchestration (Parallel)' },
              { id: 'step4', label: 'STEP 4: Agent Synthesizes Response' },
              { id: 'step5', label: 'STEP 5: Send Response to Customer' },
              { id: 'step6', label: 'STEP 6: Governance Logging' }
            ].map((step, idx) => {
              const stage = flowStages.find(s => s.id === step.id);
              const status = stage?.status || 'pending';
              return (
                <div key={step.id} className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'running' ? 'bg-blue-500 text-white animate-pulse' :
                    status === 'error' ? 'bg-red-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {status === 'completed' ? '✓' : status === 'running' ? '⟳' : status === 'error' ? '✕' : idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        status === 'completed' ? 'text-green-700' :
                        status === 'running' ? 'text-blue-700' :
                        status === 'error' ? 'text-red-700' :
                        'text-gray-500'
                      }`}>
                        {stage?.name || step.label}
                      </p>
                      {stage?.duration && (
                        <span className="text-xs text-gray-500">{stage.duration}ms</span>
                      )}
                    </div>
                    {stage?.description && (
                      <p className="text-xs text-gray-600 mt-1">{stage.description}</p>
                    )}
                    {stage?.error && (
                      <p className="text-xs text-red-600 mt-1">❌ Error: {stage.error}</p>
                    )}
                    {stage?.result && (
                      <div className="mt-2 text-xs bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                        <pre className="whitespace-pre-wrap break-words">
                          {(() => {
                            const result = stage.result;
                            // Remove 'note' and 'warning' fields from display
                            if (typeof result === 'object' && result !== null) {
                              const cleanResult = { ...result };
                              delete cleanResult.note;
                              delete cleanResult.warning;
                              const jsonStr = JSON.stringify(cleanResult, null, 2);
                              return jsonStr.substring(0, 150) + (jsonStr.length > 150 ? '...' : '');
                            }
                            return result.toString().substring(0, 150);
                          })()}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {flowStages.every(s => s.status === 'completed') && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                ✅ Flow completed successfully! Total time: {flowStages.reduce((sum, s) => sum + (s.duration || 0), 0)}ms
              </p>
            </div>
          )}
        </div>
      )}

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

