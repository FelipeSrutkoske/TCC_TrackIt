import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ReactNavigation from '@react-navigation/native';
import Svg, { Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppThemeProvider';

export function AppScreen({ children }: { children: ReactNode }) {
  const { theme } = useAppTheme();
  const navigationContext = ReactNavigation.NavigationContext;
  const navigation = navigationContext ? React.useContext(navigationContext) : null;
  const canGoBack = navigation?.canGoBack() ?? false;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.content, { backgroundColor: theme.colors.background }]}> 
        <View style={[styles.canvas, { backgroundColor: theme.colors.backgroundCanvas }]} />
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          testID="app-top-bar"
        >
          <View style={styles.backSlot}>
            {canGoBack ? (
              <Pressable
                accessibilityLabel="Voltar para a tela anterior"
                accessibilityRole="button"
                onPress={() => navigation?.goBack()}
                style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.55 : 1 }]}
              >
                <SquareArrowLeftIcon color={theme.colors.text} />
              </Pressable>
            ) : null}
          </View>
          <Text style={[styles.brand, { color: theme.colors.text }]}>TrackIt</Text>
          <View style={styles.backSlot} />
        </View>
        <View style={styles.body} testID="app-screen-body">
          {children}
        </View>
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
    position: 'relative',
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
  },
  topBar: {
    minHeight: 48,
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  backSlot: {
    width: 40,
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
});

function SquareArrowLeftIcon({ color }: { color: string }) {
  return (
    <Svg
      fill="none"
      height={24}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      testID="square-arrow-left-icon"
      viewBox="0 0 24 24"
      width={24}
    >
      <Rect height={18} rx={2} width={18} x={3} y={3} />
      <Path d="m12 8-4 4 4 4" />
      <Path d="M16 12H8" />
    </Svg>
  );
}
