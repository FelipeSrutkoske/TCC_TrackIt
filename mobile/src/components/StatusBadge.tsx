import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DeliveryStatus } from '../types/delivery';
import { useAppTheme } from '../theme/AppThemeProvider';
import { AppTheme } from '../theme/tokens';

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  AGUARDANDO_MOTORISTA: 'Aguardando motorista',
  EM_ROTA: 'Em rota',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
  COM_OCORRENCIA: 'Com ocorrencia',
};

const STATUS_COLORS: Record<
  DeliveryStatus,
  {
    background: keyof AppTheme['colors'];
    border: keyof AppTheme['colors'];
    text: keyof AppTheme['colors'];
  }
> = {
  AGUARDANDO_MOTORISTA: {
    background: 'highlight',
    border: 'borderStrong',
    text: 'text',
  },
  EM_ROTA: {
    background: 'statusInfo',
    border: 'statusInfo',
    text: 'statusInfoText',
  },
  ENTREGUE: {
    background: 'statusSuccess',
    border: 'statusSuccess',
    text: 'statusSuccessText',
  },
  CANCELADO: {
    background: 'statusDanger',
    border: 'statusDanger',
    text: 'statusDangerText',
  },
  COM_OCORRENCIA: {
    background: 'statusDanger',
    border: 'statusDanger',
    text: 'statusDangerText',
  },
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const { theme } = useAppTheme();
  const palette = STATUS_COLORS[status];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors[palette.background],
          borderColor: theme.colors[palette.border],
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors[palette.text] }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
