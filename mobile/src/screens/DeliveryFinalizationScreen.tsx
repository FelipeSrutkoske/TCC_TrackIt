import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { DeliveryDetailsSummary } from '../components/DeliveryDetailsSummary';
import { AppScreen } from '../components/AppScreen';
import { InfoRow } from '../components/InfoRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { SignaturePadField } from '../components/SignaturePadField';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { finalizeDelivery } from '../services/finalizations.service';
import { useAppTheme } from '../theme/AppThemeProvider';
import { Coordinates, getCurrentCoordinates } from '../utils/location';
import { prepareUploadPhoto } from '../utils/uploadPhoto';

const LOCATION_PROOF_MESSAGE =
  'Localizacao distante do destino. Anexe uma foto do local para concluir a entrega.';

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
  const [receiverDocument, setReceiverDocument] = useState('');
  const [receiverRelation, setReceiverRelation] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [locationProofPhoto, setLocationProofPhoto] = useState<string | null>(null);
  const [locationProofPreviewUri, setLocationProofPreviewUri] = useState<string | null>(null);
  const [requiresLocationProof, setRequiresLocationProof] = useState(false);
  const [lastCoordinates, setLastCoordinates] = useState<Coordinates | null>(null);
  const isSubmittingRef = useRef(false);

  async function pickLocationProofPhoto() {
    setError(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError('Permita acesso a camera para anexar a foto do local.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.6,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const photo = await prepareUploadPhoto(asset);

    if (!photo) {
      setError('Nao foi possivel preparar a foto do local.');
      return;
    }

    setLocationProofPhoto(photo.dataUri);
    setLocationProofPreviewUri(photo.previewUri);
  }

  async function handleSubmit() {
    if (!session?.accessToken || isSubmittingRef.current) {
      return;
    }

    const trimmedReceiverName = receiverName.trim();
    const documentDigits = receiverDocument.replace(/\D/g, '');
    const trimmedReceiverRelation = receiverRelation.trim();

    if (!trimmedReceiverName) {
      setError('Informe o nome de quem recebeu a entrega.');
      return;
    }

    if (documentDigits.length !== 9 && documentDigits.length !== 11) {
      setError('Informe um RG com 9 digitos ou CPF com 11 digitos.');
      return;
    }

    if (!trimmedReceiverRelation) {
      setError('Informe o parentesco ou grau do recebedor.');
      return;
    }

    if (!signature) {
      setError('Registre a assinatura antes de concluir a entrega.');
      return;
    }

    if (requiresLocationProof && !locationProofPhoto) {
      setError('Anexe uma foto do local para concluir com comprovacao.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const coordinates = lastCoordinates ?? (await getCurrentCoordinates());

      if (!coordinates) {
        setError('Nao foi possivel confirmar a localizacao atual.');
        return;
      }

      setLastCoordinates(coordinates);

      await finalizeDelivery(
        {
          deliveryId: route.params.delivery.id,
          receiverName: trimmedReceiverName,
          receiverDocument: documentDigits,
          receiverRelation: trimmedReceiverRelation,
          signature,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          ...(coordinates.accuracy !== undefined
            ? { gpsAccuracyMeters: coordinates.accuracy }
            : {}),
          ...(locationProofPhoto ? { photoUrl: locationProofPhoto } : {}),
        },
        session.accessToken,
      );

      navigation?.replace?.('History');
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : 'Nao foi possivel finalizar a entrega';

      if (message === LOCATION_PROOF_MESSAGE) {
        setRequiresLocationProof(true);
        setError('Sua localizacao parece distante do endereco da entrega. Anexe uma foto do local para concluir.');
        return;
      }

      setError(message);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        scrollEnabled={scrollEnabled}
        testID="delivery-finalization-scroll"
      >
        <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent }]}> 
          <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>Encerramento operacional</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>Baixa da entrega #{route.params.delivery.id}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.accentText }]}>Fechar entrega com validacao completa</Text>
        </View>

        <AppCard>
          <InfoRow label="Empresa cliente" value={route.params.delivery.company?.corporateName ?? `Entrega #${route.params.delivery.id}`} />
          <InfoRow label="Criada em" value={formatDateTime(route.params.delivery.createdAt)} />
          <InfoRow label="Destino" value={route.params.delivery.destinationAddress} />
          <InfoRow label="Status atual" value="Em rota" />
        </AppCard>

        <DeliveryDetailsSummary
          details={route.params.delivery.details}
          emptyMessage="Nenhum detalhe de carga informado para esta entrega."
          title="Conferencia da carga"
        />

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

          <Text style={[styles.label, { color: theme.colors.text }]}>Documento do recebedor</Text>
          <TextInput
            accessibilityLabel="Documento do recebedor"
            keyboardType="number-pad"
            onChangeText={setReceiverDocument}
            placeholder="CPF com 11 digitos ou RG com 9 digitos"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            testID="receiver-document-input"
            value={receiverDocument}
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>Parentesco ou grau</Text>
          <TextInput
            accessibilityLabel="Parentesco ou grau"
            onChangeText={setReceiverRelation}
            placeholder="Ex.: Irmao, primo, porteiro"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            testID="receiver-relation-input"
            value={receiverRelation}
          />

          <SignaturePadField
            label="Assinatura do recebedor"
            onChange={setSignature}
            onDrawEnd={() => {
              setScrollEnabled(true);
            }}
            onDrawStart={() => {
              setScrollEnabled(false);
            }}
            value={signature}
          />

          {requiresLocationProof ? (
            <View style={[styles.proofBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted }]}>
              <Text style={[styles.proofTitle, { color: theme.colors.text }]}>Comprovacao de localizacao</Text>
              <Text style={[styles.proofText, { color: theme.colors.textMuted }]}>Sua localizacao parece distante do endereco da entrega. Tire uma foto do local para concluir.</Text>
              <SecondaryButton
                onPress={() => {
                  void pickLocationProofPhoto();
                }}
                title="Anexar foto do local"
              />
              {locationProofPreviewUri ? (
                <Image source={{ uri: locationProofPreviewUri }} style={styles.proofImage} />
              ) : null}
            </View>
          ) : null}

          {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

          <PrimaryButton
            disabled={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
            title={
              isSubmitting
                ? 'Finalizando...'
                : requiresLocationProof
                  ? 'Finalizar com comprovacao'
                  : 'Finalizar entrega'
            }
          />
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
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    fontWeight: '700',
  },
  proofBox: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  proofTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  proofText: {
    fontSize: 14,
    lineHeight: 20,
  },
  proofImage: {
    height: 180,
    width: '100%',
    borderRadius: 16,
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
