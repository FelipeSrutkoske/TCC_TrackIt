import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useAppTheme } from '../theme/AppThemeProvider';
import { DeliveryDetail } from '../types/delivery';
import { AppCard } from './AppCard';

type DeliveryDetailsSummaryProps = {
  details?: DeliveryDetail[];
  emptyMessage: string;
  title: string;
};

function PackageIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={18} viewBox="0 0 24 24" width={18}>
      <Path
        d="M16.5 9.4 7.55 4.24"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function ScaleIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={13} viewBox="0 0 24 24" width={13}>
      <Path
        d="M12 3v17M5 8l7-5 7 5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M2 15a5 5 0 0 0 6 0M16 15a5 5 0 0 0 6 0"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M5 8l-3 7h6L5 8ZM19 8l-3 7h6l-3-7Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function CubeIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={13} viewBox="0 0 24 24" width={13}>
      <Rect
        height={14}
        rx={2}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        width={14}
        x={5}
        y={5}
      />
      <Path
        d="M5 5l4-4h10l4 4"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M19 5l4-4"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function StackIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={13} viewBox="0 0 24 24" width={13}>
      <Path
        d="M12 2 2 7l10 5 10-5-10-5Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="m2 17 10 5 10-5M2 12l10 5 10-5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function TagIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={13} viewBox="0 0 24 24" width={13}>
      <Path
        d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Circle cx="7.5" cy="7.5" fill={color} r="1.5" />
    </Svg>
  );
}

export function DeliveryDetailsSummary({
  details = [],
  emptyMessage,
  title,
}: DeliveryDetailsSummaryProps) {
  const { theme } = useAppTheme();

  const totals = details.reduce(
    (acc, item) => {
      acc.quantidade += item.quantidade;
      acc.peso += Number(item.pesoKg) || 0;
      acc.volume += Number(item.volumeM3) || 0;
      acc.valor += Number(item.valorDeclarado) || 0;
      return acc;
    },
    { quantidade: 0, peso: 0, volume: 0, valor: 0 },
  );

  return (
    <AppCard>
      <View style={styles.headerRow}>
        <View style={[styles.iconBubble, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
          <PackageIcon color={theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>Ordem de servico</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        </View>
        {details.length > 0 ? (
          <View style={[styles.countPill, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Text style={[styles.countText, { color: theme.colors.primary }]}>
              {details.length} {details.length === 1 ? 'item' : 'itens'}
            </Text>
          </View>
        ) : null}
      </View>

      {details.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
          <PackageIcon color={theme.colors.textMuted} />
          <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{emptyMessage}</Text>
        </View>
      ) : (
        <>
          {details.length > 1 ? (
            <View style={[styles.summaryStrip, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
              <View style={styles.summaryItem}>
                <StackIcon color={theme.colors.textMuted} />
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{totals.quantidade}</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>un.</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.summaryItem}>
                <ScaleIcon color={theme.colors.textMuted} />
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatarNumeroDecimal(totals.peso)}</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>kg</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.summaryItem}>
                <CubeIcon color={theme.colors.textMuted} />
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatarNumeroDecimal(totals.volume)}</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>m³</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.summaryItem}>
                <TagIcon color={theme.colors.textMuted} />
                <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{formatarMoeda(totals.valor)}</Text>
              </View>
            </View>
          ) : null}

          {details.map((itemDetalheEntrega, index) => (
            <View
              key={itemDetalheEntrega.id}
              style={[
                styles.detailCard,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.detailTopRow}>
                <View style={[styles.accentStripe, { backgroundColor: theme.colors.primary }]} />
                <View style={styles.detailIdentity}>
                  <View style={styles.detailNameRow}>
                    <Text style={[styles.description, { color: theme.colors.text }]}>
                      {itemDetalheEntrega.descricao}
                    </Text>
                    {details.length > 1 ? (
                      <View style={[styles.indexBubble, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Text style={[styles.indexText, { color: theme.colors.textMuted }]}>
                          {String(index + 1).padStart(2, '0')}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.categoryRow}>
                    <View style={[styles.categoryDot, { backgroundColor: theme.colors.primary }]} />
                    <Text style={[styles.category, { color: theme.colors.textMuted }]}>
                      {itemDetalheEntrega.categoria || 'Geral'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.valueRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TagIcon color={theme.colors.primary} />
                <Text style={[styles.valueLabel, { color: theme.colors.textMuted }]}>Valor declarado</Text>
                <Text style={[styles.declaredValue, { color: theme.colors.primary }]}>
                  {formatarMoeda(itemDetalheEntrega.valorDeclarado)}
                </Text>
              </View>

              <View style={styles.metricGrid}>
                <View style={[styles.metricBlock, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <StackIcon color={theme.colors.textMuted} />
                  <Text style={[styles.metricValue, { color: theme.colors.text }]}>{itemDetalheEntrega.quantidade}</Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Qtd.</Text>
                </View>
                <View style={[styles.metricBlock, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <ScaleIcon color={theme.colors.textMuted} />
                  <Text style={[styles.metricValue, { color: theme.colors.text }]}>{formatarNumeroDecimal(itemDetalheEntrega.pesoKg)}</Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>kg</Text>
                </View>
                <View style={[styles.metricBlock, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <CubeIcon color={theme.colors.textMuted} />
                  <Text style={[styles.metricValue, { color: theme.colors.text }]}>{formatarNumeroDecimal(itemDetalheEntrega.volumeM3)}</Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>m³</Text>
                </View>
              </View>
            </View>
          ))}
        </>
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
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  countPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  empty: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    textAlign: 'center',
  },
  summaryStrip: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  summaryDivider: {
    height: 18,
    width: 1,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailCard: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 14,
  },
  detailTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  accentStripe: {
    borderRadius: 4,
    width: 4,
  },
  detailIdentity: {
    flex: 1,
    gap: 6,
  },
  detailNameRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  description: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  indexBubble: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  indexText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  categoryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  categoryDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  valueRow: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  valueLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  declaredValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBlock: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
