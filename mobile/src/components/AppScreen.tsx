import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ReactNavigation from '@react-navigation/native';
import Svg, { Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppThemeProvider';

type AppHeaderAction = {
  accessibilityLabel: string;
  icon: 'refresh' | 'home';
  onPress: () => void;
  disabled?: boolean;
};

type AppScreenProps = {
  children: ReactNode;
  rightActions?: AppHeaderAction[];
};

export function AppScreen({ children, rightActions = [] }: AppScreenProps) {
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
          <View style={styles.actionsSlot}>
            {rightActions.map((action) => (
              <Pressable
                accessibilityLabel={action.accessibilityLabel}
                accessibilityRole="button"
                disabled={action.disabled}
                key={action.accessibilityLabel}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.headerActionButton,
                  { opacity: action.disabled ? 0.38 : pressed ? 0.55 : 1 },
                ]}
              >
                {action.icon === 'refresh' ? (
                  <RefreshIcon color={theme.colors.text} />
                ) : (
                  <HomeIcon color={theme.colors.text} />
                )}
              </Pressable>
            ))}
          </View>
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
  actionsSlot: {
    minWidth: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionButton: {
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

function RefreshIcon({ color }: { color: string }) {
  return (
    <Svg
      fill="none"
      height={22}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={22}
    >
      <Path d="M21 12a9 9 0 0 1-15.5 6.2" />
      <Path d="M3 12A9 9 0 0 1 18.5 5.8" />
      <Path d="M18 2v4h4" />
      <Path d="M6 22v-4H2" />
    </Svg>
  );
}

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg
      fill="none"
      height={22}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={22}
    >
      <Path d="m3 10 9-7 9 7" />
      <Path d="M5 10v10h14V10" />
      <Path d="M9 20v-6h6v6" />
    </Svg>
  );
}
