import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { TrackItMark } from '../components/brand/TrackItMark';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { listCurrentDeliveries } from '../services/deliveries.service';
import { useAppTheme } from '../theme/AppThemeProvider';

function TruckIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Rect height={13} rx={1} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} width={15} x={1} y={3} />
      <Path d="M16 8h4l3 3v5h-7V8Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path d="M12 6v6l4 2" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function GearIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function LogOutIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Path d="m16 17 5-5-5-5M21 12H9" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function LayoutIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={18} viewBox="0 0 24 24" width={18}>
      <Rect height={18} rx={2} ry={2} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} width={18} x={3} y={3} />
      <Path d="M3 9h18M9 21V9" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
    </Svg>
  );
}

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { session, logout } = useAuth();
  const { theme } = useAppTheme();
  const [activeDeliveries, setActiveDeliveries] = useState(0);
  const [inRouteDeliveries, setInRouteDeliveries] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadSummary() {
    if (!session?.accessToken) {
      setActiveDeliveries(0);
      setInRouteDeliveries(0);
      return;
    }

    try {
      const currentDeliveries = await listCurrentDeliveries(session.accessToken);

      setActiveDeliveries(currentDeliveries.length);
      setInRouteDeliveries(
        currentDeliveries.filter((delivery) => delivery.status === 'EM_ROTA').length,
      );
    } catch {
      setActiveDeliveries(0);
      setInRouteDeliveries(0);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      await loadSummary();
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadSummary();
  }, [session?.accessToken]);

  const pendingDeliveries = activeDeliveries - inRouteDeliveries;

  return (
    <AppScreen
      rightActions={[
        {
          accessibilityLabel: 'Atualizar entregas do hub',
          disabled: isRefreshing,
          icon: 'refresh',
          onPress: () => {
            void handleRefresh();
          },
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent, borderColor: theme.colors.borderStrong }]}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroCopy}>
                <View style={styles.statusPillRow}>
                  <View style={[styles.liveDot, { backgroundColor: theme.colors.statusSuccess }]} />
                  <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>Hub operacional</Text>
                </View>
                <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>Ola, {session?.user.nome?.split(' ')[0]}</Text>
                <Text style={[styles.heroSubtitle, { color: theme.colors.accentText }]}>Consulte suas entregas pendentes e em rota, atualize a fila e mantenha o fluxo operacional sob controle.</Text>
              </View>
              <View style={[styles.markBadge, { backgroundColor: theme.colors.highlight }]}>
                <TrackItMark height={44} width={34} />
              </View>
            </View>

            <View style={styles.heroMetricGrid}>
              <View style={[styles.heroMetricBlock, { borderColor: theme.colors.borderStrong }]}>
                <Text style={[styles.heroMetricLabel, { color: theme.colors.accentText }]}>Em rota</Text>
                <Text style={[styles.heroMetricValue, { color: theme.colors.accentText }]}>{inRouteDeliveries}</Text>
              </View>
              <View style={[styles.heroMetricBlock, { borderColor: theme.colors.borderStrong }]}>
                <Text style={[styles.heroMetricLabel, { color: theme.colors.accentText }]}>Pendentes</Text>
                <Text style={[styles.heroMetricValue, { color: theme.colors.accentText }]}>{pendingDeliveries}</Text>
              </View>
              <View style={[styles.heroMetricBlock, { borderColor: theme.colors.borderStrong }]}>
                <Text style={[styles.heroMetricLabel, { color: theme.colors.accentText }]}>Total</Text>
                <Text style={[styles.heroMetricValue, { color: theme.colors.accentText }]}>{activeDeliveries}</Text>
              </View>
            </View>
          </View>

          <AppCard>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBubble, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
                <LayoutIcon color={theme.colors.primary} />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>Atalhos operacionais</Text>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Painel do motorista</Text>
              </View>
            </View>

            <PrimaryButton
              onPress={() => {
                navigation.navigate('CurrentDeliveries');
              }}
              title="Ver entregas atuais"
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                navigation.navigate('History');
              }}
              style={({ pressed }) => [
                styles.actionRow,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={[styles.actionIconDot, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <ClockIcon color={theme.colors.primary} />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Historico</Text>
                <Text style={[styles.actionHint, { color: theme.colors.textMuted }]}>Entregas concluidas e canceladas</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                navigation.navigate('Settings');
              }}
              style={({ pressed }) => [
                styles.actionRow,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={[styles.actionIconDot, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <GearIcon color={theme.colors.primary} />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Configuracoes</Text>
                <Text style={[styles.actionHint, { color: theme.colors.textMuted }]}>Tema e preferencias do app</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void logout();
              }}
              style={({ pressed }) => [
                styles.actionRow,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={[styles.actionIconDot, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <LogOutIcon color={theme.colors.danger} />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={[styles.actionTitle, { color: theme.colors.danger }]}>Encerrar sessao</Text>
                <Text style={[styles.actionHint, { color: theme.colors.textMuted }]}>Sair da conta do motorista</Text>
              </View>
            </Pressable>
          </AppCard>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    padding: 18,
    gap: 18,
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  statusPillRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  liveDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.88,
  },
  markBadge: {
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  heroMetricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  heroMetricBlock: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 10,
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.75,
    textTransform: 'uppercase',
  },
  heroMetricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  sectionIconBubble: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  actionRow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionIconDot: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionTextBlock: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionHint: {
    fontSize: 12,
    fontWeight: '600',
  },
});
