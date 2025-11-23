import { useEffect, useState } from 'react';
import { executionsAPI, healthAPI } from '../services/api';

export default function DataDisplay() {
  const [data, setData] = useState({
    executions: [],
    health: null,
    lastUpdate: null
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [executionsRes, healthRes] = await Promise.all([
          executionsAPI.getAll({ limit: 10 }),
          healthAPI.check()
        ]);

        setData({
          executions: executionsRes.data?.executions || [],
          health: healthRes.data,
          lastUpdate: new Date()
        });
      } catch (error) {
        console.error('[DataDisplay] Error loading data:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 z-50"
      >
        📊 Show Data ({data.executions.length} executions)
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">Real-time Data</h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <p className="font-medium text-gray-700">Health Status:</p>
          <pre className="bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(data.health, null, 2)}
          </pre>
        </div>

        <div>
          <p className="font-medium text-gray-700">Executions ({data.executions.length}):</p>
          <div className="bg-gray-50 p-2 rounded mt-1 max-h-48 overflow-y-auto">
            {data.executions.length > 0 ? (
              data.executions.map((exec, idx) => (
                <div key={idx} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                  <p className="font-medium">{exec.flow_name || 'Unknown'}</p>
                  <p className="text-gray-600">Status: {exec.status}</p>
                  <p className="text-gray-500 text-xs">ID: {exec.id}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No executions</p>
            )}
          </div>
        </div>

        {data.lastUpdate && (
          <p className="text-gray-500 text-xs">
            Last update: {data.lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}

