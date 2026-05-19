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

  return (
    <AppCard>
      <View style={styles.header}>
        <Text style={[styles.code, { color: theme.colors.text }]}>Entrega #{delivery.id}</Text>
        <StatusBadge status={delivery.status} />
      </View>

      <View style={styles.body}>
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
  code: {
    fontSize: 20,
    fontWeight: '700',
  },
  body: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  address: {
    fontSize: 16,
    lineHeight: 22,
  },
});
