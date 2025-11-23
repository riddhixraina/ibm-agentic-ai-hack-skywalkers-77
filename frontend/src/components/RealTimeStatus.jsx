export default function RealTimeStatus({ connected, httpHealthy }) {
  // On Vercel/serverless, Socket.io won't work, so prioritize HTTP health
  // For local dev, Socket.io connection is preferred
  const isConnected = httpHealthy !== undefined ? httpHealthy : connected;
  const statusText = httpHealthy !== undefined 
    ? (httpHealthy ? 'Connected (HTTP)' : 'Disconnected')
    : (connected ? 'Connected (WebSocket)' : 'Disconnected');

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm text-gray-600">
        {statusText}
      </span>
    </div>
  );
}

