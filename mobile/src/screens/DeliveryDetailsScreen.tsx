import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { DeliveryDetailsSummary } from '../components/DeliveryDetailsSummary';
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
import { openDeliveryAddressInMaps } from '../utils/maps';

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
  }
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

  async function handleStart() {
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
      await openDeliveryAddressInMaps(updatedDelivery.destinationAddress);
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

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Acoes</Text>

          {delivery.status === 'AGUARDANDO_MOTORISTA' ? (
            <PrimaryButton
              disabled={isSubmitting}
              onPress={() => {
                void handleStart();
              }}
              title={isSubmitting ? 'Iniciando...' : 'Iniciar entrega'}
            />
          ) : null}

          {delivery.status === 'EM_ROTA' ? (
            <>
              <SecondaryButton
                onPress={() => {
                  void openDeliveryAddressInMaps(delivery.destinationAddress);
                }}
                title="Abrir no mapa"
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
  error: {
    fontSize: 14,
    fontWeight: '700',
  },
});
