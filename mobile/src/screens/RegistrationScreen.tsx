
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../store/authSlice';
import { RootState } from '../store';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';

type AuthStackParamList = {
  LoginScreen: undefined;
  RegistrationScreen: undefined;
  DashboardScreen: undefined;
};

export default function RegistrationScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [shelterName, setShelterName] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (error) {
      Toast.show({ type: 'error', text1: 'Registration Failed', text2: error });
      dispatch(clearError());
    }
    if (isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: 'DashboardScreen' as keyof AuthStackParamList }] });
    }
  }, [error, isAuthenticated]);

  const validate = () => {
    if (!email || !password || !firstName || !lastName || !shelterName || !address) {
      setFormError('All fields except phone/organization are required');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleRegister = () => {
    if (!validate()) return;
    dispatch<any>(registerUser({
      email,
      password,
      role: 'shelter_operator',
      profile: { firstName, lastName, phone, organization },
      shelter: { name: shelterName, address }
    }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register Shelter Operator</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#9ca3af"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#9ca3af"
          value={lastName}
          onChangeText={setLastName}
        />
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
        <TextInput
          style={styles.input}
          placeholder="Phone (optional)"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Organization (optional)"
          placeholderTextColor="#9ca3af"
          value={organization}
          onChangeText={setOrganization}
        />
        <TextInput
          style={styles.input}
          placeholder="Shelter Name"
          placeholderTextColor="#9ca3af"
          value={shelterName}
          onChangeText={setShelterName}
        />
        <TextInput
          style={styles.input}
          placeholder="Shelter Address"
          placeholderTextColor="#9ca3af"
          value={address}
          onChangeText={setAddress}
        />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>
  <TouchableOpacity onPress={() => navigation.navigate('LoginScreen' as keyof AuthStackParamList)}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
      <Toast position="bottom" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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
    backgroundColor: '#10b981',
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
