import { useNotificationContext } from '../contexts/NotificationContext';

export default function NotificationCenter() {
  const { notifications, removeNotification, clearAll } = useNotificationContext();

  if (notifications.length === 0) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'crisis': return '🚨';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'crisis': return 'bg-red-50 border-red-200';
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getNotificationColor(notification.type)} border rounded-lg shadow-lg p-4 animate-slide-in-right`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title || 'Notification'}
                </p>
                {notification.message && (
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                )}
                {notification.timestamp && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      {notifications.length > 1 && (
        <button
          onClick={clearAll}
          className="w-full text-xs text-gray-500 hover:text-gray-700 text-center py-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

