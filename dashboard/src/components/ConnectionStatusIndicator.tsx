import React from 'react';
import { useConnectionStatus } from '../hooks/useRealtimeData';

export default function ConnectionStatusIndicator() {
  const connectionStatus = useConnectionStatus();

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'Real-time updates active';
      case 'connecting':
        return 'Connecting to real-time updates...';
      case 'disconnected':
        return 'Real-time updates disconnected';
      case 'error':
        return `Connection error: ${connectionStatus.lastError || 'Unknown error'}`;
      default:
        return 'Connection status unknown';
    }
  };

  const getReconnectInfo = () => {
    if (connectionStatus.status === 'error' && connectionStatus.reconnectAttempts > 0) {
      return ` (Attempt ${connectionStatus.reconnectAttempts}/5)`;
    }
    return '';
  };

  // Don't show if everything is working fine
  if (connectionStatus.status === 'connected') {
    return null;
  }

  return (
    <div className={`
      fixed top-4 right-4 max-w-sm p-3 rounded-lg shadow-lg z-50 ${
        connectionStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
        connectionStatus.status === 'disconnected' ? 'bg-gray-50 border border-gray-200' :
        'bg-yellow-50 border border-yellow-200'
      }
    `}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-3`}></div>
        <div className="flex-1">
          <div className={`text-sm font-medium ${
            connectionStatus.status === 'error' ? 'text-red-800' :
            connectionStatus.status === 'disconnected' ? 'text-gray-800' :
            'text-yellow-800'
          }`}>
            {getStatusText()}{getReconnectInfo()}
          </div>
          {connectionStatus.status !== 'connecting' && (
            <div className={`text-xs mt-1 ${
              connectionStatus.status === 'error' ? 'text-red-600' :
              connectionStatus.status === 'disconnected' ? 'text-gray-600' :
              'text-yellow-600'
            }`}>
              Data may not be current. Updates will resume when connection is restored.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}