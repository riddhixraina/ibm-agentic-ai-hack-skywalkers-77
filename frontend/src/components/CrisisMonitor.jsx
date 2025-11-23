import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

export default function CrisisMonitor() {
  const { events } = useSocket();
  const [crises, setCrises] = useState([]);

  useEffect(() => {
    // Extract crisis events from flow updates
    const crisisEvents = events
      .filter(e => e.type === 'flowUpdate' && e.data?.crisis_detected)
      .map(e => ({
        id: e.data?.execution_id || Date.now(),
        timestamp: e.timestamp,
        text: e.data?.input?.text || 'Unknown',
        channel: e.data?.input?.channel || 'unknown',
        crisisType: e.data?.crisis_type || 'unknown',
        crisisScore: e.data?.crisis_score || 0,
        priority: e.data?.priority || 'P3',
        actions: e.data?.actions_taken || [],
        metadata: e.data?.input?.metadata || {}
      }));

    setCrises(crisisEvents);
  }, [events]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'P0': return 'bg-red-600 text-white';
      case 'P1': return 'bg-orange-500 text-white';
      case 'P2': return 'bg-yellow-500 text-white';
      case 'P3': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCrisisTypeIcon = (type) => {
    switch (type) {
      case 'outage': return '🔴';
      case 'PR': return '📢';
      case 'security': return '🔒';
      case 'billing': return '💳';
      case 'safety': return '⚠️';
      default: return '🚨';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Crisis Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded">
            <p className="text-3xl font-bold text-red-600">{crises.length}</p>
            <p className="text-sm text-gray-600 mt-1">Total Crises Detected</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded">
            <p className="text-3xl font-bold text-orange-600">
              {crises.filter(c => c.priority === 'P0' || c.priority === 'P1').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">High Priority</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded">
            <p className="text-3xl font-bold text-blue-600">
              {crises.filter(c => c.crisisType === 'outage').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Outages</p>
          </div>
        </div>
      </div>

      {/* Crisis List */}
      <div className="space-y-4">
        {crises.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No crises detected yet. The system will show crises here when they are detected.
          </div>
        ) : (
          crises.map((crisis) => (
            <div key={crisis.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getCrisisTypeIcon(crisis.crisisType)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {crisis.crisisType.charAt(0).toUpperCase() + crisis.crisisType.slice(1)} Crisis
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(crisis.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(crisis.priority)}`}>
                      {crisis.priority}
                    </span>
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-gray-700">{crisis.text}</p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Channel: {crisis.channel}</span>
                      <span>Score: {(crisis.crisisScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {crisis.actions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Actions Taken:</p>
                      <div className="flex flex-wrap gap-2">
                        {crisis.actions.map((action, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {crisis.metadata && Object.keys(crisis.metadata).length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Metadata:</p>
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(crisis.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

