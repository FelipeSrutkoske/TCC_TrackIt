import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
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
import { openDeliveryAddressInMaps } from '../utils/maps';

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
      const updatedDelivery = await startDelivery(delivery.id, session.accessToken);

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
        <AppHeader
          title={`Entrega #${delivery.id}`}
          subtitle="Confira os dados operacionais antes de iniciar o deslocamento."
        />

        <AppCard>
          <StatusBadge status={delivery.status} />
          <InfoRow label="Destino" value={delivery.destinationAddress} />
          <InfoRow label="Motorista vinculado" value={`#${delivery.driverId}`} />
        </AppCard>

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
    padding: 24,
    gap: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  error: {
    fontSize: 14,
    fontWeight: '500',
  },
});
