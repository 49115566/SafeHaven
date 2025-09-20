import React, { useState, useEffect } from 'react';

// Type definitions
type Alert = {
  alertId: string;
  shelterId: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  createdBy: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  timestamp: number;
  createdAt: string;
};

type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
type AlertStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved';

const AlertPriority = {
  CRITICAL: 'critical' as const,
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const
};

const AlertStatus = {
  OPEN: 'open' as const,
  ACKNOWLEDGED: 'acknowledged' as const,
  IN_PROGRESS: 'in_progress' as const,
  RESOLVED: 'resolved' as const
};

interface AlertNotificationProps {
  alert: Alert;
  onDismiss: () => void;
  onAcknowledge: (alertId: string) => void;
  autoHide?: boolean;
  duration?: number;
}

export default function AlertNotification({ 
  alert, 
  onDismiss, 
  onAcknowledge, 
  autoHide = true, 
  duration = 10000 
}: AlertNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && alert.priority !== AlertPriority.CRITICAL) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Allow fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, alert.priority, onDismiss]);

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case AlertPriority.CRITICAL:
        return 'bg-red-600 border-red-700 text-white shadow-red-200';
      case AlertPriority.HIGH:
        return 'bg-orange-500 border-orange-600 text-white shadow-orange-200';
      case AlertPriority.MEDIUM:
        return 'bg-yellow-500 border-yellow-600 text-white shadow-yellow-200';
      case AlertPriority.LOW:
        return 'bg-blue-500 border-blue-600 text-white shadow-blue-200';
      default:
        return 'bg-gray-500 border-gray-600 text-white shadow-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical_emergency': return '🚨';
      case 'security_issue': return '🔒';
      case 'resource_critical': return '⚠️';
      case 'infrastructure_problem': return '🔧';
      case 'capacity_full': return '👥';
      case 'general_assistance': return '🆘';
      default: return '📢';
    }
  };

  const handleAcknowledge = () => {
    onAcknowledge(alert.alertId);
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className={`
        rounded-lg border-2 shadow-lg p-4
        ${getPriorityStyles(alert.priority)}
        ${alert.priority === AlertPriority.CRITICAL ? 'animate-pulse' : ''}
      `}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <span className="text-2xl">{getTypeIcon(alert.type)}</span>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-bold opacity-90">
                  {alert.priority.toUpperCase()} ALERT
                </span>
              </div>
              <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
              {alert.description && (
                <p className="text-xs opacity-90 line-clamp-2">{alert.description}</p>
              )}
              <p className="text-xs opacity-75 mt-1">
                {new Date(alert.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-white hover:text-gray-200 ml-2 text-lg font-bold"
          >
            ×
          </button>
        </div>

        {alert.status === AlertStatus.OPEN && (
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleAcknowledge}
              className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xs font-semibold py-2 px-3 rounded transition-colors"
            >
              Acknowledge
            </button>
            <button
              onClick={handleDismiss}
              className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white text-xs py-2 px-3 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}