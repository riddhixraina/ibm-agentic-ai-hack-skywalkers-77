import { useState, useEffect } from 'react';
import { api } from '../services/api';

const TOOLS = [
  {
    id: 'create-ticket',
    name: 'CreateTicket',
    description: 'Creates a support ticket in Zendesk or Salesforce',
    endpoint: '/api/skills/create-ticket',
    method: 'POST',
    icon: '🎫',
    color: 'bg-blue-500'
  },
  {
    id: 'post-social',
    name: 'PostSocial',
    description: 'Posts a message to social media platforms (Twitter/X, Facebook)',
    endpoint: '/api/skills/post-social',
    method: 'POST',
    icon: '📱',
    color: 'bg-purple-500'
  },
  {
    id: 'notify-ops',
    name: 'NotifyOps',
    description: 'Sends notifications to operations teams via Slack and PagerDuty',
    endpoint: '/api/skills/notify-ops',
    method: 'POST',
    icon: '🔔',
    color: 'bg-orange-500'
  },
  {
    id: 'fetch-kb',
    name: 'FetchKB',
    description: 'Searches the knowledge base for solutions and documentation',
    endpoint: '/api/skills/kb-search',
    method: 'GET',
    icon: '📚',
    color: 'bg-green-500'
  },
  {
    id: 'ingest-event',
    name: 'IngestEvent',
    description: 'Logs an event to the data lake for audit and analytics',
    endpoint: '/api/skills/ingest-event',
    method: 'POST',
    icon: '💾',
    color: 'bg-indigo-500'
  },
  {
    id: 'social-monitor',
    name: 'SocialMediaMonitor',
    description: 'Monitors social media platforms for mentions and trending topics',
    endpoint: '/api/skills/social-monitor',
    method: 'GET',
    icon: '👁️',
    color: 'bg-pink-500'
  }
];

export default function ToolsStatus() {
  const [toolsStatus, setToolsStatus] = useState({});
  const [testing, setTesting] = useState(null);

  useEffect(() => {
    // Check tool status on mount
    checkAllTools();
  }, []);

  const checkTool = async (tool) => {
    try {
      setTesting(tool.id);
      
      // Test health endpoint first to verify backend is reachable
      try {
        await api.get('/health');
      } catch (healthError) {
        throw new Error('Backend unreachable');
      }
      
      // For GET endpoints, test with a simple query
      if (tool.method === 'GET') {
        const testUrl = tool.endpoint.includes('?') 
          ? tool.endpoint 
          : `${tool.endpoint}?q=test`;
        try {
          await api.get(testUrl, {
            headers: {
              'x-api-key': 'XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct'
            }
          });
        } catch (getError) {
          // For GET endpoints, if it's 401, backend is reachable but needs auth
          // If it's 404 or other, might be a different issue
          if (getError.response?.status === 401) {
            // Backend is reachable, just needs proper auth - mark as available
            setToolsStatus(prev => ({
              ...prev,
              [tool.id]: { 
                status: 'available', 
                note: 'Backend reachable (auth required)',
                lastChecked: new Date().toISOString() 
              }
            }));
            return;
          }
          throw getError;
        }
      } else {
        // For POST endpoints, just verify backend is reachable
        // Don't actually call POST endpoints as they might create data
        // Just mark as available if health check passed
        setToolsStatus(prev => ({
          ...prev,
          [tool.id]: { 
            status: 'available', 
            note: 'Backend reachable (POST endpoint - not tested)',
            lastChecked: new Date().toISOString() 
          }
        }));
        return;
      }
      
      setToolsStatus(prev => ({
        ...prev,
        [tool.id]: { status: 'connected', lastChecked: new Date().toISOString() }
      }));
    } catch (error) {
      // Check if it's a network error or backend error
      const isNetworkError = !error.response;
      const status = error.response?.status;
      
      let errorMessage = 'Connection failed';
      if (isNetworkError) {
        errorMessage = 'Backend unreachable - check URL';
      } else if (status === 401) {
        errorMessage = 'Authentication required';
      } else if (status === 404) {
        errorMessage = 'Endpoint not found';
      } else {
        errorMessage = error.response?.data?.error || error.message;
      }
      
      setToolsStatus(prev => ({
        ...prev,
        [tool.id]: { 
          status: 'error', 
          error: errorMessage,
          lastChecked: new Date().toISOString() 
        }
      }));
    } finally {
      setTesting(null);
    }
  };

  const checkAllTools = async () => {
    // Check backend health first
    try {
      const healthRes = await api.get('/health');
      // If health check passes, mark all tools as available
      TOOLS.forEach(tool => {
        setToolsStatus(prev => ({
          ...prev,
          [tool.id]: { 
            status: 'available', 
            note: 'Backend reachable',
            lastChecked: new Date().toISOString() 
          }
        }));
      });
    } catch (error) {
      const errorMsg = error.response 
        ? `Backend error: ${error.response.status}` 
        : 'Backend unreachable - check URL';
      TOOLS.forEach(tool => {
        setToolsStatus(prev => ({
          ...prev,
          [tool.id]: { 
            status: 'unavailable', 
            error: errorMsg,
            lastChecked: new Date().toISOString()
          }
        }));
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tools Status</h2>
          <button
            onClick={checkAllTools}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Refresh All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => {
            const status = toolsStatus[tool.id];
            const isTesting = testing === tool.id;
            
            return (
              <div key={tool.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`${tool.color} rounded-full p-2 text-white text-xl`}>
                      {tool.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                      <p className="text-xs text-gray-500">{tool.method} {tool.endpoint}</p>
                    </div>
                  </div>
                  {isTesting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded text-xs ${
                        status?.status === 'connected' || status?.status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : status?.status === 'error' || status?.status === 'unavailable'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {status?.status || 'Unknown'}
                      </span>
                      {status?.error && (
                        <span className="text-xs text-red-600 mt-1 max-w-[150px] truncate" title={status.error}>
                          {status.error}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
                
                <button
                  onClick={() => checkTool(tool)}
                  disabled={isTesting}
                  className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 disabled:opacity-50"
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                
                {status?.note && (
                  <p className="text-xs text-blue-600 mt-2">
                    {status.note}
                  </p>
                )}
                
                {status?.lastChecked && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Backend Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Backend Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Backend URL:</span>
            <span className="text-gray-900 font-mono">https://ibm-agentic-ai-hack-skywalkers-77.vercel.app</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Tools:</span>
            <span className="text-gray-900 font-semibold">{TOOLS.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Connected Tools:</span>
            <span className="text-green-600 font-semibold">
              {Object.values(toolsStatus).filter(s => s?.status === 'connected' || s?.status === 'available').length} / {TOOLS.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

