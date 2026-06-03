import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Delivery } from '../types/delivery';
import { AppCard } from './AppCard';
import { SecondaryButton } from './SecondaryButton';
import { StatusBadge } from './StatusBadge';
import { useAppTheme } from '../theme/AppThemeProvider';

type DeliveryCardProps = {
  delivery: Delivery;
  onPressDetails: () => void;
};

export function DeliveryCard({ delivery, onPressDetails }: DeliveryCardProps) {
  const { theme } = useAppTheme();
  const isInRoute = delivery.status === 'EM_ROTA';
  const title = delivery.company?.corporateName ?? `Entrega #${delivery.id}`;

  return (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.identityBlock}>
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
            {isInRoute ? 'Em deslocamento' : 'Aguardando acao'}
          </Text>
          <Text style={[styles.code, { color: theme.colors.text }]}>{title}</Text>
        </View>
        <StatusBadge status={delivery.status} />
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>Criada em</Text>
        <Text style={[styles.metaValue, { color: theme.colors.text }]}>{formatDateTime(delivery.createdAt)}</Text>
      </View>

      <View style={[styles.body, { backgroundColor: theme.colors.highlight }]}> 
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Destino</Text>
        <Text style={[styles.address, { color: theme.colors.text }]}>{delivery.destinationAddress}</Text>
      </View>

      <SecondaryButton onPress={onPressDetails} title="Detalhes" />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
  },
  identityBlock: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  code: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metaRow: {
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    borderRadius: 20,
    gap: 8,
    padding: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  address: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
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
