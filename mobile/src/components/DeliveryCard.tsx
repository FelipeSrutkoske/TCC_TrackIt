import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Delivery, DeliveryStatus } from '../types/delivery';
import { AppCard } from './AppCard';
import { StatusBadge } from './StatusBadge';
import { useAppTheme } from '../theme/AppThemeProvider';

type DeliveryCardProps = {
  delivery: Delivery;
  onPressDetails: () => void;
  position?: number;
  totalInQueue?: number;
};

const STATUS_ACCENT: Record<DeliveryStatus, keyof AppThemeColors> = {
  AGUARDANDO_MOTORISTA: 'statusSuccess',
  EM_ROTA: 'statusInfo',
  ENTREGUE: 'statusSuccess',
  CANCELADO: 'statusDanger',
  COM_OCORRENCIA: 'statusDanger',
};

const STATUS_LED: Record<DeliveryStatus, keyof AppThemeColors> = {
  AGUARDANDO_MOTORISTA: 'statusSuccess',
  EM_ROTA: 'statusInfo',
  ENTREGUE: 'statusSuccess',
  CANCELADO: 'statusDanger',
  COM_OCORRENCIA: 'statusDanger',
};

const STATUS_CONTEXT: Record<DeliveryStatus, string> = {
  AGUARDANDO_MOTORISTA: 'Pronta para iniciar',
  EM_ROTA: 'Em deslocamento',
  ENTREGUE: 'Entrega concluida',
  CANCELADO: 'Cancelada',
  COM_OCORRENCIA: 'Com ocorrencia',
};

type AppThemeColors = import('../theme/tokens').AppTheme['colors'];

export function DeliveryCard({ delivery, onPressDetails, position, totalInQueue }: DeliveryCardProps) {
  const { theme } = useAppTheme();
  const isInRoute = delivery.status === 'EM_ROTA';
  const isAwaiting = delivery.status === 'AGUARDANDO_MOTORISTA';
  const title = delivery.company?.corporateName ?? `Entrega #${delivery.id}`;
  const tradeName = delivery.company?.tradeName?.trim();
  const accentColor = theme.colors[STATUS_ACCENT[delivery.status]];
  const ledColor = theme.colors[STATUS_LED[delivery.status]];
  const showPosition = typeof position === 'number' && position > 0;
  const queueContext =
    showPosition && typeof totalInQueue === 'number' && totalInQueue > 0
      ? `Posicao ${position} de ${totalInQueue} na fila`
      : STATUS_CONTEXT[delivery.status];

  return (
    <AppCard>
      <View style={styles.row}>
        <View style={[styles.accentStripe, { backgroundColor: accentColor }]} />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.identityBlock}>
              {showPosition ? (
                <View style={styles.queueBadgeRow}>
                  <View
                    style={[styles.positionBubble, { backgroundColor: theme.colors.surfaceMuted }]}
                  >
                    <Text style={[styles.positionValue, { color: theme.colors.textMuted }]}>
                      {String(position).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={[styles.queueBadgeText, { color: theme.colors.textMuted }]}>
                    {queueContext}
                  </Text>
                </View>
              ) : (
                <View style={styles.queueBadgeRow}>
                  <View style={[styles.ledBubble, { backgroundColor: ledColor }]} />
                  <Text style={[styles.queueBadgeText, { color: theme.colors.textMuted }]}>
                    {isInRoute ? 'Em deslocamento' : isAwaiting ? 'Aguardando acao' : queueContext}
                  </Text>
                </View>
              )}
              <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                {title}
              </Text>
              {tradeName && tradeName !== title ? (
                <Text
                  style={[styles.subtitle, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {tradeName}
                </Text>
              ) : null}
            </View>
            <StatusBadge status={delivery.status} />
          </View>

          <View style={[styles.destinationRow, { backgroundColor: theme.colors.surfaceMuted }]}>
            <View
              style={[styles.iconBubble, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <PinIcon color={theme.colors.text} />
            </View>
            <View style={styles.destinationCopy}>
              <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>Destino</Text>
              <Text style={[styles.destination, { color: theme.colors.text }]}>
                {delivery.destinationAddress}
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.timestampRow}>
              <ClockIcon color={theme.colors.textMuted} />
              <Text style={[styles.timestampLabel, { color: theme.colors.textMuted }]}>Criada em</Text>
              <Text style={[styles.timestampValue, { color: theme.colors.text }]}>
                {formatDateTime(delivery.createdAt)}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Detalhes"
              accessibilityRole="button"
              onPress={onPressDetails}
              style={({ pressed }) => [
                styles.detailsButton,
                {
                  backgroundColor: theme.colors.secondary,
                  borderColor: theme.colors.borderStrong,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.detailsText, { color: theme.colors.secondaryText }]}>
                Detalhes
              </Text>
              <ArrowRightIcon color={theme.colors.secondaryText} />
            </Pressable>
          </View>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  accentStripe: {
    borderRadius: 6,
    width: 5,
  },
  content: {
    flex: 1,
    gap: 12,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  identityBlock: {
    flex: 1,
    gap: 4,
  },
  queueBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  positionBubble: {
    borderRadius: 6,
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  positionValue: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  ledBubble: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  queueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  destinationRow: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  destinationCopy: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  destination: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  timestampRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  timestampLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  timestampValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  detailsText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

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

function PinIcon({ color }: { color: string }) {
  return (
    <Svg
      fill="none"
      height={16}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={16}
    >
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <Circle cx="12" cy="10" r="3" />
    </Svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg
      fill="none"
      height={14}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={14}
    >
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </Svg>
  );
}

function ArrowRightIcon({ color }: { color: string }) {
  return (
    <Svg
      fill="none"
      height={14}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.2}
      viewBox="0 0 24 24"
      width={14}
    >
      <Path d="M5 12h14" />
      <Path d="m13 6 6 6-6 6" />
    </Svg>
  );
}
