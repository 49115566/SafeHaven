import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading SafeHaven Connect...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});