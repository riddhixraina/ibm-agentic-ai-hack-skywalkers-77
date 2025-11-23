import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { executionsAPI, healthAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { events } = useSocket();
  const [stats, setStats] = useState({
    totalCrises: 0,
    activeFlows: 0,
    ticketsCreated: 0,
    avgResponseTime: 0
  });
  const [health, setHealth] = useState(null);
  const [recentExecutions, setRecentExecutions] = useState([]);

  useEffect(() => {
    // Fetch health status
    healthAPI.check()
      .then(res => setHealth(res.data))
      .catch(err => console.error('Health check failed:', err));

    // Fetch recent executions
    executionsAPI.getAll({ limit: 10 })
      .then(res => {
        if (res.data?.executions) {
          setRecentExecutions(res.data.executions);
        }
      })
      .catch(err => console.error('Failed to fetch executions:', err));

    // Calculate stats from events
    const crises = events.filter(e => e.type === 'flowUpdate' && e.data?.crisis_detected);
    const tickets = events.filter(e => e.type === 'newEvent' && e.data?.event_type === 'ticket_created');
    
    setStats({
      totalCrises: crises.length,
      activeFlows: events.filter(e => e.type === 'flowUpdate' && e.data?.status === 'running').length,
      ticketsCreated: tickets.length,
      avgResponseTime: 2.3 // Mock data
    });
  }, [events]);

  const statCards = [
    { label: 'Crises Detected', value: stats.totalCrises, icon: '🚨', color: 'bg-red-500' },
    { label: 'Active Flows', value: stats.activeFlows, icon: '🔄', color: 'bg-blue-500' },
    { label: 'Tickets Created', value: stats.ticketsCreated, icon: '🎫', color: 'bg-green-500' },
    { label: 'Avg Response Time', value: `${stats.avgResponseTime}s`, icon: '⚡', color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-full p-3 text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Health */}
      {health && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full ${health.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {health.status === 'ok' ? '✅ Healthy' : '❌ Unhealthy'}
            </div>
            <span className="text-sm text-gray-600">Service: {health.service}</span>
            <span className="text-sm text-gray-500">{new Date(health.timestamp).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Flow Executions</h2>
        {recentExecutions.length > 0 ? (
          <div className="space-y-3">
            {recentExecutions.slice(0, 5).map((exec, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{exec.flow_name || 'Unknown Flow'}</p>
                  <p className="text-sm text-gray-500">ID: {exec.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    exec.status === 'completed' ? 'bg-green-100 text-green-800' :
                    exec.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {exec.status || 'unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No executions yet. Trigger a flow to see activity.</p>
        )}
      </div>

      {/* Real-time Events Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-time Events (Last 10)</h2>
        {events.length > 0 ? (
          <div className="space-y-2">
            {events.slice(0, 10).map((event, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-700">{event.type}</span>
                <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Waiting for events...</p>
        )}
      </div>
    </div>
  );
}

