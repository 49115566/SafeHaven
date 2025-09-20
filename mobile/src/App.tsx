import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from './services/authService';
import { clearError } from './store/authSlice';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import DashboardScreen from './screens/DashboardScreen';
import { RootState } from './store';

const Stack = createStackNavigator();

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkToken = async () => {
      const token = await authService.getToken();
      if (token) {
        // Optionally, validate token with backend
        dispatch({ type: 'auth/loginUser/fulfilled', payload: { user: {}, token } });
      } else {
        dispatch(clearError());
      }
    };
    checkToken();
  }, [dispatch]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? 'DashboardScreen' : 'LoginScreen'}>
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegistrationScreen" component={RegistrationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DashboardScreen" component={DashboardScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
