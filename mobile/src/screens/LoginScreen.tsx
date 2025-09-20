
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/authSlice';
import { RootState } from '../store';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
// Define navigation types
type AuthStackParamList = {
  LoginScreen: undefined;
  RegistrationScreen: undefined;
  DashboardScreen: undefined;
};
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (error) {
      Toast.show({ type: 'error', text1: 'Login Failed', text2: error });
      dispatch(clearError());
    }
    if (isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: 'DashboardScreen' as keyof AuthStackParamList }] });
    }
  }, [error, isAuthenticated]);

  const validate = () => {
    if (!email || !password) {
      setFormError('Email and password are required');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleLogin = () => {
    if (!validate()) return;
  dispatch<any>(loginUser({ email, password }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SafeHaven Connect</Text>
      <Text style={styles.subtitle}>Shelter Command Login</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('RegistrationScreen' as keyof AuthStackParamList)}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
      <Toast position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 16,
    marginBottom: 20,
  },
  form: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#111827',
    color: '#fff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#60a5fa',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 15,
  },
  error: {
    color: '#f87171',
    marginBottom: 8,
    textAlign: 'center',
  },
});