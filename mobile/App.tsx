import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppThemeProvider, useAppTheme } from './src/theme/AppThemeProvider';

function Root() {
  const { resolvedColorScheme } = useAppTheme();

  return (
    <>
      <StatusBar style={resolvedColorScheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
