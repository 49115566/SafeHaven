import React, { useState, useEffect } from 'react';
import { Shelter, ShelterStatus, AlertStatus, Alert } from 'safehaven-shared';
import AwsLocationMap from '../components/AwsLocationMap';
import ConnectionStatusIndicator from '../components/ConnectionStatusIndicator';
import AlertPanel from '../components/AlertPanel';
import AlertNotification from '../components/AlertNotification';
import { useShelters, useActiveAlerts, useShelterStats, useConnectionStatus, useRealtimeData } from '../hooks/useRealtimeData';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { state, refreshData, acknowledgeAlert } = useRealtimeData();
  const shelters = useShelters();
  const activeAlerts = useActiveAlerts();
  const stats = useShelterStats();
  const connectionStatus = useConnectionStatus();
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [showAlertPanel, setShowAlertPanel] = useState(false);

  // Handle new alert notifications
  useEffect(() => {
    const newAlerts = activeAlerts.filter(alert => 
      alert.status === AlertStatus.OPEN && 
      !notifications.some(n => n.alertId === alert.alertId)
    );
    
    if (newAlerts.length > 0) {
      setNotifications(prev => [...prev, ...newAlerts]);
    }
  }, [activeAlerts, notifications]);

  // Connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return `Error: ${connectionStatus.lastError}`;
      default:
        return 'Unknown';
    }
  };

  // Handle shelter selection from map
  const handleShelterClick = (shelter: Shelter) => {
    setSelectedShelter(shelter);
  };

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      // Remove from notifications
      setNotifications(prev => prev.filter(n => n.alertId !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  // Handle notification dismissal
  const handleDismissNotification = (alertId: string) => {
    setNotifications(prev => prev.filter(n => n.alertId !== alertId));
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 font-semibold mb-2">Error Loading Dashboard</div>
          <div className="text-gray-600 mb-4">{state.error}</div>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConnectionStatusIndicator />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                SafeHaven Dashboard
              </h1>
              <div className="ml-4 flex items-center">
                <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
                <span className="ml-2 text-sm text-gray-600">
                  {getConnectionStatusText()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Refresh
              </button>
              
              <div className="text-sm text-gray-600">
                Welcome, {user?.profile.firstName} {user?.profile.lastName}
              </div>
              
              <button
                onClick={logout}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Map Section */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Live Shelter Map</h2>
                <div className="text-sm text-gray-500">
                  {state.lastUpdated && (
                    <>Last updated: {state.lastUpdated.toLocaleTimeString()}</>
                  )}
                </div>
              </div>
              <AwsLocationMap 
                shelters={shelters} 
                onShelterClick={handleShelterClick}
                className="h-96" 
              />
            </div>

            {/* Shelter List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Shelter Status</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shelter Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resources
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shelters.map((shelter) => {
                      const statusColor = 
                        shelter.status === ShelterStatus.AVAILABLE ? 'text-green-600' :
                        shelter.status === ShelterStatus.LIMITED ? 'text-yellow-600' :
                        shelter.status === ShelterStatus.FULL ? 'text-orange-600' :
                        shelter.status === ShelterStatus.EMERGENCY ? 'text-red-600' :
                        'text-gray-600';
                      
                      return (
                        <tr 
                          key={shelter.shelterId} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedShelter(shelter)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {shelter.name}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${statusColor}`}>
                            {shelter.status.charAt(0).toUpperCase() + shelter.status.slice(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shelter.capacity.current}/{shelter.capacity.maximum}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-1">
                              <span title="Food">🍽️</span>
                              <span title="Water">💧</span>
                              <span title="Medical">🏥</span>
                              <span title="Bedding">🛏️</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(shelter.lastUpdated).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Shelters:</span>
                  <span className="font-semibold text-lg">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Operational:</span>
                  <span className="font-semibold text-lg text-green-600">{stats.operational}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available Capacity:</span>
                  <span className="font-semibold text-lg text-blue-600">{stats.availableCapacity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Occupancy:</span>
                  <span className="font-semibold text-lg">{stats.currentOccupancy}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Status Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600">Available:</span>
                    <span>{stats.byStatus.available}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600">Limited:</span>
                    <span>{stats.byStatus.limited}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600">Full:</span>
                    <span>{stats.byStatus.full}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Emergency:</span>
                    <span>{stats.byStatus.emergency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Offline:</span>
                    <span>{stats.byStatus.offline}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Alerts Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Active Alerts</h2>
                <button
                  onClick={() => setShowAlertPanel(!showAlertPanel)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showAlertPanel ? 'Hide' : 'Manage'} Alerts
                </button>
              </div>
              
              {activeAlerts.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-3xl mb-2">✅</div>
                  <div>No active alerts</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.slice(0, 3).map((alert) => (
                    <div 
                      key={alert.alertId} 
                      className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                        alert.priority === 'critical' ? 'border-red-500 bg-red-50' :
                        alert.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                        alert.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}
                      onClick={() => setShowAlertPanel(true)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              alert.priority === 'critical' ? 'bg-red-600 text-white' :
                              alert.priority === 'high' ? 'bg-orange-600 text-white' :
                              alert.priority === 'medium' ? 'bg-yellow-600 text-white' :
                              'bg-blue-600 text-white'
                            }`}>
                              {alert.priority.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {alert.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(alert.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {alert.status === AlertStatus.OPEN && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledgeAlert(alert.alertId);
                            }}
                            className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {activeAlerts.length > 3 && (
                    <button
                      onClick={() => setShowAlertPanel(true)}
                      className="w-full text-sm text-blue-600 hover:text-blue-800 text-center py-2 border border-blue-200 rounded hover:bg-blue-50"
                    >
                      View all {activeAlerts.length} alerts
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Selected Shelter Details */}
            {selectedShelter && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Shelter Details</h2>
                  <button
                    onClick={() => setSelectedShelter(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold">Name:</span> {selectedShelter.name}
                  </div>
                  <div>
                    <span className="font-semibold">Address:</span> {selectedShelter.location.address}
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span> 
                    <span className={`ml-1 font-semibold ${
                      selectedShelter.status === ShelterStatus.AVAILABLE ? 'text-green-600' :
                      selectedShelter.status === ShelterStatus.LIMITED ? 'text-yellow-600' :
                      selectedShelter.status === ShelterStatus.FULL ? 'text-orange-600' :
                      selectedShelter.status === ShelterStatus.EMERGENCY ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {selectedShelter.status.charAt(0).toUpperCase() + selectedShelter.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Capacity:</span> {selectedShelter.capacity.current}/{selectedShelter.capacity.maximum}
                  </div>
                  <div>
                    <span className="font-semibold">Contact:</span> {selectedShelter.contactInfo.phone}
                  </div>
                  {selectedShelter.urgentNeeds && selectedShelter.urgentNeeds.length > 0 && (
                    <div>
                      <span className="font-semibold text-red-600">Urgent Needs:</span>
                      <div className="mt-1 text-red-600">
                        {selectedShelter.urgentNeeds.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Alert Management Panel */}
        {showAlertPanel && (
          <div className="mt-6">
            <AlertPanel className="" />
          </div>
        )}
      </div>

      {/* Alert Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((alert) => (
          <AlertNotification
            key={alert.alertId}
            alert={alert}
            onDismiss={() => handleDismissNotification(alert.alertId)}
            onAcknowledge={handleAcknowledgeAlert}
            autoHide={alert.priority !== 'critical'}
            duration={alert.priority === 'critical' ? 0 : 10000}
          />
        ))}
      </div>
    </div>
  );
}