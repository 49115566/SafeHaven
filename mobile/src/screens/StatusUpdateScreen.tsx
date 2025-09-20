import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { AppState, ShelterStatus, ResourceStatus, ShelterStatusUpdate } from '../types';
import { updateShelterStatusAsync, setLoading, setError } from '../store/shelterSlice';
import { syncService } from '../services/syncService';
import { offlineService } from '../services/offlineService';
import { useAppDispatch, useAppSelector } from '../store';

const { width } = Dimensions.get('window');

export default function StatusUpdateScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { currentShelter, isLoading, error } = useAppSelector((state) => state.shelter);
  const { user } = useAppSelector((state) => state.auth);
  
  // Local state for the update form
  const [currentCapacity, setCurrentCapacity] = useState<number>(0);
  const [maxCapacity, setMaxCapacity] = useState<number>(0);
  const [shelterStatus, setShelterStatus] = useState<ShelterStatus>(ShelterStatus.AVAILABLE);
  const [resources, setResources] = useState({
    food: ResourceStatus.ADEQUATE,
    water: ResourceStatus.ADEQUATE,
    medical: ResourceStatus.ADEQUATE,
    bedding: ResourceStatus.ADEQUATE
  });
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Initialize form values when shelter data is available
  useEffect(() => {
    if (currentShelter) {
      setCurrentCapacity(currentShelter.capacity.current);
      setMaxCapacity(currentShelter.capacity.maximum);
      setShelterStatus(currentShelter.status);
      setResources(currentShelter.resources);
    }
  }, [currentShelter]);

  // Check network status
  useFocusEffect(
    React.useCallback(() => {
      const checkNetworkStatus = async () => {
        const online = await offlineService.isOnline();
        setIsOnline(online);
      };
      
      checkNetworkStatus();
      const interval = setInterval(checkNetworkStatus, 10000); // Check every 10 seconds
      
      return () => clearInterval(interval);
    }, [])
  );

  // Handle capacity updates
  const updateCapacity = (type: 'current' | 'max', operation: 'increment' | 'decrement') => {
    if (type === 'current') {
      const newValue = operation === 'increment' 
        ? Math.min(currentCapacity + 1, maxCapacity)
        : Math.max(currentCapacity - 1, 0);
      setCurrentCapacity(newValue);
    } else {
      const newValue = operation === 'increment' 
        ? maxCapacity + 1
        : Math.max(maxCapacity - 1, currentCapacity);
      setMaxCapacity(newValue);
    }
    setHasUnsavedChanges(true);
  };

  // Handle resource status updates
  const updateResourceStatus = (resourceType: keyof typeof resources) => {
    const statusOrder = [
      ResourceStatus.ADEQUATE,
      ResourceStatus.LOW, 
      ResourceStatus.CRITICAL,
      ResourceStatus.UNAVAILABLE
    ];
    
    const currentIndex = statusOrder.indexOf(resources[resourceType]);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    
    setResources(prev => ({
      ...prev,
      [resourceType]: statusOrder[nextIndex]
    }));
    setHasUnsavedChanges(true);
  };

  // Handle shelter status updates
  const updateStatus = (newStatus: ShelterStatus) => {
    setShelterStatus(newStatus);
    setHasUnsavedChanges(true);
  };

  // Submit status update
  const handleSubmitUpdate = async () => {
    if (!currentShelter || !user) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Missing shelter or user information'
      });
      return;
    }

    try {
      const statusUpdate: Omit<ShelterStatusUpdate, 'shelterId' | 'timestamp'> = {
        capacity: {
          current: currentCapacity,
          maximum: maxCapacity
        },
        resources,
        status: shelterStatus
      };

      // Use the async thunk for updating
      const result = await dispatch(updateShelterStatusAsync({
        shelterId: currentShelter.shelterId,
        statusUpdate
      }));

      if (updateShelterStatusAsync.fulfilled.match(result)) {
        if (result.payload.wasOffline) {
          Toast.show({
            type: 'info',
            text1: 'Queued for Sync',
            text2: 'Update saved locally and will sync when online'
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Status Updated',
            text2: 'Your shelter status has been updated successfully'
          });
        }
        setHasUnsavedChanges(false);
      } else {
        const error = result.payload as any;
        if (error?.queued) {
          Toast.show({
            type: 'warning',
            text1: 'Update Queued',
            text2: 'Network issue - update will sync when connection improves'
          });
          setHasUnsavedChanges(false);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Update Failed',
            text2: error?.message || 'Failed to update shelter status'
          });
        }
      }
    } catch (error: any) {
      console.error('Status update failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update shelter status'
      });
      dispatch(setError(error.message));
    }
  };

  // Show confirmation when there are unsaved changes
  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (!currentShelter) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>No shelter data available</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Network Status Indicator */}
      <View style={[styles.networkStatus, isOnline ? styles.online : styles.offline]}>
        <MaterialIcons 
          name={isOnline ? "wifi" : "wifi-off"} 
          size={16} 
          color="#ffffff" 
        />
        <Text style={styles.networkStatusText}>
          {isOnline ? 'Online' : 'Offline - Changes will sync later'}
        </Text>
      </View>

      {/* Shelter Info Header */}
      <View style={styles.headerCard}>
        <Text style={styles.shelterName}>{currentShelter.name}</Text>
        <Text style={styles.shelterAddress}>{currentShelter.location.address}</Text>
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(currentShelter.lastUpdated).toLocaleString()}
        </Text>
      </View>

      {/* Capacity Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Capacity Management</Text>
        
        <View style={styles.capacityRow}>
          <View style={styles.capacityItem}>
            <Text style={styles.capacityLabel}>Current Occupancy</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => updateCapacity('current', 'decrement')}
                disabled={currentCapacity <= 0}
              >
                <MaterialIcons name="remove" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{currentCapacity}</Text>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => updateCapacity('current', 'increment')}
                disabled={currentCapacity >= maxCapacity}
              >
                <MaterialIcons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.capacityItem}>
            <Text style={styles.capacityLabel}>Maximum Capacity</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => updateCapacity('max', 'decrement')}
                disabled={maxCapacity <= currentCapacity}
              >
                <MaterialIcons name="remove" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{maxCapacity}</Text>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => updateCapacity('max', 'increment')}
              >
                <MaterialIcons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.capacityIndicator}>
          <Text style={styles.capacityPercentage}>
            {maxCapacity > 0 ? Math.round((currentCapacity / maxCapacity) * 100) : 0}% Full
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${maxCapacity > 0 ? (currentCapacity / maxCapacity) * 100 : 0}%`,
                  backgroundColor: getCapacityColor(currentCapacity, maxCapacity)
                }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Shelter Status Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Shelter Status</Text>
        <View style={styles.statusGrid}>
          {Object.values(ShelterStatus).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                shelterStatus === status && styles.statusButtonActive
              ]}
              onPress={() => updateStatus(status)}
            >
              <MaterialIcons 
                name={getStatusIcon(status)} 
                size={24} 
                color={shelterStatus === status ? "#ffffff" : "#374151"} 
              />
              <Text style={[
                styles.statusButtonText,
                shelterStatus === status && styles.statusButtonTextActive
              ]}>
                {getStatusLabel(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Resources Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Resource Status</Text>
        <View style={styles.resourcesGrid}>
          {Object.entries(resources).map(([resourceType, status]) => (
            <TouchableOpacity
              key={resourceType}
              style={[styles.resourceButton, { backgroundColor: getResourceColor(status) }]}
              onPress={() => updateResourceStatus(resourceType as keyof typeof resources)}
            >
              <MaterialIcons 
                name={getResourceIcon(resourceType)} 
                size={32} 
                color="#ffffff" 
              />
              <Text style={styles.resourceLabel}>
                {getResourceLabel(resourceType)}
              </Text>
              <Text style={styles.resourceStatus}>
                {getResourceStatusLabel(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Update Button */}
      <TouchableOpacity 
        style={[
          styles.updateButton,
          (!hasUnsavedChanges || isLoading) && styles.updateButtonDisabled
        ]}
        onPress={handleSubmitUpdate}
        disabled={!hasUnsavedChanges || isLoading}
      >
        {isLoading ? (
          <MaterialIcons name="sync" size={24} color="#ffffff" />
        ) : (
          <MaterialIcons name="send" size={24} color="#ffffff" />
        )}
        <Text style={styles.updateButtonText}>
          {isLoading ? 'Updating...' : 'Update Status'}
        </Text>
      </TouchableOpacity>

      {/* Save indicator */}
      {hasUnsavedChanges && (
        <View style={styles.saveIndicator}>
          <MaterialIcons name="edit" size={16} color="#f59e0b" />
          <Text style={styles.saveIndicatorText}>You have unsaved changes</Text>
        </View>
      )}
    </ScrollView>
  );
}

// Helper functions
function getCapacityColor(current: number, max: number): string {
  if (max === 0) return '#10b981';
  const percentage = (current / max) * 100;
  if (percentage >= 90) return '#ef4444';
  if (percentage >= 70) return '#f59e0b';
  return '#10b981';
}

function getStatusIcon(status: ShelterStatus): any {
  switch (status) {
    case ShelterStatus.AVAILABLE: return 'check-circle';
    case ShelterStatus.LIMITED: return 'warning';
    case ShelterStatus.FULL: return 'block';
    case ShelterStatus.EMERGENCY: return 'error';
    case ShelterStatus.OFFLINE: return 'wifi-off';
    default: return 'help';
  }
}

function getStatusLabel(status: ShelterStatus): string {
  switch (status) {
    case ShelterStatus.AVAILABLE: return 'Available';
    case ShelterStatus.LIMITED: return 'Limited';
    case ShelterStatus.FULL: return 'Full';
    case ShelterStatus.EMERGENCY: return 'Emergency';
    case ShelterStatus.OFFLINE: return 'Offline';
    default: return status;
  }
}

function getResourceIcon(resourceType: string): any {
  switch (resourceType) {
    case 'food': return 'restaurant';
    case 'water': return 'opacity';
    case 'medical': return 'medical-services';
    case 'bedding': return 'hotel';
    default: return 'help';
  }
}

function getResourceLabel(resourceType: string): string {
  switch (resourceType) {
    case 'food': return 'Food';
    case 'water': return 'Water';
    case 'medical': return 'Medical';
    case 'bedding': return 'Bedding';
    default: return resourceType;
  }
}

function getResourceStatusLabel(status: ResourceStatus): string {
  switch (status) {
    case ResourceStatus.ADEQUATE: return 'Adequate';
    case ResourceStatus.LOW: return 'Low';
    case ResourceStatus.CRITICAL: return 'Critical';
    case ResourceStatus.UNAVAILABLE: return 'None';
    default: return status;
  }
}

function getResourceColor(status: ResourceStatus): string {
  switch (status) {
    case ResourceStatus.ADEQUATE: return '#10b981';
    case ResourceStatus.LOW: return '#f59e0b';
    case ResourceStatus.CRITICAL: return '#ef4444';
    case ResourceStatus.UNAVAILABLE: return '#6b7280';
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
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
  },
  online: {
    backgroundColor: '#10b981',
  },
  offline: {
    backgroundColor: '#ef4444',
  },
  networkStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  headerCard: {
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
  shelterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  shelterAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  capacityItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  capacityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  capacityIndicator: {
    alignItems: 'center',
  },
  capacityPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: (width - 80) / 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#1d4ed8',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resourceButton: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: (width - 80) / 2,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  resourceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
  },
  resourceStatus: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.9,
  },
  updateButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  saveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  saveIndicatorText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 6,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
