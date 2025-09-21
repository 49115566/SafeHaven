import React from 'react';
import { Alert, AlertPriority, AlertStatus, AlertType } from 'safehaven-shared';

interface AlertDetailsModalProps {
  alert: Alert;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
}

export default function AlertDetailsModal({ alert, onClose, onAcknowledge }: AlertDetailsModalProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case AlertPriority.CRITICAL: return 'text-red-600 bg-red-100';
      case AlertPriority.HIGH: return 'text-orange-600 bg-orange-100';
      case AlertPriority.MEDIUM: return 'text-yellow-600 bg-yellow-100';
      case AlertPriority.LOW: return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
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

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case AlertStatus.OPEN: return 'text-red-600 bg-red-100';
      case AlertStatus.ACKNOWLEDGED: return 'text-yellow-600 bg-yellow-100';
      case AlertStatus.IN_PROGRESS: return 'text-blue-600 bg-blue-100';
      case AlertStatus.RESOLVED: return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleAcknowledge = () => {
    onAcknowledge(alert.alertId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getTypeIcon(alert.type)}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Alert Details</h2>
                <p className="text-sm text-gray-600">Alert ID: {alert.alertId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Alert Information */}
          <div className="space-y-6">
            {/* Title and Priority */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(alert.priority)}`}>
                  {alert.priority.toUpperCase()} PRIORITY
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(alert.status)}`}>
                  {alert.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{alert.title}</h3>
              <p className="text-sm text-gray-600">
                Type: {getTypeLabel(alert.type)}
              </p>
            </div>

            {/* Description */}
            {alert.description && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{alert.description}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Created</h4>
                <p className="text-sm text-gray-600">
                  {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>
              
              {alert.acknowledgedAt && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Acknowledged</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(alert.acknowledgedAt).toLocaleString()}
                  </p>
                  {alert.acknowledgedBy && (
                    <p className="text-xs text-gray-500">by {alert.acknowledgedBy}</p>
                  )}
                </div>
              )}
              
              {alert.resolvedAt && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Resolved</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(alert.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Shelter Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Shelter Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Shelter ID:</span> {alert.shelterId}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Created by:</span> {alert.createdBy}
                </p>
              </div>
            </div>

            {/* Priority Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Priority Guidelines</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <p><span className="font-semibold">Critical:</span> Immediate life-threatening situations</p>
                <p><span className="font-semibold">High:</span> Urgent situations requiring quick response</p>
                <p><span className="font-semibold">Medium:</span> Important but not immediately critical</p>
                <p><span className="font-semibold">Low:</span> Non-urgent assistance requests</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            
            {alert.status === AlertStatus.OPEN && (
              <button
                onClick={handleAcknowledge}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Acknowledge Alert
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}