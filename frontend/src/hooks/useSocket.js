import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let newSocket = null;
    
    try {
      newSocket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000
      });

      newSocket.on('connect', () => {
        console.log('Connected to backend via Socket.io');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from backend');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.warn('Socket.io connection failed (using polling fallback):', error.message);
        setConnected(false);
        // Don't throw - gracefully degrade to polling
      });

    // Listen for flow updates
    newSocket.on('flowUpdate', (data) => {
      console.log('Flow update:', data);
      setEvents(prev => [{
        type: 'flowUpdate',
        data,
        timestamp: new Date().toISOString()
      }, ...prev]);
    });

    // Listen for new events
    newSocket.on('newEvent', (data) => {
      console.log('New event:', data);
      setEvents(prev => [{
        type: 'newEvent',
        data,
        timestamp: new Date().toISOString()
      }, ...prev]);
    });

    // Listen for ops notifications
    newSocket.on('opsNotification', (data) => {
      console.log('Ops notification:', data);
      setEvents(prev => [{
        type: 'opsNotification',
        data,
        timestamp: new Date().toISOString()
      }, ...prev]);
    });

    // Listen for human approvals
    newSocket.on('humanApproval', (data) => {
      console.log('Human approval:', data);
      setEvents(prev => [{
        type: 'humanApproval',
        data,
        timestamp: new Date().toISOString()
      }, ...prev]);
    });

      setSocket(newSocket);
    } catch (error) {
      console.warn('Socket.io not available (serverless environment):', error.message);
      setConnected(false);
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  return { socket, connected, events };
}

