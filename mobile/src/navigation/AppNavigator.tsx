import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { DeliveryDetailsScreen } from '../screens/DeliveryDetailsScreen';
import { CurrentDeliveriesScreen } from '../screens/CurrentDeliveriesScreen';
import { DeliveryFinalizationScreen } from '../screens/DeliveryFinalizationScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RootStackParamList } from './types';
import { useAppTheme } from '../theme/AppThemeProvider';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { session, isLoading } = useAuth();
  const { theme } = useAppTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.background,
          card: theme.colors.surface,
          border: theme.colors.border,
          primary: theme.colors.primary,
          text: theme.colors.text,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen component={HomeScreen} name="Home" />
            <Stack.Screen component={CurrentDeliveriesScreen} name="CurrentDeliveries" />
            <Stack.Screen component={DeliveryDetailsScreen} name="DeliveryDetails" />
            <Stack.Screen component={DeliveryFinalizationScreen} name="DeliveryFinalization" />
            <Stack.Screen component={HistoryScreen} name="History" />
            <Stack.Screen component={SettingsScreen} name="Settings" />
          </>
        ) : (
          <Stack.Screen component={LoginScreen} name="Login" />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
