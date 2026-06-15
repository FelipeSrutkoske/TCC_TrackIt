import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';
import { DeliveryDetail } from '../types/delivery';
import { AppCard } from './AppCard';

type DeliveryDetailsSummaryProps = {
  details?: DeliveryDetail[];
  emptyMessage: string;
  title: string;
};

export function DeliveryDetailsSummary({
  details = [],
  emptyMessage,
  title,
}: DeliveryDetailsSummaryProps) {
  const { theme } = useAppTheme();

  return (
    <AppCard>
      <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>Ordem de servico</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>

      {details.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{emptyMessage}</Text>
      ) : (
        details.map((itemDetalheEntrega) => (
          <View
            key={itemDetalheEntrega.id}
            style={[
              styles.detailItem,
              {
                backgroundColor: theme.colors.highlight,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.detailHeader}>
              <View style={styles.detailTitleBlock}>
                <Text style={[styles.description, { color: theme.colors.text }]}>
                  {itemDetalheEntrega.descricao}
                </Text>
                <Text style={[styles.category, { color: theme.colors.textMuted }]}>
                  {itemDetalheEntrega.categoria || 'Geral'}
                </Text>
              </View>
              <Text style={[styles.declaredValue, { color: theme.colors.primary }]}> 
                {formatarMoeda(itemDetalheEntrega.valorDeclarado)}
              </Text>
            </View>

            <View style={styles.metricGrid}>
              <Text style={[styles.metric, { color: theme.colors.text }]}>Quantidade: {itemDetalheEntrega.quantidade}</Text>
              <Text style={[styles.metric, { color: theme.colors.text }]}>Peso: {formatarNumeroDecimal(itemDetalheEntrega.pesoKg)} kg</Text>
              <Text style={[styles.metric, { color: theme.colors.text }]}>Volume: {formatarNumeroDecimal(itemDetalheEntrega.volumeM3)} m3</Text>
            </View>
          </View>
        ))
      )}
    </AppCard>
  );
}

function formatarNumeroDecimal(valor: number | string): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '-';
  }

  return numero.toLocaleString('pt-BR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function formatarMoeda(valor: number | string): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '-';
  }

  return numero.toLocaleString('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  });
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  empty: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  detailItem: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  detailHeader: {
    gap: 10,
  },
  detailTitleBlock: {
    gap: 4,
  },
  description: {
    fontSize: 16,
    fontWeight: '800',
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  declaredValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  metricGrid: {
    gap: 6,
  },
  metric: {
    fontSize: 13,
    fontWeight: '700',
  },
});
