import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { AppScreen } from '../components/AppScreen';
import { InfoRow } from '../components/InfoRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { createOccurrence, OccurrenceType } from '../services/occurrences.service';
import { useAppTheme } from '../theme/AppThemeProvider';
import { getCurrentCoordinates } from '../utils/location';
import { prepareUploadPhoto } from '../utils/uploadPhoto';

type DeliveryOccurrenceScreenProps = {
  route: RouteProp<RootStackParamList, 'DeliveryOccurrence'>;
  navigation?: NativeStackNavigationProp<RootStackParamList, 'DeliveryOccurrence'>;
};

const occurrenceOptions: Array<{ label: string; value: OccurrenceType }> = [
  { label: 'Destinatario ausente', value: 'DESTINATARIO_AUSENTE' },
  { label: 'Endereco nao encontrado', value: 'ENDERECO_NAO_ENCONTRADO' },
  { label: 'Veiculo avariado', value: 'VEICULO_AVARIADO' },
  { label: 'Carga avariada', value: 'CARGA_AVARIADA' },
  { label: 'Acidente', value: 'ACIDENTE' },
  { label: 'Area insegura', value: 'AREA_INSEGURA' },
  { label: 'GPS incompativel', value: 'GPS_INCOMPATIVEL' },
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

      navigation?.replace('History');
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
        <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent }]}> 
          <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>Ocorrencia operacional</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>Entrega #{route.params.delivery.id}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.accentText }]}>Registre o problema com GPS e comprovante.</Text>
        </View>

        <AppCard>
          <InfoRow label="Destino" value={route.params.delivery.destinationAddress} />
          <InfoRow label="Status" value="Em rota" />
        </AppCard>

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tipo da ocorrencia</Text>
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
                      backgroundColor: active ? theme.colors.primary : theme.colors.surfaceMuted,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.optionText, { color: active ? theme.colors.primaryText : theme.colors.text }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: theme.colors.text }]}>Descricao do problema</Text>
          <TextInput
            accessibilityLabel="Descricao da ocorrencia"
            multiline
            onChangeText={setDescription}
            placeholder="Explique o que aconteceu no local da entrega."
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.textArea,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
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
            <Text style={[styles.helper, { color: theme.colors.textMuted }]}>Foto obrigatoria para todos os tipos exceto Outros.</Text>
          )}

          {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

          <PrimaryButton
            disabled={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
            title={isSubmitting ? 'Enviando...' : 'Enviar ocorrencia'}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 18,
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
    lineHeight: 19,
  },
  error: {
    fontSize: 14,
    fontWeight: '700',
  },
});
