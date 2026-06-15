import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { DeliveryDetailsSummary } from '../components/DeliveryDetailsSummary';
import { DeliveryRoutePreview } from '../components/DeliveryRoutePreview';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { startDelivery } from '../services/deliveries.service';
import { Delivery } from '../types/delivery';
import { useAppTheme } from '../theme/AppThemeProvider';
import { getCurrentCoordinates } from '../utils/location';
import { openDeliveryAddressInMaps, openDeliveryDirectionsInMaps } from '../utils/maps';

function getDeliveryPhase(status: Delivery['status']) {
  switch (status) {
    case 'AGUARDANDO_MOTORISTA':
      return 'Aguardando despacho';
    case 'EM_ROTA':
      return 'Em deslocamento';
    case 'ENTREGUE':
      return 'Entrega concluida';
    case 'CANCELADO':
      return 'Ocorrencia encerrada';
    case 'COM_OCORRENCIA':
      return 'Com ocorrencia';
  }
}

function toNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getDriverName(delivery: Delivery) {
  return delivery.driver?.user?.nome ?? `#${delivery.driverId}`;
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

function MapNavigationIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
      <Path d="M12 21s6-5.35 6-11a6 6 0 0 0-12 0c0 5.65 6 11 6 11Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Path d="M12 12.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

type DeliveryDetailsScreenProps = {
  route: RouteProp<RootStackParamList, 'DeliveryDetails'>;
  navigation?: NativeStackNavigationProp<RootStackParamList, 'DeliveryDetails'>;
};

export function DeliveryDetailsScreen({ route, navigation }: DeliveryDetailsScreenProps) {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [delivery, setDelivery] = useState<Delivery>(route.params.delivery);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(openMapsAfterStart = false) {
    if (!session?.accessToken) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const coordenadasInicio = await getCurrentCoordinates();

      if (!coordenadasInicio) {
        setError('Nao foi possivel capturar a localizacao de inicio da entrega.');
        return;
      }

      const updatedDelivery = await startDelivery(delivery.id, session.accessToken, {
        latitudeInicio: coordenadasInicio.latitude,
        longitudeInicio: coordenadasInicio.longitude,
      });

      setDelivery(updatedDelivery);

      if (openMapsAfterStart) {
        const latitudeDestino = toNumber(updatedDelivery.latitudeDestino);
        const longitudeDestino = toNumber(updatedDelivery.longitudeDestino);
        const destination = latitudeDestino !== null && longitudeDestino !== null
          ? { latitude: latitudeDestino, longitude: longitudeDestino }
          : updatedDelivery.destinationAddress;

        await openDeliveryDirectionsInMaps(destination);
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Nao foi possivel iniciar a entrega',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <View
          style={[
            styles.dispatchPanel,
            {
              backgroundColor: theme.colors.surfaceAccent,
              borderColor: theme.colors.borderStrong,
            },
          ]}
        >
          <View style={styles.dispatchHeader}>
            <View style={styles.dispatchHeaderText}>
              <View style={styles.statusPillRow}>
                <View style={[styles.liveDot, { backgroundColor: theme.colors.statusSuccess }]} />
                <Text style={[styles.dispatchEyebrow, { color: theme.colors.accentText }]}>Painel da entrega</Text>
              </View>
              <Text style={[styles.dispatchTitle, { color: theme.colors.accentText }]}>Missao operacional</Text>
              <Text style={[styles.dispatchSubtitle, { color: theme.colors.accentText }]}>Entrega #{delivery.id}</Text>
            </View>
            <StatusBadge status={delivery.status} />
          </View>

          <Text style={[styles.dispatchDescription, { color: theme.colors.accentText }]}>Confira os dados operacionais antes de iniciar o deslocamento.</Text>

          <View style={styles.metricGrid}>
            <View style={[styles.metricBlock, { borderColor: theme.colors.borderStrong }]}>
              <Text style={[styles.metricBlockLabel, { color: theme.colors.accentText }]}>Status</Text>
              <Text style={[styles.metricBlockValue, { color: theme.colors.accentText }]}>{getDeliveryPhase(delivery.status)}</Text>
            </View>
            <View style={[styles.metricBlock, { borderColor: theme.colors.borderStrong }]}>
              <Text style={[styles.metricBlockLabel, { color: theme.colors.accentText }]}>Motorista</Text>
              <Text style={[styles.metricBlockValue, { color: theme.colors.accentText }]} numberOfLines={1}>{getDriverName(delivery)}</Text>
            </View>
            <View style={[styles.metricBlock, { borderColor: theme.colors.borderStrong }]}>
              <Text style={[styles.metricBlockLabel, { color: theme.colors.accentText }]}>Criada em</Text>
              <Text style={[styles.metricBlockValue, { color: theme.colors.accentText }]} numberOfLines={1}>{formatDateTime(delivery.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.contextPanel}>
            <View style={styles.contextHeader}>
              <Text style={[styles.contextTitle, { color: theme.colors.accentText }]}>Contexto operacional</Text>
              <Text style={[styles.contextHint, { color: theme.colors.accentText }]}>destino da missao</Text>
            </View>
            <Text style={[styles.destinationText, { color: theme.colors.accentText }]}>{delivery.destinationAddress}</Text>
          </View>
        </View>

        <DeliveryDetailsSummary
          details={delivery.details}
          emptyMessage="Nenhum detalhe de carga informado para esta entrega."
          title="Detalhes da carga"
        />

        <DeliveryRoutePreview delivery={delivery} />

        <AppCard>
          <Text style={[styles.actionEyebrow, { color: theme.colors.textMuted }]}>Proxima etapa</Text>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Acoes da entrega</Text>

          {delivery.status === 'AGUARDANDO_MOTORISTA' ? (
            <View style={styles.startActionsRow}>
              <View style={styles.startPrimaryAction}>
                <PrimaryButton
                  disabled={isSubmitting}
                  onPress={() => {
                    void handleStart(false);
                  }}
                  title={isSubmitting ? 'Iniciando...' : 'Iniciar entrega'}
                />
              </View>
              <Pressable
                accessibilityLabel="Iniciar entrega e abrir mapa"
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => {
                  void handleStart(true);
                }}
                style={[
                  styles.startMapAction,
                  {
                    backgroundColor: isSubmitting ? theme.colors.surfaceMuted : theme.colors.primary,
                    borderColor: isSubmitting ? theme.colors.border : theme.colors.primary,
                  },
                ]}
              >
                <MapNavigationIcon color={theme.colors.primaryText} />
              </Pressable>
            </View>
          ) : null}

          {delivery.status === 'EM_ROTA' ? (
            <>
              <SecondaryButton
                onPress={() => {
                  void openDeliveryAddressInMaps(delivery.destinationAddress);
                }}
                title="Abrir no mapa"
              />
              <SecondaryButton
                onPress={() => {
                  navigation?.navigate('DeliveryOccurrence', { delivery });
                }}
                title="Relatar ocorrencia"
              />
              <PrimaryButton
                onPress={() => {
                  navigation?.navigate('DeliveryFinalization', { delivery });
                }}
                title="Finalizar entrega"
              />
            </>
          ) : null}

          {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 18,
  },
  dispatchPanel: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  dispatchHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
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
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dispatchEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  dispatchTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  dispatchSubtitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dispatchDescription: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.88,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBlock: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 10,
  },
  metricBlockLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.75,
    textTransform: 'uppercase',
  },
  metricBlockValue: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  contextPanel: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 18,
    gap: 8,
    padding: 12,
  },
  contextHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  contextTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  contextHint: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.7,
  },
  destinationText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  startActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  startPrimaryAction: {
    flex: 1,
  },
  startMapAction: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    width: 64,
  },
  error: {
    fontSize: 14,
    fontWeight: '700',
  },
});
