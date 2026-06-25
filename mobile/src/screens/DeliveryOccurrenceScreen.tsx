import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

function AlertTriangleIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function MapPinIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function RadioIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth={2} />
      <Path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function PenIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}
import * as ImagePicker from 'expo-image-picker';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { createOccurrence, OccurrenceType } from '../services/occurrences.service';
import { useAppTheme } from '../theme/AppThemeProvider';
import { getDeliveryDisplayCode, getDeliveryDisplayLabel } from '../utils/deliveryDisplay';
import { getCurrentCoordinates } from '../utils/location';
import { prepareUploadPhoto } from '../utils/uploadPhoto';

type DeliveryOccurrenceScreenProps = {
  route: RouteProp<RootStackParamList, 'DeliveryOccurrence'>;
  navigation?: NativeStackNavigationProp<RootStackParamList, 'DeliveryOccurrence'>;
};

const occurrenceOptions: Array<{ label: string; value: OccurrenceType }> = [
  { label: 'Destinatario ausente', value: 'DESTINATARIO_AUSENTE' },
  { label: 'Veiculo avariado', value: 'VEICULO_AVARIADO' },
  { label: 'Carga avariada', value: 'CARGA_AVARIADA' },
  { label: 'Acidente', value: 'ACIDENTE' },
  { label: 'Outros', value: 'OUTROS' },
];

function requiresPhoto(type: OccurrenceType | '') {
  return type !== '' && type !== 'OUTROS';
}

export function DeliveryOccurrenceScreen({ navigation, route }: DeliveryOccurrenceScreenProps) {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [selectedType, setSelectedType] = useState<OccurrenceType | ''>('');
  const [description, setDescription] = useState('');
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  async function pickPhoto(source: 'camera' | 'library') {
    setError(null);

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Permita acesso a camera ou galeria para anexar a foto.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 0.6 });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const nextPhoto = await prepareUploadPhoto(asset);

    if (!nextPhoto) {
      setError('Nao foi possivel preparar a foto selecionada.');
      return;
    }

    setPhotoDataUri(nextPhoto.dataUri);
    setPhotoPreviewUri(nextPhoto.previewUri);
  }

  async function handleSubmit() {
    if (!session?.accessToken || isSubmittingRef.current) {
      return;
    }

    const trimmedDescription = description.trim();

    if (!selectedType) {
      setError('Selecione o tipo da ocorrencia.');
      return;
    }

    if (trimmedDescription.length < 10) {
      setError('Descreva o problema com pelo menos 10 caracteres.');
      return;
    }

    if (requiresPhoto(selectedType) && !photoDataUri) {
      setError('Anexe uma foto para comprovar esta ocorrencia.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const coordinates = await getCurrentCoordinates();

      if (!coordinates) {
        setError('Nao foi possivel capturar a localizacao atual.');
        return;
      }

      await createOccurrence(
        {
          entregaId: route.params.delivery.id,
          tipoOcorrencia: selectedType,
          descricao: trimmedDescription,
          ...(photoDataUri ? { fotoProva: photoDataUri } : {}),
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          gpsAccuracyMeters: coordinates.accuracy,
        },
        session.accessToken,
      );

      navigation?.reset({ index: 0, routes: [{ name: 'History' }] });
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Nao foi possivel registrar a ocorrencia',
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent, borderColor: theme.colors.borderStrong }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroHeaderText}>
              <View style={styles.statusPillRow}>
                <View style={[styles.liveDot, { backgroundColor: theme.colors.statusDanger }]} />
                <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>Ocorrencia de transporte</Text>
              </View>
              <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>{getDeliveryDisplayLabel(route.params.delivery)}</Text>
            </View>
          </View>
          <Text style={[styles.heroSubtitle, { color: theme.colors.accentText }]}>Preencha os dados da ocorrencia para registrar o problema.</Text>
          <View style={styles.heroMetricGrid}>
            <View style={styles.heroMetricBlock}>
              <Text style={[styles.heroMetricLabel, { color: theme.colors.accentText }]}>Status</Text>
              <Text style={[styles.heroMetricValue, { color: theme.colors.accentText }]}>Em rota</Text>
            </View>
            <View style={styles.heroMetricBlock}>
              <Text style={[styles.heroMetricLabel, { color: theme.colors.accentText }]}>Entrega</Text>
              <Text style={[styles.heroMetricValue, { color: theme.colors.accentText }]}>#{getDeliveryDisplayCode(route.params.delivery)}</Text>
            </View>
          </View>
          <View style={styles.contextPanel}>
            <Text style={[styles.contextLabel, { color: theme.colors.accentText }]}>Endereço da entrega</Text>
            <Text style={[styles.contextValue, { color: theme.colors.accentText }]}>{route.params.delivery.destinationAddress}</Text>
          </View>
        </View>

        <AppCard>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBubble, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
              <AlertTriangleIcon color={theme.colors.primary} />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>Classificacao</Text>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tipo da ocorrencia</Text>
            </View>
          </View>

          <View style={styles.optionsGrid}>
            {occurrenceOptions.map((option) => {
              const active = selectedType === option.value;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  onPress={() => setSelectedType(option.value)}
                  style={[
                    styles.option,
                    {
                      backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  {active ? <View style={[styles.optionDot, { backgroundColor: theme.colors.primaryText }]} /> : null}
                  <Text style={[styles.optionText, { color: active ? theme.colors.primaryText : theme.colors.text }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.sectionDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.fieldLabelRow}>
            <View style={[styles.fieldIconDot, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
              <PenIcon color={theme.colors.primary} />
            </View>
            <Text style={[styles.label, { color: theme.colors.text }]}>Descricao do ocorrido</Text>
          </View>
          <TextInput
            accessibilityLabel="Descricao da ocorrencia"
            multiline
            onChangeText={setDescription}
            placeholder="Explique o que aconteceu durante a entrega."
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.textArea,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceMuted,
              },
            ]}
            value={description}
          />

          <View style={styles.photoActions}>
            <SecondaryButton
              onPress={() => {
                void pickPhoto('camera');
              }}
              title="Tirar foto"
            />
            <SecondaryButton
              onPress={() => {
                void pickPhoto('library');
              }}
              title="Escolher foto"
            />
          </View>

          {photoPreviewUri ? (
            <Image source={{ uri: photoPreviewUri }} style={styles.photoPreview} />
          ) : (
            <Text style={[styles.helper, { color: theme.colors.textMuted }]}>Anexe uma foto para comprovar a ocorrencia.</Text>
          )}

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
            title={isSubmitting ? 'Enviando...' : 'Registrar ocorrencia'}
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
    fontSize: 11,
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
    opacity: 0.88,
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
  contextPanel: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 18,
    gap: 6,
    padding: 12,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    opacity: 0.78,
    textTransform: 'uppercase',
  },
  contextValue: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  sectionIconBubble: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    flexGrow: 1,
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    borderRadius: 1,
    opacity: 0.5,
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
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 16,
    fontSize: 16,
    padding: 16,
    textAlignVertical: 'top',
  },
  photoActions: {
    gap: 12,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 18,
  },
  helper: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
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
});
