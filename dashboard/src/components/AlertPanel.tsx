import React, { useState, useEffect } from 'react';
import { useActiveAlerts, useRealtimeData } from '../hooks/useRealtimeData';
import AlertDetailsModal from './AlertDetailsModal';
import { Alert, AlertPriority, AlertStatus, AlertType } from 'safehaven-shared';

interface AlertPanelProps {
  className?: string;
}

export default function AlertPanel({ className = '' }: AlertPanelProps) {
  const alerts = useActiveAlerts();
  const { acknowledgeAlert } = useRealtimeData();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filter, setFilter] = useState<{
    priority?: string;
    type?: string;
    status?: string;
  }>({});
  const [sortBy, setSortBy] = useState<'priority' | 'time' | 'type'>('priority');

  // Play sound for critical alerts
  useEffect(() => {
    const criticalAlerts = alerts.filter(
      alert => alert.priority === AlertPriority.CRITICAL && alert.status === AlertStatus.OPEN
    );
    
    if (criticalAlerts.length > 0 && typeof window !== 'undefined' && !process.env.NODE_ENV?.includes('test')) {
      try {
        // Create audio notification for critical alerts
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            // Ignore audio play errors (browser restrictions)
          });
        }
      } catch (error) {
        // Ignore audio errors in test environment
      }
    }
  }, [alerts]);

  // Filter and sort alerts
  const filteredAlerts = alerts
    .filter(alert => {
      if (filter.priority && alert.priority !== filter.priority) return false;
      if (filter.type && alert.type !== filter.type) return false;
      if (filter.status && alert.status !== filter.status) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'time':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case AlertPriority.CRITICAL: return 'border-red-500 bg-red-50';
      case AlertPriority.HIGH: return 'border-orange-500 bg-orange-50';
      case AlertPriority.MEDIUM: return 'border-yellow-500 bg-yellow-50';
      case AlertPriority.LOW: return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case AlertPriority.CRITICAL: return 'bg-red-600 text-white';
      case AlertPriority.HIGH: return 'bg-orange-600 text-white';
      case AlertPriority.MEDIUM: return 'bg-yellow-600 text-white';
      case AlertPriority.LOW: return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case AlertType.MEDICAL_EMERGENCY: return '🏥';
      case AlertType.SECURITY_ISSUE: return '🔒';
      case AlertType.RESOURCE_CRITICAL: return '⚠️';
      case AlertType.INFRASTRUCTURE_PROBLEM: return '🔧';
      case AlertType.CAPACITY_FULL: return '👥';
      case AlertType.GENERAL_ASSISTANCE: return '🆘';
      default: return '📢';
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Alert Management</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            value={filter.priority || ''}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value || undefined })}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All Priorities</option>
            <option value={AlertPriority.CRITICAL}>Critical</option>
            <option value={AlertPriority.HIGH}>High</option>
            <option value={AlertPriority.MEDIUM}>Medium</option>
            <option value={AlertPriority.LOW}>Low</option>
          </select>

          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All Statuses</option>
            <option value={AlertStatus.OPEN}>Open</option>
            <option value={AlertStatus.ACKNOWLEDGED}>Acknowledged</option>
            <option value={AlertStatus.IN_PROGRESS}>In Progress</option>
            <option value={AlertStatus.RESOLVED}>Resolved</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'priority' | 'time' | 'type')}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="priority">Sort by Priority</option>
            <option value="time">Sort by Time</option>
            <option value="type">Sort by Type</option>
          </select>

          {(filter.priority || filter.status) && (
            <button
              onClick={() => setFilter({})}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Alert List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📢</div>
              <div>No alerts match your filters</div>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.alertId}
                className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(alert.priority)}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getTypeIcon(alert.type)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadgeColor(alert.priority)}`}>
                        {alert.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {alert.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    
                    <div className="font-semibold text-gray-900 mb-1">
                      {alert.title}
                    </div>
                    
                    {alert.description && (
                      <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {alert.description}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        alert.status === AlertStatus.OPEN ? 'bg-red-100 text-red-800' :
                        alert.status === AlertStatus.ACKNOWLEDGED ? 'bg-yellow-100 text-yellow-800' :
                        alert.status === AlertStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {alert.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                  
                  {alert.status === AlertStatus.OPEN && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcknowledgeAlert(alert.alertId);
                      }}
                      className="ml-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <AlertDetailsModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={handleAcknowledgeAlert}
        />
      )}
    </div>
  );
}