import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert as RNAlert,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppDispatch, useAppSelector } from '../store';
import { createAlertAsync, fetchAlertsAsync, acknowledgeAlertAsync, clearError } from '../store/alertSlice';
import { AlertType, AlertPriority } from '../types';

const { width } = Dimensions.get('window');

export default function AlertScreen() {
  const dispatch = useAppDispatch();
  const { alerts, isLoading, error } = useAppSelector((state) => state.alerts);
  const { currentShelter } = useAppSelector((state) => state.shelter);
  const { user } = useAppSelector((state) => state.auth);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<AlertType>(AlertType.GENERAL_ASSISTANCE);
  const [selectedPriority, setSelectedPriority] = useState<AlertPriority>(AlertPriority.MEDIUM);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (currentShelter) {
      dispatch(fetchAlertsAsync(currentShelter.shelterId));
    }
  }, [currentShelter, dispatch]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Alert Error',
        text2: error
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreateAlert = () => {
    if (!currentShelter || !title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please provide a title for the alert'
      });
      return;
    }

    RNAlert.alert(
      'Confirm Emergency Alert',
      `Send ${selectedPriority} priority ${getAlertTypeLabel(selectedType)} alert?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: () => {
            dispatch(createAlertAsync({
              shelterId: currentShelter.shelterId,
              type: selectedType,
              title: title.trim(),
              description: description.trim(),
              priority: selectedPriority
            })).then((result) => {
              if (createAlertAsync.fulfilled.match(result)) {
                Toast.show({
                  type: 'success',
                  text1: 'Alert Sent',
                  text2: 'Emergency alert has been sent to first responders'
                });
                setShowCreateModal(false);
                resetForm();
              }
            });
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedType(AlertType.GENERAL_ASSISTANCE);
    setSelectedPriority(AlertPriority.MEDIUM);
  };

  const getAlertTypeLabel = (type: AlertType): string => {
    switch (type) {
      case AlertType.MEDICAL_EMERGENCY: return 'Medical Emergency';
      case AlertType.SECURITY_ISSUE: return 'Security Issue';
      case AlertType.RESOURCE_CRITICAL: return 'Resource Critical';
      case AlertType.INFRASTRUCTURE_PROBLEM: return 'Infrastructure Problem';
      case AlertType.CAPACITY_FULL: return 'Capacity Full';
      case AlertType.GENERAL_ASSISTANCE: return 'General Assistance';
      default: return type;
    }
  };

  const getAlertTypeIcon = (type: AlertType): string => {
    switch (type) {
      case AlertType.MEDICAL_EMERGENCY: return 'medical-services';
      case AlertType.SECURITY_ISSUE: return 'security';
      case AlertType.RESOURCE_CRITICAL: return 'warning';
      case AlertType.INFRASTRUCTURE_PROBLEM: return 'build';
      case AlertType.CAPACITY_FULL: return 'people';
      case AlertType.GENERAL_ASSISTANCE: return 'help';
      default: return 'help';
    }
  };

  const getPriorityColor = (priority: AlertPriority): string => {
    switch (priority) {
      case AlertPriority.CRITICAL: return '#ef4444';
      case AlertPriority.HIGH: return '#f59e0b';
      case AlertPriority.MEDIUM: return '#3b82f6';
      case AlertPriority.LOW: return '#10b981';
      default: return '#6b7280';
    }
  };

  if (!currentShelter) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>No shelter data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Emergency Alert Button */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => setShowCreateModal(true)}
      >
        <MaterialIcons name="warning" size={32} color="#ffffff" />
        <Text style={styles.emergencyButtonText}>SEND EMERGENCY ALERT</Text>
      </TouchableOpacity>

      {/* Alert History */}
      <ScrollView style={styles.alertsList}>
        <Text style={styles.sectionTitle}>Alert History</Text>
        
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-none" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No alerts sent yet</Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.alertId} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.alertTypeContainer}>
                  <MaterialIcons
                    name={getAlertTypeIcon(alert.type) as any}
                    size={24}
                    color={getPriorityColor(alert.priority)}
                  />
                  <Text style={styles.alertType}>{getAlertTypeLabel(alert.type)}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(alert.priority) }]}>
                  <Text style={styles.priorityText}>{alert.priority.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.alertTitle}>{alert.title}</Text>
              {alert.description && (
                <Text style={styles.alertDescription}>{alert.description}</Text>
              )}
              
              <View style={styles.alertFooter}>
                <Text style={styles.alertTime}>
                  {new Date(alert.createdAt).toLocaleString()}
                </Text>
                <View style={[styles.statusBadge, 
                  { backgroundColor: alert.status === 'acknowledged' ? '#10b981' : '#f59e0b' }
                ]}>
                  <Text style={styles.statusText}>{alert.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Alert Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Emergency Alert</Text>
            
            {/* Alert Type Selection */}
            <Text style={styles.fieldLabel}>Alert Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {Object.values(AlertType).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    selectedType === type && styles.typeButtonActive
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <MaterialIcons
                    name={getAlertTypeIcon(type) as any}
                    size={20}
                    color={selectedType === type ? '#ffffff' : '#374151'}
                  />
                  <Text style={[
                    styles.typeButtonText,
                    selectedType === type && styles.typeButtonTextActive
                  ]}>
                    {getAlertTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Priority Selection */}
            <Text style={styles.fieldLabel}>Priority Level</Text>
            <View style={styles.prioritySelector}>
              {Object.values(AlertPriority).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    { borderColor: getPriorityColor(priority) },
                    selectedPriority === priority && { backgroundColor: getPriorityColor(priority) }
                  ]}
                  onPress={() => setSelectedPriority(priority)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    { color: selectedPriority === priority ? '#ffffff' : getPriorityColor(priority) }
                  ]}>
                    {priority.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title Input */}
            <Text style={styles.fieldLabel}>Alert Title *</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Brief description of the emergency"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            {/* Description Input */}
            <Text style={styles.fieldLabel}>Additional Details (Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Provide more details about the situation..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!title.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                onPress={handleCreateAlert}
                disabled={!title.trim() || isLoading}
              >
                {isLoading ? (
                  <MaterialIcons name="sync" size={20} color="#ffffff" />
                ) : (
                  <MaterialIcons name="send" size={20} color="#ffffff" />
                )}
                <Text style={styles.sendButtonText}>
                  {isLoading ? 'Sending...' : 'Send Alert'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emergencyButton: {
    backgroundColor: '#ef4444',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  alertsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  typeSelector: {
    marginBottom: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#1d4ed8',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  descriptionInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 16,
  },
});
