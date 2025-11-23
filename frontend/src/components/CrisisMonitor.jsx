import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { executionsAPI } from '../services/api';
import { useNotificationContext } from '../contexts/NotificationContext';

export default function CrisisMonitor() {
  const { events } = useSocket();
  const [crises, setCrises] = useState([]);
  const previousCrisesCount = useRef(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { addNotification } = useNotificationContext();

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Send browser and in-app notifications when new crisis is detected
  useEffect(() => {
    if (crises.length > previousCrisesCount.current) {
      const newCrises = crises.slice(0, crises.length - previousCrisesCount.current);
      newCrises.forEach(crisis => {
        // Browser notification
        if (notificationsEnabled && 'Notification' in window) {
          new Notification(`🚨 Crisis Detected: ${crisis.crisisType}`, {
            body: `${crisis.text.substring(0, 100)}...\nPriority: ${crisis.priority}`,
            icon: '/favicon.ico',
            tag: crisis.id,
            requireInteraction: crisis.priority === 'P0' || crisis.priority === 'P1'
          });
        }
        
        // In-app notification
        addNotification({
          type: 'crisis',
          title: `🚨 ${crisis.crisisType.charAt(0).toUpperCase() + crisis.crisisType.slice(1)} Crisis Detected`,
          message: `${crisis.text.substring(0, 80)}... (Priority: ${crisis.priority})`
        });
      });
    }
    previousCrisesCount.current = crises.length;
  }, [crises, notificationsEnabled, addNotification]);

  useEffect(() => {
    const loadCrises = async () => {
      try {
        const response = await executionsAPI.getAll({ limit: 50 });
        const executions = response.data?.executions || [];
        
        // Extract crises from executions
        // A crisis is detected if:
        // 1. Output indicates crisis_detected: true
        // 2. Input text contains crisis keywords
        // 3. Priority is P0 or P1
        const crisisExecutions = executions.filter(exec => {
          const text = (exec.input?.text || '').toLowerCase();
          const isCrisisKeyword = text.includes('down') || 
                                 text.includes('outage') || 
                                 text.includes('crisis') ||
                                 text.includes('emergency') ||
                                 text.includes('critical');
          const isHighPriority = exec.output?.priority === 'P0' || 
                                exec.output?.priority === 'P1' ||
                                exec.output?.crisis_detected === true;
          return isCrisisKeyword || isHighPriority;
        });

        const crisisEvents = crisisExecutions.map(exec => {
          const text = exec.input?.text || 'Unknown issue';
          let crisisType = 'other';
          if (text.toLowerCase().includes('down') || text.toLowerCase().includes('outage')) {
            crisisType = 'outage';
          } else if (text.toLowerCase().includes('billing') || text.toLowerCase().includes('charge')) {
            crisisType = 'billing';
          } else if (text.toLowerCase().includes('security') || text.toLowerCase().includes('breach')) {
            crisisType = 'security';
          } else if (text.toLowerCase().includes('pr') || text.toLowerCase().includes('tweet')) {
            crisisType = 'PR';
          }

          return {
            id: exec.id,
            timestamp: exec.created_at || exec.start_time || new Date().toISOString(),
            text: text,
            channel: exec.input?.channel || 'unknown',
            crisisType: exec.output?.crisis_type || crisisType,
            crisisScore: exec.output?.crisis_score || 0.8,
            priority: exec.output?.priority || (crisisType === 'outage' ? 'P1' : 'P2'),
            actions: exec.output?.actions_taken || 
                    (exec.output?.ticket_created ? ['ticket_created'] : []) ||
                    (exec.output?.ops_notified ? ['ops_notified'] : []),
            metadata: exec.input?.metadata || {},
            status: exec.status
          };
        });

        // Sort by priority and timestamp (newest first)
        crisisEvents.sort((a, b) => {
          const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
          const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });

        setCrises(crisisEvents);
      } catch (error) {
        console.error('Failed to load crises:', error);
      }
    };

    loadCrises();
    
    // Poll every 5 seconds for new crises
    const interval = setInterval(loadCrises, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const sendTestNotification = () => {
    if (notificationsEnabled) {
      new Notification('🚨 Test Crisis Alert', {
        body: 'This is a test notification. Browser notifications are working!',
        icon: '/favicon.ico'
      });
    } else {
      alert('Please enable browser notifications first. Check your browser settings.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Browser Notifications</h3>
            <p className="text-xs text-gray-500 mt-1">
              {notificationsEnabled 
                ? '✅ Enabled - You will receive alerts for new crises'
                : '⚠️ Disabled - Click to enable notifications'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {!notificationsEnabled && (
              <button
                onClick={() => {
                  if ('Notification' in window) {
                    Notification.requestPermission().then(permission => {
                      setNotificationsEnabled(permission === 'granted');
                      if (permission === 'granted') {
                        new Notification('✅ Notifications Enabled', {
                          body: 'You will now receive alerts for new crises',
                          icon: '/favicon.ico'
                        });
                      }
                    });
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600"
              >
                Enable Notifications
              </button>
            )}
            {notificationsEnabled && (
              <button
                onClick={sendTestNotification}
                className="px-4 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600"
              >
                Test Notification
              </button>
            )}
          </div>
        </div>
      </div>

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

