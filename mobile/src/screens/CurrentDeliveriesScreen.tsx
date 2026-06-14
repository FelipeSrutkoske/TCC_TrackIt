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
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const inRouteDeliveries = useMemo(
    () => deliveries.filter((delivery) => delivery.status === 'EM_ROTA').length,
    [deliveries],
  );
  const awaitingDeliveries = useMemo(
    () => deliveries.filter((delivery) => delivery.status === 'AGUARDANDO_MOTORISTA').length,
    [deliveries],
  );
  const inRouteRatio = deliveries.length > 0 ? inRouteDeliveries / deliveries.length : 0;
  const awaitingRatio = deliveries.length > 0 ? awaitingDeliveries / deliveries.length : 0;

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
      setLastSyncAt(new Date());
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
          style={({ pressed }) => [
            styles.dispatchPanel,
            {
              backgroundColor: theme.colors.surfaceAccent,
              borderColor: theme.colors.borderStrong,
              opacity: pressed ? 0.94 : 1,
            },
          ]}
        >
          <View style={styles.dispatchHeader}>
            <View style={styles.dispatchHeaderText}>
              <View style={styles.statusPillRow}>
                <View
                  style={[styles.liveDot, { backgroundColor: theme.colors.statusSuccess }]}
                />
                <Text style={[styles.dispatchEyebrow, { color: theme.colors.accentText }]}>
                  Operacao ativa
                </Text>
              </View>
              <Text style={[styles.dispatchTitle, { color: theme.colors.accentText }]}>
                Entregas atuais
              </Text>
            </View>
            <View
              style={[
                styles.chevronButton,
                { borderColor: theme.colors.borderStrong, backgroundColor: 'rgba(255,255,255,0.06)' },
              ]}
            >
              <ChevronIcon color={theme.colors.accentText} expanded={isSummaryExpanded} />
            </View>
          </View>

          <View style={styles.compactMetricsRow}>
            <Text style={[styles.compactMetric, { color: theme.colors.accentText }]}>{deliveries.length} Ativas</Text>
            <Text style={[styles.compactMetric, { color: theme.colors.accentText }]}>{inRouteDeliveries} Em rota</Text>
            <Text style={[styles.compactMetric, { color: theme.colors.accentText }]}>{awaitingDeliveries} Pendente</Text>
          </View>

          {isSummaryExpanded ? (
            <View style={styles.expandedContent}>
              <Text style={[styles.dispatchSubtitle, { color: theme.colors.accentText }]}>
                Consulte as rotas em andamento e as proximas entregas disponiveis para inicio.
              </Text>

              <View style={styles.metricGrid}>
                <View
                  style={[
                    styles.metricBlock,
                    { borderColor: theme.colors.borderStrong, backgroundColor: 'rgba(255,255,255,0.04)' },
                  ]}
                >
                  <Text style={[styles.metricBlockLabel, { color: theme.colors.accentText }]}>Ativas</Text>
                  <Text style={[styles.metricBlockValue, { color: theme.colors.accentText }]}>{deliveries.length}</Text>
                  <Text style={[styles.metricBlockHint, { color: theme.colors.accentText }]}>total na fila</Text>
                </View>
                <View
                  style={[
                    styles.metricBlock,
                    { borderColor: theme.colors.borderStrong, backgroundColor: 'rgba(255,255,255,0.04)' },
                  ]}
                >
                  <Text style={[styles.metricBlockLabel, { color: theme.colors.accentText }]}>Em rota</Text>
                  <Text style={[styles.metricBlockValue, { color: theme.colors.accentText }]}>{inRouteDeliveries}</Text>
                  <Text style={[styles.metricBlockHint, { color: theme.colors.accentText }]}>
                    {deliveries.length > 0 ? `${Math.round(inRouteRatio * 100)}% em deslocamento` : 'aguardando'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.metricBlock,
                    { borderColor: theme.colors.borderStrong, backgroundColor: 'rgba(255,255,255,0.04)' },
                  ]}
                >
                  <Text style={[styles.metricBlockLabel, { color: theme.colors.accentText }]}>Pendente</Text>
                  <Text style={[styles.metricBlockValue, { color: theme.colors.accentText }]}>{awaitingDeliveries}</Text>
                  <Text style={[styles.metricBlockHint, { color: theme.colors.accentText }]}>
                    {awaitingDeliveries === 0 ? 'nenhuma para iniciar' : 'pronta para sair'}
                  </Text>
                </View>
              </View>

              <View style={styles.compositionSection}>
                <View style={styles.compositionHeader}>
                  <Text style={[styles.compositionLabel, { color: theme.colors.accentText }]}>
                    Composicao da fila
                  </Text>
                  <Text style={[styles.compositionHint, { color: theme.colors.accentText }]}>
                    distribuicao atual
                  </Text>
                </View>
                <View style={styles.compositionBar}>
                  {deliveries.length > 0 ? (
                    <>
                      <View
                        style={[
                          styles.compositionSegment,
                          {
                            width: `${Math.max(inRouteRatio * 100, inRouteDeliveries > 0 ? 6 : 0)}%`,
                            backgroundColor: theme.colors.statusInfo,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.compositionSegment,
                          {
                            width: `${Math.max(awaitingRatio * 100, awaitingDeliveries > 0 ? 6 : 0)}%`,
                            backgroundColor: theme.colors.statusSuccess,
                          },
                        ]}
                      />
                    </>
                  ) : (
                    <View
                      style={[
                        styles.compositionSegmentEmpty,
                        { backgroundColor: 'rgba(255,255,255,0.18)' },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.compositionLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: theme.colors.statusInfo }]} />
                    <Text style={[styles.legendText, { color: theme.colors.accentText }]}>
                      Em rota {inRouteDeliveries}
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: theme.colors.statusSuccess }]} />
                    <Text style={[styles.legendText, { color: theme.colors.accentText }]}>
                      Pendente {awaitingDeliveries}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.syncFooter}>
                <View
                  style={[
                    styles.syncDot,
                    { backgroundColor: lastSyncAt ? theme.colors.statusSuccess : theme.colors.statusInfo },
                  ]}
                />
                <Text style={[styles.syncText, { color: theme.colors.accentText }]}>
                  {lastSyncAt ? `Sincronizado ${formatSyncTime(lastSyncAt)}` : 'Sincronizando com a central...'}
                </Text>
              </View>
            </View>
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
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>
                  Ordem de trabalho
                </Text>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sua fila</Text>
              </View>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <PackageIcon color={theme.colors.primary} />
                <Text style={[styles.countBadgeValue, { color: theme.colors.text }]}>
                  {deliveries.length}
                </Text>
                <Text style={[styles.countBadgeLabel, { color: theme.colors.textMuted }]}>
                  {deliveries.length === 1 ? 'entrega' : 'entregas'}
                </Text>
              </View>
            </View>

            {deliveries.map((delivery, index) => (
              <View key={delivery.id} style={index === 0 ? styles.firstItem : styles.listItem}>
                <DeliveryCard
                  delivery={delivery}
                  position={index + 1}
                  totalInQueue={deliveries.length}
                  onPressDetails={() => {
                    navigation?.navigate?.('DeliveryDetails', { delivery });
                  }}
                />
              </View>
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
    padding: 14,
    gap: 14,
  },
  dispatchPanel: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dispatchHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dispatchHeaderText: {
    flex: 1,
    gap: 6,
  },
  statusPillRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dispatchEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  dispatchTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  chevronButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  compactMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compactMetric: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: 14,
    paddingTop: 14,
  },
  dispatchSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.9,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBlock: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  metricBlockLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.78,
    textTransform: 'uppercase',
  },
  metricBlockValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  metricBlockHint: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    opacity: 0.72,
  },
  compositionSection: {
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.18)',
    gap: 10,
    padding: 12,
  },
  compositionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  compositionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  compositionHint: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    opacity: 0.7,
  },
  compositionBar: {
    flexDirection: 'row',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
    gap: 2,
  },
  compositionSegment: {
    height: '100%',
    borderRadius: 999,
  },
  compositionSegmentEmpty: {
    flex: 1,
    height: '100%',
    borderRadius: 999,
  },
  compositionLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  syncFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    opacity: 0.85,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  listContent: {
    gap: 10,
    paddingBottom: 28,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 2,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  countBadge: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countBadgeValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  countBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  listItem: {
    marginTop: 2,
  },
  firstItem: {
    marginTop: 0,
  },
});

function ChevronIcon({ color, expanded }: { color: string; expanded: boolean }) {
  return (
    <Svg
      fill="none"
      height={18}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.4}
      testID="current-deliveries-chevron-icon"
      viewBox="0 0 24 24"
      width={18}
    >
      <Path d={expanded ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
    </Svg>
  );
}

function PackageIcon({ color }: { color: string }) {
  return (
    <Svg
      fill="none"
      height={18}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={18}
    >
      <Path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <Path d="M3.3 7.7 12 13l8.7-5.3" />
      <Path d="M12 22V13" />
    </Svg>
  );
}

function formatSyncTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
