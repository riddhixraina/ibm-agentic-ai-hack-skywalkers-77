import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import Dashboard from './components/Dashboard';
import FlowExecutions from './components/FlowExecutions';
import CrisisMonitor from './components/CrisisMonitor';
import EventLog from './components/EventLog';
import RealTimeStatus from './components/RealTimeStatus';

function App() {
  const { connected } = useSocket();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'executions', label: 'Flow Executions', icon: '🔄' },
    { id: 'crises', label: 'Crisis Monitor', icon: '🚨' },
    { id: 'events', label: 'Event Log', icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">ResolveAI 360</h1>
              <span className="text-sm text-gray-500">Crisis Management System</span>
            </div>
            <RealTimeStatus connected={connected} />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'executions' && <FlowExecutions />}
        {activeTab === 'crises' && <CrisisMonitor />}
        {activeTab === 'events' && <EventLog />}
      </main>
    </div>
  );
}

export default App;

