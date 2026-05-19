import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppThemeProvider, useAppTheme } from './src/theme/AppThemeProvider';

function Root() {
  const { colorScheme } = useAppTheme();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </AppThemeProvider>
  );
}
