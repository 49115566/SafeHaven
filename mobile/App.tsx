import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import { store, persistor } from './src/store';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import StatusUpdateScreen from './src/screens/StatusUpdateScreen';
import AlertScreen from './src/screens/AlertScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoadingScreen from './src/components/LoadingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createStackNavigator();

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        {/* @ts-ignore */}
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#1f2937" />
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#1f2937',
                },
                headerTintColor: '#ffffff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Dashboard" 
                component={DashboardScreen}
                options={{ 
                  title: 'SafeHaven Connect',
                  headerLeft: () => null // Prevent going back to login
                }}
              />
              <Stack.Screen 
                name="StatusUpdate" 
                component={StatusUpdateScreen}
                options={{ title: 'Update Status' }}
              />
              <Stack.Screen 
                name="Alert" 
                component={AlertScreen}
                options={{ title: 'Create Alert' }}
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen}
                options={{ title: 'Settings' }}
              />
            </Stack.Navigator>
            <Toast />
          </NavigationContainer>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}