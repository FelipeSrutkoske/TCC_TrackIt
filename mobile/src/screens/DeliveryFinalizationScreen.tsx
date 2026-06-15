import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

function UserIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function IdCardIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Rect height={16} rx={2} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} width={20} x={2} y={4} />
      <Path d="M6 8h.01M10 8h8M6 12h.01M10 12h8M6 16h.01M10 16h8" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function UsersIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={18} viewBox="0 0 24 24" width={18}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="m9 12 2 2 4-4" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function CameraIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}
import * as ImagePicker from 'expo-image-picker';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { DeliveryDetailsSummary } from '../components/DeliveryDetailsSummary';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { SignaturePadField } from '../components/SignaturePadField';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { finalizeDelivery } from '../services/finalizations.service';
import { useAppTheme } from '../theme/AppThemeProvider';
import { Coordinates, getCurrentCoordinates } from '../utils/location';
import { isValidCpf, maskCpf, onlyDigits } from '../utils/masks';
import { prepareUploadPhoto } from '../utils/uploadPhoto';

const LOCATION_PROOF_MESSAGE =
  'Localizacao distante do destino. Anexe uma foto do local para concluir a entrega.';

type DeliveryFinalizationScreenProps = {
  route: RouteProp<RootStackParamList, 'DeliveryFinalization'>;
  navigation?: Pick<
    NativeStackNavigationProp<RootStackParamList, 'DeliveryFinalization'>,
    'reset'
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
    const documentDigits = onlyDigits(receiverDocument);
    const trimmedReceiverRelation = receiverRelation.trim();

    if (!trimmedReceiverName) {
      setError('Informe o nome de quem recebeu a entrega.');
      return;
    }

    if (
      (documentDigits.length !== 9 && documentDigits.length !== 11) ||
      (documentDigits.length === 11 && !isValidCpf(documentDigits))
    ) {
      setError('Informe um CPF valido ou RG com 9 digitos.');
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

      navigation?.reset?.({ index: 0, routes: [{ name: 'History' }] });
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
        <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent, borderColor: theme.colors.borderStrong }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroHeaderText}>
              <View style={styles.statusPillRow}>
                <View style={[styles.liveDot, { backgroundColor: theme.colors.statusSuccess }]} />
                <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>Fechamento operacional</Text>
              </View>
              <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>
                {route.params.delivery.company?.corporateName ?? `Entrega #${route.params.delivery.id}`}
              </Text>
              <Text style={[styles.heroSubtitle, styles.deliveryCode]}>Entrega #{route.params.delivery.id}</Text>
            </View>
          </View>
          <View style={styles.heroMetricGrid}>
            <View style={styles.heroMetricBlock}>
              <Text style={[styles.heroMetricLabel, { color: theme.colors.accentText }]}>Criada em</Text>
              <Text style={[styles.heroMetricValue, { color: theme.colors.accentText }]} numberOfLines={1}>{formatDateTime(route.params.delivery.createdAt)}</Text>
            </View>
            <View style={styles.heroMetricBlock}>
              <Text style={[styles.heroMetricLabel, { color: theme.colors.accentText }]}>Status</Text>
              <Text style={[styles.heroMetricValue, { color: theme.colors.accentText }]}>Em rota</Text>
            </View>
          </View>
          <View style={styles.destinationPanel}>
            <Text style={[styles.destinationLabel, { color: theme.colors.accentText }]}>Destino para baixa</Text>
            <Text style={[styles.destinationText, { color: theme.colors.accentText }]}>{route.params.delivery.destinationAddress}</Text>
          </View>
        </View>

        <DeliveryDetailsSummary
          details={route.params.delivery.details}
          emptyMessage="Nenhum detalhe de carga informado para esta entrega."
          title="Conferencia da carga"
        />

        <AppCard>
          <View style={styles.formHeaderRow}>
            <View style={[styles.formIconBubble, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
              <ShieldIcon color={theme.colors.primary} />
            </View>
            <View style={styles.formHeaderText}>
              <Text style={[styles.formEyebrow, { color: theme.colors.textMuted }]}>Recebedor e comprovante</Text>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>Dados do recebedor</Text>
            </View>
          </View>

          <View style={[styles.fieldCard, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
            <View style={styles.fieldLabelRow}>
              <View style={[styles.fieldIconDot, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <UserIcon color={theme.colors.primary} />
              </View>
              <Text style={[styles.label, { color: theme.colors.text }]}>Nome do recebedor</Text>
            </View>
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
                  backgroundColor: theme.colors.surface,
                },
              ]}
              testID="receiver-name-input"
              value={receiverName}
            />
          </View>

          <View style={[styles.fieldCard, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
            <View style={styles.fieldLabelRow}>
              <View style={[styles.fieldIconDot, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <IdCardIcon color={theme.colors.primary} />
              </View>
              <Text style={[styles.label, { color: theme.colors.text }]}>Documento do recebedor</Text>
            </View>
            <TextInput
              accessibilityLabel="Documento do recebedor"
              keyboardType="number-pad"
              onChangeText={(value) => setReceiverDocument(maskReceiverDocument(value))}
              placeholder="CPF ou RG validos."
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              testID="receiver-document-input"
              value={receiverDocument}
            />
          </View>

          <View style={[styles.fieldCard, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
            <View style={styles.fieldLabelRow}>
              <View style={[styles.fieldIconDot, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <UsersIcon color={theme.colors.primary} />
              </View>
              <Text style={[styles.label, { color: theme.colors.text }]}>Parentesco ou grau</Text>
            </View>
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
                  backgroundColor: theme.colors.surface,
                },
              ]}
              testID="receiver-relation-input"
              value={receiverRelation}
            />
          </View>

          <View style={[styles.signatureDivider, { backgroundColor: theme.colors.border }]} />

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
              <View style={styles.proofHeader}>
                <View style={[styles.proofIconBubble, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <CameraIcon color={theme.colors.primary} />
                </View>
                <View style={styles.proofHeaderText}>
                  <Text style={[styles.proofTitle, { color: theme.colors.text }]}>Comprovacao de localizacao</Text>
                  <Text style={[styles.proofText, { color: theme.colors.textMuted }]}>Localizacao distante. Anexe uma foto.</Text>
                </View>
              </View>
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

          {error ? (
            <View style={[styles.errorRow, { backgroundColor: 'rgba(185,28,28,0.08)', borderColor: theme.colors.danger }]}>
              <View style={[styles.errorDot, { backgroundColor: theme.colors.danger }]} />
              <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>
            </View>
          ) : null}

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
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  heroHeaderText: {
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
    fontWeight: '800',
    lineHeight: 22,
  },
  deliveryCode: {
    color: '#39FF14',
  },
  heroMetricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  heroMetricBlock: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 10,
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.75,
    textTransform: 'uppercase',
  },
  heroMetricValue: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  destinationPanel: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 18,
    gap: 6,
    padding: 12,
  },
  destinationLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    opacity: 0.78,
    textTransform: 'uppercase',
  },
  destinationText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  formHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  formIconBubble: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  formHeaderText: {
    flex: 1,
    gap: 2,
  },
  formEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  fieldCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  fieldLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  fieldIconDot: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  signatureDivider: {
    height: 1,
    borderRadius: 1,
    opacity: 0.5,
  },
  errorRow: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  error: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  proofBox: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  proofHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  proofIconBubble: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  proofHeaderText: {
    flex: 1,
    gap: 2,
  },
  proofTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  proofText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
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

function maskReceiverDocument(value: string) {
  const digits = onlyDigits(value);

  return digits.length > 9 ? maskCpf(digits) : digits;
}
