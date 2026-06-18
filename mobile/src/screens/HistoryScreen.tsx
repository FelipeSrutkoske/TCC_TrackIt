import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { AppScreen } from '../components/AppScreen';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { getDeliveryHistory } from '../services/deliveries.service';
import { Delivery, DeliveryHistoryMetrics } from '../types/delivery';
import { useAppTheme } from '../theme/AppThemeProvider';
import { getDeliveryDisplayLabel } from '../utils/deliveryDisplay';

type HistoryScreenProps = Partial<NativeStackScreenProps<RootStackParamList, 'History'>>;

const EMPTY_METRICS: DeliveryHistoryMetrics = {
  totalConcluidas: 0,
  totalEmRota: 0,
  totalCanceladas: 0,
  taxaConclusao: 0,
};

export function HistoryScreen({ navigation }: HistoryScreenProps) {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [items, setItems] = useState<Delivery[]>([]);
  const [metrics, setMetrics] = useState<DeliveryHistoryMetrics>(EMPTY_METRICS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<number | null>(null);

  async function loadHistory() {
    if (!session?.accessToken) {
      setItems([]);
      setMetrics(EMPTY_METRICS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await getDeliveryHistory(session.accessToken);

      setItems(response.items);
      setMetrics(response.metrics);
      setError(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Nao foi possivel carregar o historico',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, [session?.accessToken]);

  return (
    <AppScreen
      rightActions={[
        {
          accessibilityLabel: 'Atualizar historico operacional',
          disabled: isLoading,
          icon: 'refresh',
          onPress: () => {
            void loadHistory();
          },
        },
        {
          accessibilityLabel: 'Ir para o inicio',
          icon: 'home',
          onPress: () => {
            navigation?.reset?.({ index: 0, routes: [{ name: 'Home' }] });
          },
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container} testID="history-scroll">
        <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent }]}> 
          <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>Leitura consolidada</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>Historico operacional</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.accentText }]}>Indicadores recentes e entregas encerradas em um painel rapido para consulta em rota.</Text>
        </View>

        {isLoading ? <LoadingState message="Carregando historico..." /> : null}

        {!isLoading && !error ? (
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <View style={styles.summaryHeader}>
              <View>
                <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>Resumo das entregas</Text>
                <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Performance operacional</Text>
              </View>
              <View style={[styles.ratePill, { backgroundColor: theme.colors.highlight }]}> 
                <Text style={[styles.rateValue, { color: theme.colors.text }]}>{metrics.taxaConclusao}%</Text>
                <Text style={[styles.rateLabel, { color: theme.colors.text }]}>conclusao</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={[styles.metricChip, { backgroundColor: theme.colors.surfaceMuted }]}> 
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>{metrics.totalConcluidas}</Text>
                <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Concluidas</Text>
              </View>
              <View style={[styles.metricChip, { backgroundColor: theme.colors.surfaceMuted }]}> 
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>{metrics.totalEmRota}</Text>
                <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Em rota</Text>
              </View>
              <View style={[styles.metricChip, { backgroundColor: theme.colors.surfaceMuted }]}> 
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>{metrics.totalCanceladas}</Text>
                <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Canceladas</Text>
              </View>
            </View>
          </View>
        ) : null}

        {!isLoading && error ? (
          <EmptyState title="Falha ao carregar historico" description={error} />
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <EmptyState
            title="Nenhuma entrega finalizada ainda"
            description="As entregas concluidas e canceladas aparecerao aqui depois do encerramento operacional."
          />
        ) : null}

        {!isLoading && !error && items.length > 0 ? (
          <View style={styles.list}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Entregas recentes</Text>
            <Text style={[styles.listHint, { color: theme.colors.textMuted }]}>Toque em cards sinalizados para auditar ocorrencias.</Text>
            {items.map((delivery) => {
              const hasOccurrences = (delivery.occurrences?.length ?? 0) > 0;
              const isClosedWithOccurrence = delivery.status === 'COM_OCORRENCIA';
              const closureDateLabel = isClosedWithOccurrence ? 'Ocorrência em' : 'Finalizada em';
              const closureDate = isClosedWithOccurrence
                ? getOccurrenceDate(delivery)
                : delivery.finalization?.finalizedAt;
              const isExpanded = expandedDeliveryId === delivery.id;

              return (
                <Pressable
                  accessibilityLabel={`Ver detalhes da entrega historica ${delivery.id}`}
                  accessibilityRole="button"
                  key={delivery.id}
                  onPress={() => {
                    setExpandedDeliveryId((current) => (current === delivery.id ? null : delivery.id));
                  }}
                  style={({ pressed }) => [
                    styles.deliveryCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: hasOccurrences ? theme.colors.statusDanger : theme.colors.border,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <View style={styles.deliveryHeader}>
                    <Text style={[styles.code, { color: theme.colors.text }]}>{delivery.company?.corporateName ?? getDeliveryDisplayLabel(delivery)}</Text>
                    <StatusBadge status={delivery.status} />
                  </View>

                  {hasOccurrences && !isClosedWithOccurrence ? (
                    <View
                      style={[styles.occurrenceBadge, { backgroundColor: theme.colors.statusDanger }]}
                    >
                      <Text style={[styles.occurrenceBadgeText, { color: theme.colors.statusDangerText }]}>Ocorrencia registrada</Text>
                    </View>
                  ) : null}

                  <View style={styles.timeGrid}>
                    <View style={styles.timeBlock}>
                      <Text style={[styles.destinationLabel, { color: theme.colors.textMuted }]}>Criada em</Text>
                      <Text style={[styles.destination, { color: theme.colors.text }]}>{formatDateTime(delivery.createdAt)}</Text>
                    </View>
                    <View style={styles.timeBlock}>
                      <Text style={[styles.destinationLabel, { color: theme.colors.textMuted }]}>{closureDateLabel}</Text>
                      <Text style={[styles.destination, { color: theme.colors.text }]}>{formatDateTime(closureDate)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.destinationLabel, { color: theme.colors.textMuted }]}>Tempo de entrega</Text>
                  <Text style={[styles.duration, { color: theme.colors.text }]}>{formatDuration(delivery.createdAt, delivery.finalization?.finalizedAt)}</Text>
                  <Text style={[styles.destinationLabel, { color: theme.colors.textMuted }]}>Destino</Text>
                  <Text style={[styles.destination, { color: theme.colors.text }]}>{delivery.destinationAddress}</Text>

                  {hasOccurrences && isExpanded ? (
                    <View style={[styles.occurrencePanel, { backgroundColor: theme.colors.surfaceMuted }]}>
                      <Text style={[styles.destinationLabel, { color: theme.colors.textMuted }]}>Ocorrencias</Text>
                      {delivery.occurrences?.map((occurrence) => (
                        <View key={occurrence.id} style={styles.occurrenceItem}>
                          <Text style={[styles.occurrenceType, { color: theme.colors.text }]}>{formatOccurrenceType(occurrence.tipoOcorrencia)}</Text>
                          <Text style={[styles.destination, { color: theme.colors.text }]}>{occurrence.descricao ?? 'Sem descricao informada'}</Text>
                          <Text style={[styles.destinationLabel, { color: theme.colors.textMuted }]}>{formatDateTime(occurrence.createdAt)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 18,
    paddingBottom: 34,
  },
  hero: {
    borderRadius: 26,
    gap: 8,
    padding: 18,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  summaryTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
  },
  ratePill: {
    minWidth: 86,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rateValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  metricChip: {
    flexGrow: 1,
    minWidth: 92,
    borderRadius: 18,
    padding: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  listHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  deliveryCard: {
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 14,
    gap: 10,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  code: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  timeGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeBlock: {
    flexGrow: 1,
    minWidth: 126,
    gap: 3,
  },
  destinationLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  destination: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  duration: {
    fontSize: 16,
    fontWeight: '900',
  },
  occurrenceBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  occurrenceBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  occurrencePanel: {
    borderRadius: 16,
    gap: 8,
    padding: 12,
  },
  occurrenceItem: {
    gap: 4,
  },
  occurrenceType: {
    fontSize: 14,
    fontWeight: '900',
  },
});

function getOccurrenceDate(delivery: Delivery) {
  const firstOccurrence = delivery.occurrences?.[0];

  return firstOccurrence?.dataHora ?? firstOccurrence?.createdAt ?? null;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Nao informado';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Nao informado';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startValue?: string | null, endValue?: string | null) {
  if (!startValue || !endValue) {
    return 'Nao informado';
  }

  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 'Nao informado';
  }

  const totalMinutes = Math.round((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

function formatOccurrenceType(value?: string | null) {
  if (!value) {
    return 'Ocorrencia';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
