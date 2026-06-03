import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { DeliveryDetailsSummary } from '../components/DeliveryDetailsSummary';
import { DeliveryRoutePreview } from '../components/DeliveryRoutePreview';
import { AppHeader } from '../components/AppHeader';
import { AppScreen } from '../components/AppScreen';
import { InfoRow } from '../components/InfoRow';
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
        <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent }]}> 
          <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>Missao operacional</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>Entrega #{delivery.id}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.accentText }]}>Confira os dados operacionais antes de iniciar o deslocamento.</Text>
          <Text style={[styles.phaseLabel, { color: theme.colors.accentText }]}>{getDeliveryPhase(delivery.status)}</Text>
        </View>

        <AppCard>
          <StatusBadge status={delivery.status} />
          <InfoRow label="Destino" value={delivery.destinationAddress} />
          <InfoRow label="Motorista vinculado" value={`#${delivery.driverId}`} />
        </AppCard>

        <DeliveryDetailsSummary
          details={delivery.details}
          emptyMessage="Nenhum detalhe de carga informado para esta entrega."
          title="Detalhes da carga"
        />

        <DeliveryRoutePreview delivery={delivery} />

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Acoes</Text>

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
  hero: {
    borderRadius: 30,
    gap: 12,
    padding: 20,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  phaseLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
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
