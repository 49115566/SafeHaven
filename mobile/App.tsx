import React, {useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

function App(): React.JSX.Element {
  const [capacity, setCapacity] = useState({current: 0, max: 200});
  const [status, setStatus] = useState('AVAILABLE');

  const updateCapacity = (change: number) => {
    setCapacity(prev => ({
      ...prev,
      current: Math.max(0, Math.min(prev.max, prev.current + change))
    }));
  };

  const sendAlert = (type: string) => {
    Alert.alert('Alert Sent', `${type} alert sent to all first responders`);
  };

  const getStatusColor = () => {
    if (capacity.current >= capacity.max) return '#DC2626'; // Red - Full
    if (capacity.current >= capacity.max * 0.8) return '#F59E0B'; // Yellow - Near Full
    return '#10B981'; // Green - Available
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏠 SafeHaven Connect</Text>
        <Text style={styles.subtitle}>Emergency Shelter Command</Text>
      </View>

      {/* Status Display */}
      <View style={[styles.statusCard, {backgroundColor: getStatusColor()}]}>
        <Text style={styles.statusText}>SHELTER STATUS</Text>
        <Text style={styles.statusValue}>{status}</Text>
        <Text style={styles.capacityText}>
          {capacity.current} / {capacity.max} OCCUPANTS
        </Text>
      </View>

      {/* Capacity Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Occupancy</Text>
        <View style={styles.capacityControls}>
          <TouchableOpacity 
            style={[styles.button, styles.decreaseBtn]}
            onPress={() => updateCapacity(-10)}>
            <Text style={styles.buttonText}>-10</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.decreaseBtn]}
            onPress={() => updateCapacity(-1)}>
            <Text style={styles.buttonText}>-1</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.increaseBtn]}
            onPress={() => updateCapacity(1)}>
            <Text style={styles.buttonText}>+1</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.increaseBtn]}
            onPress={() => updateCapacity(10)}>
            <Text style={styles.buttonText}>+10</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Alerts</Text>
        <TouchableOpacity 
          style={[styles.alertButton, styles.criticalAlert]}
          onPress={() => sendAlert('CRITICAL MEDICAL')}>
          <Text style={styles.alertText}>🚨 MEDICAL EMERGENCY</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.alertButton, styles.urgentAlert]}
          onPress={() => sendAlert('SUPPLIES NEEDED')}>
          <Text style={styles.alertText}>📦 URGENT SUPPLIES</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.alertButton, styles.evacuateAlert]}
          onPress={() => sendAlert('EVACUATION')}>
          <Text style={styles.alertText}>⚠️ EVACUATION NEEDED</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1F2937',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    marginTop: 4,
  },
  statusCard: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  statusValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 8,
  },
  capacityText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  capacityControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 20,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  decreaseBtn: {
    backgroundColor: '#EF4444',
  },
  increaseBtn: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  alertButton: {
    padding: 20,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  criticalAlert: {
    backgroundColor: '#DC2626',
  },
  urgentAlert: {
    backgroundColor: '#F59E0B',
  },
  evacuateAlert: {
    backgroundColor: '#7C2D12',
  },
  alertText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default App;