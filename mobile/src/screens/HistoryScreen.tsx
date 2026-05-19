import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../components/AppCard';
import { EmptyState } from '../components/EmptyState';
import { AppHeader } from '../components/AppHeader';
import { InfoRow } from '../components/InfoRow';
import { LoadingState } from '../components/LoadingState';
import { MetricCard } from '../components/MetricCard';
import { AppScreen } from '../components/AppScreen';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { getDeliveryHistory } from '../services/deliveries.service';
import { Delivery, DeliveryHistoryMetrics } from '../types/delivery';
import { useAppTheme } from '../theme/AppThemeProvider';

const EMPTY_METRICS: DeliveryHistoryMetrics = {
  totalConcluidas: 0,
  totalEmRota: 0,
  totalCanceladas: 0,
  taxaConclusao: 0,
};

export function HistoryScreen() {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [items, setItems] = useState<Delivery[]>([]);
  const [metrics, setMetrics] = useState<DeliveryHistoryMetrics>(EMPTY_METRICS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!session?.accessToken) {
        setItems([]);
        setMetrics(EMPTY_METRICS);
        setIsLoading(false);
        return;
      }

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

    void loadHistory();
  }, [session?.accessToken]);

  return (
    <AppScreen>
      <View style={styles.container}>
        <AppHeader
          title="Historico operacional"
          subtitle="Consulte os encerramentos recentes e os indicadores consolidados do seu fluxo de entregas."
        />

        {isLoading ? <LoadingState message="Carregando historico..." /> : null}

        {!isLoading && !error ? (
          <View style={styles.metricsGrid}>
            <MetricCard label="Concluidas" value={String(metrics.totalConcluidas)} />
            <MetricCard label="Em rota" value={String(metrics.totalEmRota)} />
            <MetricCard label="Canceladas" value={String(metrics.totalCanceladas)} />
            <MetricCard label="Taxa de conclusao" value={`${metrics.taxaConclusao}%`} />
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
          <ScrollView contentContainerStyle={styles.list}>
            {items.map((delivery) => (
              <AppCard key={delivery.id}>
                <Text style={[styles.code, { color: theme.colors.text }]}>Entrega #{delivery.id}</Text>
                <StatusBadge status={delivery.status} />
                <InfoRow label="Destino" value={delivery.destinationAddress} />
              </AppCard>
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
    padding: 24,
    gap: 24,
  },
  metricsGrid: {
    gap: 16,
  },
  list: {
    gap: 16,
    paddingBottom: 24,
  },
  code: {
    fontSize: 20,
    fontWeight: '700',
  },
});
