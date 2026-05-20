import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import { AppScreen } from '../components/AppScreen';
import { InfoRow } from '../components/InfoRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { SignaturePadField } from '../components/SignaturePadField';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { finalizeDelivery } from '../services/finalizations.service';
import { useAppTheme } from '../theme/AppThemeProvider';
import { getCurrentCoordinates } from '../utils/location';

type DeliveryFinalizationScreenProps = {
  route: RouteProp<RootStackParamList, 'DeliveryFinalization'>;
  navigation?: Pick<
    NativeStackNavigationProp<RootStackParamList, 'DeliveryFinalization'>,
    'replace'
  >;
};

export function DeliveryFinalizationScreen({
  navigation,
  route,
}: DeliveryFinalizationScreenProps) {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [receiverName, setReceiverName] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  async function handleSubmit() {
    if (!session?.accessToken || isSubmittingRef.current) {
      return;
    }

    const trimmedReceiverName = receiverName.trim();

    if (!trimmedReceiverName) {
      setError('Informe o nome de quem recebeu a entrega.');
      return;
    }

    if (!signature) {
      setError('Registre a assinatura antes de concluir a entrega.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const coordinates = await getCurrentCoordinates();

      if (!coordinates) {
        setError('Nao foi possivel confirmar a localizacao atual.');
        return;
      }

      await finalizeDelivery(
        {
          deliveryId: route.params.delivery.id,
          receiverName: trimmedReceiverName,
          signature,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
        session.accessToken,
      );

      navigation?.replace?.('History');
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Nao foi possivel finalizar a entrega',
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader
          title={`Baixa da entrega #${route.params.delivery.id}`}
          subtitle="Confirme o recebedor, registre a assinatura e envie a geolocalizacao do encerramento."
        />

        <AppCard>
          <InfoRow label="Destino" value={route.params.delivery.destinationAddress} />
          <InfoRow label="Status atual" value="Em rota" />
        </AppCard>

        <AppCard>
          <Text style={[styles.label, { color: theme.colors.text }]}>Nome do recebedor</Text>
          <TextInput
            accessibilityLabel="Nome do recebedor"
            onChangeText={setReceiverName}
            placeholder="Ex.: Maria da Silva"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            testID="receiver-name-input"
            value={receiverName}
          />

          <SignaturePadField
            label="Assinatura do recebedor"
            onChange={setSignature}
            value={signature}
          />

          {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

          <PrimaryButton
            disabled={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
            title={isSubmitting ? 'Finalizando...' : 'Finalizar entrega'}
          />
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
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    fontWeight: '500',
  },
});
