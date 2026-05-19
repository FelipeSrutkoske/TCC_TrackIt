import React, { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';

export function AppScreen({ children }: { children: ReactNode }) {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.content, { backgroundColor: theme.colors.background }]}> 
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
