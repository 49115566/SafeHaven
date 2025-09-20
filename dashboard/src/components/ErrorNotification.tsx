import React, { useState, useEffect } from 'react';
import { SafeHavenError, useErrorHandler } from '../utils/errorHandler';

interface ErrorNotificationProps {
  error: SafeHavenError;
  onDismiss: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const { getUserFriendlyMessage } = useErrorHandler();

  useEffect(() => {
    if (autoHide && error.code !== 'CRITICAL_ERROR') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, error.code]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Allow fade out animation
  };

  const getNotificationStyle = () => {
    const baseStyle = 'fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50 transition-all duration-300';
    
    if (!isVisible) {
      return `${baseStyle} opacity-0 transform translate-x-full`;
    }

    switch (error.code) {
      case 'CRITICAL_ERROR':
        return `${baseStyle} bg-red-600 text-white`;
      case 'NETWORK_ERROR':
        return `${baseStyle} bg-orange-500 text-white`;
      case 'AUTHENTICATION_ERROR':
        return `${baseStyle} bg-yellow-500 text-white`;
      case 'VALIDATION_ERROR':
        return `${baseStyle} bg-blue-500 text-white`;
      default:
        return `${baseStyle} bg-gray-600 text-white`;
    }
  };

  const getIcon = () => {
    switch (error.code) {
      case 'CRITICAL_ERROR':
        return '🚨';
      case 'NETWORK_ERROR':
        return '🌐';
      case 'AUTHENTICATION_ERROR':
        return '🔐';
      case 'VALIDATION_ERROR':
        return '⚠️';
      case 'WEBSOCKET_ERROR':
        return '🔌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={getNotificationStyle()}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 text-xl">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">
            {error.code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </h4>
          <p className="text-sm opacity-90">
            {getUserFriendlyMessage(error)}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                Technical Details
              </summary>
              <div className="mt-1 text-xs opacity-75 font-mono">
                <div>Code: {error.code}</div>
                <div>Message: {error.message}</div>
                {error.statusCode && <div>Status: {error.statusCode}</div>}
              </div>
            </details>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-3 text-white hover:text-gray-200 focus:outline-none"
          aria-label="Dismiss notification"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface ErrorNotificationManagerProps {
  maxNotifications?: number;
}

export const ErrorNotificationManager: React.FC<ErrorNotificationManagerProps> = ({
  maxNotifications = 3
}) => {
  const [notifications, setNotifications] = useState<Array<{ id: string; error: SafeHavenError }>>([]);
  const { onError } = useErrorHandler();

  useEffect(() => {
    const unsubscribe = onError((error: SafeHavenError) => {
      const id = Date.now().toString();
      
      setNotifications(prev => {
        const newNotifications = [{ id, error }, ...prev];
        
        // Limit number of notifications
        if (newNotifications.length > maxNotifications) {
          return newNotifications.slice(0, maxNotifications);
        }
        
        return newNotifications;
      });
    });

    return unsubscribe;
  }, [maxNotifications, onError]);

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ top: `${1 + index * 6}rem` }}
          className="fixed right-4 z-50"
        >
          <ErrorNotification
            error={notification.error}
            onDismiss={() => handleDismiss(notification.id)}
          />
        </div>
      ))}
    </>
  );
};

export default ErrorNotification;