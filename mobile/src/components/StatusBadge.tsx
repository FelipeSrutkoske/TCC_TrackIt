import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DeliveryStatus } from '../types/delivery';
import { useAppTheme } from '../theme/AppThemeProvider';

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  AGUARDANDO_MOTORISTA: 'Aguardando motorista',
  EM_ROTA: 'Em rota',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.text }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
