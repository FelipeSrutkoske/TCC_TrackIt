import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { AppScreen } from '../components/AppScreen';
import { SecondaryButton } from '../components/SecondaryButton';
import { ThemeModeSelector } from '../components/ThemeModeSelector';
import { TrackItMark } from '../components/brand/TrackItMark';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/AppThemeProvider';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { resolvedColorScheme, theme, themePreference } = useAppTheme();

  return (
    <AppScreen>
      <View style={styles.container}>
        <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent }]}> 
          <TrackItMark height={60} width={46} />
          <View style={styles.heroCopy}>
            <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>Configuracoes</Text>
            <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>Configuracoes do app</Text>
            <Text style={[styles.heroSubtitle, { color: theme.colors.accentText }]}>Configure o aplicativo de acordo com suas preferencias.</Text>
          </View>
        </View>

        <AppCard>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Tema atual</Text>
          <Text style={[styles.sectionValue, { color: theme.colors.text }]}>
            {themePreference === 'system' ? `Sistema (${resolvedColorScheme})` : themePreference}
          </Text>
          <ThemeModeSelector />
        </AppCard>

        <SecondaryButton
          onPress={() => {
            navigation.goBack();
          }}
          title="Voltar"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    gap: 18,
  },
  hero: {
    borderRadius: 34,
    padding: 20,
    gap: 14,
  },
  heroCopy: {
    gap: 8,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectionValue: {
    fontSize: 24,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
});
