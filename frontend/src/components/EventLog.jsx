import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { executionsAPI } from '../services/api';

export default function EventLog() {
  const { events: socketEvents } = useSocket();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [executionEvents, setExecutionEvents] = useState([]);
  
  // Default example events
  const getDefaultEvents = () => {
    const now = Date.now();
    return [
      {
        type: 'flowUpdate',
        timestamp: new Date(now - 300000).toISOString(),
        data: {
          flow_id: 'exec-demo-001',
          flow_name: 'RealTimeCrisisFlow',
          status: 'completed',
          input: { text: 'Is IBM cloud down?', channel: 'twitter' },
          output: { crisis_detected: true, priority: 'P1' },
          crisis_detected: true,
          priority: 'P1'
        }
      },
      {
        type: 'newEvent',
        timestamp: new Date(now - 310000).toISOString(),
        data: {
          event_type: 'ticket_created',
          ticketId: 'TICK-demo-001',
          flow_id: 'exec-demo-001',
          ticket_created: true
        }
      },
      {
        type: 'opsNotification',
        timestamp: new Date(now - 320000).toISOString(),
        data: {
          priority: 'P1',
          incident_id: 'INC-demo-001',
          summary: 'Crisis detected: Cloud outage',
          channels: ['slack', 'pagerduty']
        }
      },
      {
        type: 'flowUpdate',
        timestamp: new Date(now - 600000).toISOString(),
        data: {
          flow_id: 'exec-demo-002',
          flow_name: 'RealTimeCrisisFlow',
          status: 'completed',
          input: { text: 'Billing issue', channel: 'chat' },
          output: { crisis_detected: false, priority: 'P2' },
          crisis_detected: false,
          priority: 'P2'
        }
      },
      {
        type: 'newEvent',
        timestamp: new Date(now - 610000).toISOString(),
        data: {
          event_type: 'ticket_created',
          ticketId: 'TICK-demo-002',
          flow_id: 'exec-demo-002',
          ticket_created: true
        }
      }
    ];
  };

  // Generate events from executions data
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await executionsAPI.getAll({ limit: 50 });
        let executions = response.data?.executions || [];
        
        console.log(`[EventLog] Loaded ${executions.length} executions for events`);
        
        // If no executions, use default data
        if (executions.length === 0) {
          console.log('[EventLog] No executions found, using default example events');
          const defaultEvents = getDefaultEvents();
          setExecutionEvents(defaultEvents);
          return;
        }
        
        // Convert executions to events
        const eventsFromExecutions = executions.map(exec => {
          // Determine event type based on execution data
          let eventType = 'flowUpdate';
          if (exec.output?.ticket_created) eventType = 'newEvent';
          if (exec.output?.ops_notified) eventType = 'opsNotification';
          
          return {
            type: eventType,
            timestamp: exec.created_at || exec.start_time || new Date().toISOString(),
            data: {
              flow_id: exec.id,
              flow_name: exec.flow_name,
              status: exec.status,
              input: exec.input,
              output: exec.output,
              crisis_detected: exec.output?.crisis_detected,
              priority: exec.output?.priority,
              ticket_created: exec.output?.ticket_created,
              ticketId: exec.output?.ticketId
            }
          };
        });
        
        setExecutionEvents(eventsFromExecutions);
        console.log(`[EventLog] Generated ${eventsFromExecutions.length} events`);
      } catch (error) {
        console.error('[EventLog] Failed to load execution events:', error);
        // On error, use default data
        setExecutionEvents(getDefaultEvents());
      }
    };
    
    loadEvents();
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Combine Socket.io events with execution events
  const events = [...socketEvents, ...executionEvents].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  const eventTypes = ['all', 'flowUpdate', 'newEvent', 'opsNotification', 'humanApproval'];

  const filteredEvents = events.filter(event => {
    const matchesType = filter === 'all' || event.type === filter;
    const matchesSearch = searchTerm === '' || 
      JSON.stringify(event.data).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getEventIcon = (type) => {
    switch (type) {
      case 'flowUpdate': return '🔄';
      case 'newEvent': return '📝';
      case 'opsNotification': return '🔔';
      case 'humanApproval': return '👤';
      default: return '📌';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'flowUpdate': return 'bg-blue-100 text-blue-800';
      case 'newEvent': return 'bg-green-100 text-green-800';
      case 'opsNotification': return 'bg-yellow-100 text-yellow-800';
      case 'humanApproval': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filter === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Event Count */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredEvents.length}</span> of{' '}
          <span className="font-semibold">{events.length}</span> events
        </p>
      </div>

      {/* Event List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {events.length === 0
              ? 'No events yet. Events will appear here as they occur.'
              : 'No events match your filters.'}
          </div>
        ) : (
          filteredEvents.map((event, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${getEventColor(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {event.type.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getEventColor(event.type)}`}>
                      {event.type}
                    </span>
                  </div>
                  
                  {event.data && (
                    <div className="mt-3">
                      <details className="cursor-pointer">
                        <summary className="text-sm text-gray-600 hover:text-gray-900">
                          View Details
                        </summary>
                        <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Auto-scroll indicator */}
      {filteredEvents.length > 10 && (
        <div className="text-center text-sm text-gray-500">
          Scroll to see more events...
        </div>
      )}
    </div>
  );
}

