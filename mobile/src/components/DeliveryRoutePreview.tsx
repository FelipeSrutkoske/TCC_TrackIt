import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { Delivery } from '../types/delivery';
import { useAppTheme } from '../theme/AppThemeProvider';
import { Coordinates, getCurrentCoordinates } from '../utils/location';
import { calculateDistanceMeters, formatDistance } from '../utils/distance';
import { buildStaticMapUrl } from '../utils/staticMaps';
import { openDeliveryDirectionsInMaps } from '../utils/maps';

function toNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function DeliveryRoutePreview({ delivery }: { delivery: Delivery }) {
  const { theme } = useAppTheme();
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latitudeDestino = toNumber(delivery.latitudeDestino);
  const longitudeDestino = toNumber(delivery.longitudeDestino);
  const hasDestinationCoordinates = latitudeDestino !== null && longitudeDestino !== null;
  const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  async function loadCurrentCoordinates() {
    setIsLoading(true);
    setError(null);

    try {
      const coordinates = await getCurrentCoordinates();

      if (!coordinates) {
        setError('Nao foi possivel capturar sua localizacao atual.');
        return;
      }

      setCurrentCoordinates(coordinates);
    } catch {
      setError('Nao foi possivel capturar sua localizacao atual.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (hasDestinationCoordinates) {
      void loadCurrentCoordinates();
    }
  }, [hasDestinationCoordinates]);

  if (!hasDestinationCoordinates) {
    return (
      <AppCard>
        <Text style={[styles.title, { color: theme.colors.text }]}>Rota ate o destino</Text>
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>Coordenadas do destino nao disponiveis.</Text>
        <SecondaryButton
          onPress={() => {
            void openDeliveryDirectionsInMaps(delivery.destinationAddress);
          }}
          title="Abrir endereco no mapa"
        />
      </AppCard>
    );
  }

  const destination = { latitude: latitudeDestino, longitude: longitudeDestino };
  const distanceMeters = currentCoordinates
    ? calculateDistanceMeters(currentCoordinates, destination)
    : null;
  const staticMapUrl =
    currentCoordinates && mapsApiKey
      ? buildStaticMapUrl(currentCoordinates, destination, mapsApiKey)
      : null;

  return (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Rota ate o destino</Text>
          <Text style={[styles.helper, { color: theme.colors.textMuted }]}>Mapa previo antes de iniciar a entrega.</Text>
        </View>
        {distanceMeters !== null ? (
          <Text style={[styles.distance, { color: theme.colors.primary }]}>{formatDistance(distanceMeters)}</Text>
        ) : null}
      </View>

      {staticMapUrl ? (
        <Image source={{ uri: staticMapUrl }} style={styles.mapImage} />
      ) : (
        <View style={[styles.fallback, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted }]}> 
          <Text style={[styles.helper, { color: theme.colors.textMuted }]}> 
            {currentCoordinates
              ? 'Configure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para exibir o mapa aqui.'
              : error ?? 'Calculando sua localizacao atual...'}
          </Text>
        </View>
      )}

      <Text style={[styles.address, { color: theme.colors.text }]}>
        {delivery.enderecoDestinoFormatado || delivery.destinationAddress}
      </Text>

      <View style={styles.actions}>
        <SecondaryButton
          onPress={() => {
            void loadCurrentCoordinates();
          }}
          title={isLoading ? 'Calculando...' : 'Calcular rota'}
        />
        <PrimaryButton
          onPress={() => {
            void openDeliveryDirectionsInMaps(destination);
          }}
          title="Abrir no Google Maps"
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  helper: {
    fontSize: 13,
    lineHeight: 19,
  },
  distance: {
    fontSize: 16,
    fontWeight: '900',
  },
  mapImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
  },
  fallback: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'center',
    padding: 16,
  },
  address: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
});
