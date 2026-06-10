import React, { useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { DeliveryCard } from '../components/DeliveryCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { AppScreen } from '../components/AppScreen';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { listCurrentDeliveries } from '../services/deliveries.service';
import { Delivery } from '../types/delivery';
import { useAppTheme } from '../theme/AppThemeProvider';

type CurrentDeliveriesScreenProps = Partial<
  NativeStackScreenProps<RootStackParamList, 'CurrentDeliveries'>
>;

export function CurrentDeliveriesScreen({ navigation }: CurrentDeliveriesScreenProps) {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const inRouteDeliveries = useMemo(
    () => deliveries.filter((delivery) => delivery.status === 'EM_ROTA').length,
    [deliveries],
  );
  const awaitingDeliveries = useMemo(
    () => deliveries.filter((delivery) => delivery.status === 'AGUARDANDO_MOTORISTA').length,
    [deliveries],
  );

  async function loadDeliveries() {
    if (!session?.accessToken) {
      setDeliveries([]);
      setIsLoading(false);
      return;
    }

    try {
      const items = await listCurrentDeliveries(session.accessToken);

      setDeliveries(items);
      setError(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Nao foi possivel carregar as entregas atuais',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDeliveries();
  }, [session?.accessToken]);

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      void loadDeliveries();
    }, [session?.accessToken]),
  );

  return (
    <AppScreen>
      <View style={styles.container}>
        <Pressable
          accessibilityLabel={isSummaryExpanded ? 'Recolher resumo da operacao' : 'Expandir resumo da operacao'}
          accessibilityRole="button"
          accessibilityState={{ expanded: isSummaryExpanded }}
          onPress={() => setIsSummaryExpanded((current) => !current)}
          style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent }]}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>Operacao ativa</Text>
              <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>Entregas atuais</Text>
            </View>
            <ChevronIcon color={theme.colors.accentText} expanded={isSummaryExpanded} />
          </View>

          <View style={styles.compactMetricsRow}>
            <Text style={[styles.compactMetric, { color: theme.colors.accentText }]}>{deliveries.length} Ativas</Text>
            <Text style={[styles.compactMetric, { color: theme.colors.accentText }]}>{inRouteDeliveries} Em rota</Text>
            <Text style={[styles.compactMetric, { color: theme.colors.accentText }]}>{awaitingDeliveries} Pendente</Text>
          </View>

          {isSummaryExpanded ? (
            <>
              <Text style={[styles.heroSubtitle, { color: theme.colors.accentText }]}>Consulte as rotas em andamento e as proximas entregas disponiveis para inicio.</Text>

              <View style={styles.metricsRow}>
                <View style={[styles.metric, { borderColor: theme.colors.borderStrong }]}>
                  <Text style={[styles.metricLabel, { color: theme.colors.accentText }]}>Ativas</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.accentText }]}>{deliveries.length}</Text>
                </View>
                <View style={[styles.metric, { borderColor: theme.colors.borderStrong }]}>
                  <Text style={[styles.metricLabel, { color: theme.colors.accentText }]}>Em rota</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.accentText }]}>{inRouteDeliveries}</Text>
                </View>
                <View style={[styles.metric, { borderColor: theme.colors.borderStrong }]}>
                  <Text style={[styles.metricLabel, { color: theme.colors.accentText }]}>Pendente</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.accentText }]}>{awaitingDeliveries}</Text>
                </View>
              </View>
            </>
          ) : null}
        </Pressable>

        {isLoading ? <LoadingState message="Carregando entregas..." /> : null}

        {!isLoading && error ? (
          <EmptyState
            title="Falha ao carregar entregas"
            description={error}
          />
        ) : null}

        {!isLoading && !error && deliveries.length === 0 ? (
          <EmptyState
            title="Nenhuma entrega ativa no momento"
            description="Quando novas atribuicoes estiverem disponiveis, elas aparecerao aqui."
          />
        ) : null}

        {!isLoading && !error && deliveries.length > 0 ? (
          <ScrollView contentContainerStyle={styles.list}>
            {deliveries.map((delivery) => (
              <DeliveryCard
                delivery={delivery}
                key={delivery.id}
                onPressDetails={() => {
                  navigation?.navigate?.('DeliveryDetails', { delivery });
                }}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  hero: {
    borderRadius: 24,
    gap: 10,
    padding: 14,
  },
  heroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroHeaderText: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compactMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compactMetric: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  metric: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 9,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
});

function ChevronIcon({ color, expanded }: { color: string; expanded: boolean }) {
  return (
    <Svg
      fill="none"
      height={22}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.4}
      testID="current-deliveries-chevron-icon"
      viewBox="0 0 24 24"
      width={22}
    >
      <Path d={expanded ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
    </Svg>
  );
}
