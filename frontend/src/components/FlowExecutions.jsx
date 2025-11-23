import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { executionsAPI } from '../services/api';

export default function FlowExecutions() {
  const { events } = useSocket();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadExecutions();
    
    // Poll for updates every 5 seconds (Socket.io doesn't work on Vercel)
    const interval = setInterval(loadExecutions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Default example executions
  const getDefaultExecutions = () => {
    const now = Date.now();
    return [
      {
        id: 'exec-demo-001',
        flow_name: 'RealTimeCrisisFlow',
        status: 'completed',
        created_at: new Date(now - 300000).toISOString(),
        start_time: new Date(now - 300000).toISOString(),
        end_time: new Date(now - 295000).toISOString(),
        input: { text: 'Is IBM cloud down? can\'t access my bucket since 10:05. many people complaining #ibmclouddown', channel: 'twitter' },
        output: { crisis_detected: true, priority: 'P1', ticket_created: true, ticketId: 'TICK-demo-001', ops_notified: true }
      },
      {
        id: 'exec-demo-002',
        flow_name: 'RealTimeCrisisFlow',
        status: 'completed',
        created_at: new Date(now - 600000).toISOString(),
        start_time: new Date(now - 600000).toISOString(),
        end_time: new Date(now - 595000).toISOString(),
        input: { text: 'Billing issue - charged twice for November invoice, please refund', channel: 'chat' },
        output: { crisis_detected: false, priority: 'P2', ticket_created: true, ticketId: 'TICK-demo-002' }
      },
      {
        id: 'exec-demo-003',
        flow_name: 'SocialScanScheduler',
        status: 'completed',
        created_at: new Date(now - 900000).toISOString(),
        start_time: new Date(now - 900000).toISOString(),
        end_time: new Date(now - 895000).toISOString(),
        input: { keywords: '#ibmclouddown', platform: 'twitter' },
        output: { posts_found: 45, crises_detected: 3 }
      },
      {
        id: 'exec-demo-004',
        flow_name: 'RealTimeCrisisFlow',
        status: 'running',
        created_at: new Date(now - 120000).toISOString(),
        start_time: new Date(now - 120000).toISOString(),
        input: { text: 'Service outage affecting multiple regions', channel: 'email' },
        output: { crisis_detected: true, priority: 'P0' }
      },
      {
        id: 'exec-demo-005',
        flow_name: 'HumanReviewFlow',
        status: 'running',
        created_at: new Date(now - 60000).toISOString(),
        start_time: new Date(now - 60000).toISOString(),
        input: { flow_run_id: 'exec-demo-002', requires_approval: true },
        output: {}
      }
    ];
  };

  const loadExecutions = async () => {
    try {
      setLoading(true);
      const response = await executionsAPI.getAll({ limit: 50 });
      let execs = [];
      if (response.data?.executions) {
        execs = response.data.executions;
      }
      
      // If no executions, use default data
      if (execs.length === 0) {
        console.log('[FlowExecutions] No executions found, using default example data');
        execs = getDefaultExecutions();
      }
      
      setExecutions(execs);
    } catch (error) {
      console.error('[FlowExecutions] Failed to load executions:', error);
      // On error, use default data
      setExecutions(getDefaultExecutions());
    } finally {
      setLoading(false);
    }
  };

  const filteredExecutions = filter === 'all' 
    ? executions 
    : executions.filter(e => e.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {['all', 'running', 'completed', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button
            onClick={loadExecutions}
            className="ml-auto px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Executions List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading executions...</div>
        ) : filteredExecutions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No executions found. Trigger a flow to see executions here.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredExecutions.map((execution) => (
              <div
                key={execution.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedExecution(execution)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {execution.flow_name || 'Unknown Flow'}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(execution.status)}`}>
                        {execution.status || 'unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">ID: {execution.id}</p>
                    {execution.created_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Started: {new Date(execution.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {execution.duration && (
                      <p className="text-sm text-gray-600">{execution.duration}ms</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution Details Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Execution Details</h2>
                <button
                  onClick={() => setSelectedExecution(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Flow Name</label>
                  <p className="text-gray-900">{selectedExecution.flow_name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className={`inline-block px-2 py-1 rounded text-sm ${getStatusColor(selectedExecution.status)}`}>
                    {selectedExecution.status}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Execution ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedExecution.id}</p>
                </div>
                {selectedExecution.input && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Input</label>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(selectedExecution.input, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedExecution.output && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Output</label>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(selectedExecution.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

