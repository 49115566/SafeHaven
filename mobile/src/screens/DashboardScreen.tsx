import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { useAppSelector, useAppDispatch } from '../store';
import { syncService } from '../services/syncService';
import { offlineService } from '../services/offlineService';
import { syncPendingUpdates } from '../store/shelterSlice';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { currentShelter, isLoading } = useAppSelector((state) => state.shelter);
  const { user } = useAppSelector((state) => state.auth);
  
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Update sync status
  const updateSyncStatus = async () => {
    const status = await syncService.getSyncStatus();
    setPendingCount(status.pendingUpdatesCount);
    setIsOnline(status.isOnline);
    setLastSync(status.lastSync);
  };

  useEffect(() => {
    // Start auto sync when dashboard loads
    syncService.startAutoSync(30000); // 30 seconds

    // Update status initially
    updateSyncStatus();

    // Update status every 10 seconds
    const interval = setInterval(updateSyncStatus, 10000);

    return () => {
      clearInterval(interval);
      // Don't stop sync here as it should continue in background
    };
  }, []);

  const handleStatusUpdate = () => {
    navigation.navigate('StatusUpdate' as never);
  };

  const handleCreateAlert = () => {
    navigation.navigate('Alert' as never);
  };

  const handleForceSync = async () => {
    try {
      const result = await dispatch(syncPendingUpdates());
      if (syncPendingUpdates.fulfilled.match(result)) {
        Toast.show({
          type: 'success',
          text1: 'Sync Complete',
          text2: 'All pending updates have been synced'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Sync Failed',
          text2: 'Unable to sync pending updates'
        });
      }
      updateSyncStatus();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Sync Error',
        text2: 'An error occurred during sync'
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.profile.firstName || 'Operator'}!</Text>
        <Text style={styles.shelterName}>{currentShelter?.name || 'Loading shelter...'}</Text>
      </View>

      {/* Sync Status */}
      <View style={[styles.statusCard, isOnline ? styles.onlineCard : styles.offlineCard]}>
        <View style={styles.statusHeader}>
          <MaterialIcons 
            name={isOnline ? "wifi" : "wifi-off"} 
            size={24} 
            color={isOnline ? "#10b981" : "#ef4444"} 
          />
          <Text style={styles.statusTitle}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        {pendingCount > 0 && (
          <View style={styles.pendingContainer}>
            <MaterialIcons name="sync-problem" size={20} color="#f59e0b" />
            <Text style={styles.pendingText}>
              {pendingCount} pending update{pendingCount !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity 
              style={styles.syncButton}
              onPress={handleForceSync}
              disabled={!isOnline || isLoading}
            >
              <MaterialIcons name="sync" size={16} color="#ffffff" />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {lastSync && (
          <Text style={styles.lastSyncText}>
            Last sync: {lastSync.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Current Shelter Status */}
      {currentShelter && (
        <View style={styles.shelterCard}>
          <Text style={styles.cardTitle}>Current Status</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Capacity</Text>
              <Text style={styles.statusValue}>
                {currentShelter.capacity.current} / {currentShelter.capacity.maximum}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Status</Text>
              <View style={[styles.statusBadge, getStatusColor(currentShelter.status)]}>
                <Text style={styles.statusBadgeText}>
                  {getStatusLabel(currentShelter.status)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.resourcesContainer}>
            <Text style={styles.resourcesTitle}>Resources</Text>
            <View style={styles.resourcesGrid}>
              {Object.entries(currentShelter.resources).map(([type, status]) => (
                <View key={type} style={styles.resourceItem}>
                  <MaterialIcons 
                    name={getResourceIcon(type)} 
                    size={20} 
                    color={getResourceColor(status)} 
                  />
                  <Text style={styles.resourceLabel}>{type}</Text>
                  <Text style={[styles.resourceStatus, { color: getResourceColor(status) }]}>
                    {status}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.lastUpdated}>
            Last updated: {new Date(currentShelter.lastUpdated).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleStatusUpdate}
        >
          <MaterialIcons name="edit" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Update Status</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.alertButton]}
          onPress={handleCreateAlert}
        >
          <MaterialIcons name="error" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Create Alert</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Helper functions
function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusColor(status: string) {
  switch (status) {
    case 'available': return { backgroundColor: '#10b981' };
    case 'limited': return { backgroundColor: '#f59e0b' };
    case 'full': return { backgroundColor: '#ef4444' };
    case 'emergency': return { backgroundColor: '#dc2626' };
    default: return { backgroundColor: '#6b7280' };
  }
}

function getResourceIcon(type: string): any {
  switch (type) {
    case 'food': return 'restaurant';
    case 'water': return 'opacity';
    case 'medical': return 'medical-services';
    case 'bedding': return 'hotel';
    default: return 'help';
  }
}

function getResourceColor(status: string): string {
  switch (status) {
    case 'adequate': return '#10b981';
    case 'low': return '#f59e0b';
    case 'critical': return '#ef4444';
    case 'unavailable': return '#6b7280';
    default: return '#6b7280';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 4,
  },
  shelterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  onlineCard: {
    borderLeftColor: '#10b981',
  },
  offlineCard: {
    borderLeftColor: '#ef4444',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  pendingText: {
    fontSize: 14,
    color: '#f59e0b',
    marginLeft: 8,
    flex: 1,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  shelterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  resourcesContainer: {
    marginBottom: 16,
  },
  resourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  resourcesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resourceItem: {
    alignItems: 'center',
    flex: 1,
  },
  resourceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  resourceStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  alertButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});