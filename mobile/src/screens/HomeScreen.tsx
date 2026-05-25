import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { AppScreen } from '../components/AppScreen';
import { SecondaryButton } from '../components/SecondaryButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { TrackItMark } from '../components/brand/TrackItMark';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { getDeliveryHistory, listCurrentDeliveries } from '../services/deliveries.service';
import { DeliveryHistoryMetrics } from '../types/delivery';
import { useAppTheme } from '../theme/AppThemeProvider';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { session, logout } = useAuth();
  const { theme } = useAppTheme();
  const [activeDeliveries, setActiveDeliveries] = useState(0);
  const [inRouteDeliveries, setInRouteDeliveries] = useState(0);
  const [historyMetrics, setHistoryMetrics] = useState<DeliveryHistoryMetrics | null>(null);

  useEffect(() => {
    async function loadSummary() {
      if (!session?.accessToken) {
        setActiveDeliveries(0);
        setInRouteDeliveries(0);
        setHistoryMetrics(null);
        return;
      }

      try {
        const [currentDeliveries, history] = await Promise.all([
          listCurrentDeliveries(session.accessToken),
          getDeliveryHistory(session.accessToken),
        ]);

        setActiveDeliveries(currentDeliveries.length);
        setInRouteDeliveries(
          currentDeliveries.filter((delivery) => delivery.status === 'EM_ROTA').length,
        );
        setHistoryMetrics(history.metrics);
      } catch {
        setActiveDeliveries(0);
        setInRouteDeliveries(0);
        setHistoryMetrics(null);
      }
    }

    void loadSummary();
  }, [session?.accessToken]);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent }]}> 
            <View style={styles.heroTopRow}>
              <View style={styles.heroCopy}>
                <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>Painel do motorista</Text>
                <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>Ola, {session?.user.nome?.split(' ')[0]}</Text>
                <Text style={[styles.heroSubtitle, { color: theme.colors.accentText }]}>Acompanhe entregas ativas, consulte o historico e ajuste a aparencia do app sem perder a identidade TrackIt.</Text>
              </View>
              <View style={[styles.markBadge, { backgroundColor: theme.colors.highlight }]}>
                <TrackItMark height={56} width={44} />
              </View>
            </View>

            <View style={styles.heroMetrics}>
              <View style={[styles.metric, { borderColor: theme.colors.borderStrong }]}> 
                <Text style={[styles.metricLabel, { color: theme.colors.accentText }]}>Entregas ativas</Text>
                <Text style={[styles.metricValue, { color: theme.colors.accentText }]}>{activeDeliveries}</Text>
              </View>
              <View style={[styles.metric, { borderColor: theme.colors.borderStrong }]}> 
                <Text style={[styles.metricLabel, { color: theme.colors.accentText }]}>Taxa de conclusao</Text>
                <Text style={[styles.metricValueSmall, { color: theme.colors.accentText }]}> 
                  {historyMetrics ? `${historyMetrics.taxaConclusao}%` : '--'}
                </Text>
              </View>
            </View>
          </View>

          <AppCard>
            <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>Atalhos operacionais</Text>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Painel do motorista</Text>
            <Text style={[styles.sectionCopy, { color: theme.colors.textMuted }]}>Centralize a operacao do dia, revise a rota e configure a aparencia do app a partir deste painel.</Text>

            <View style={[styles.summaryRow, { backgroundColor: theme.colors.highlight }]}> 
              <View style={styles.summaryBlock}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>Em rota</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{inRouteDeliveries}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryBlock}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>Concluidas</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {historyMetrics?.totalConcluidas ?? 0}
                </Text>
              </View>
            </View>

            <PrimaryButton
              onPress={() => {
                navigation.navigate('CurrentDeliveries');
              }}
              title="Ver entregas atuais"
            />

            <SecondaryButton
              onPress={() => {
                navigation.navigate('History');
              }}
              title="Ver historico"
            />

            <SecondaryButton
              onPress={() => {
                navigation.navigate('Settings');
              }}
              title="Configuracoes"
            />
          </AppCard>

          <SecondaryButton
            onPress={() => {
              void logout();
            }}
            title="Sair"
          />
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
    borderRadius: 34,
    padding: 20,
    gap: 20,
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
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  markBadge: {
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  heroMetrics: {
    gap: 12,
  },
  metric: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricValueSmall: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  sectionCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
  summaryRow: {
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryBlock: {
    flex: 1,
    gap: 4,
  },
  summaryDivider: {
    backgroundColor: '#00000014',
    marginHorizontal: 12,
    width: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
  },
});
