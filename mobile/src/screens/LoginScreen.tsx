import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { AppCard } from '../components/AppCard';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { TrackItBanner } from '../components/brand/TrackItBanner';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../theme/AppThemeProvider';

function MailIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Rect height={16} rx={2} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} width={20} x={2} y={4} />
      <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Rect height={11} rx={2} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} width={18} x={3} y={11} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function ShieldCheckIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={18} viewBox="0 0 24 24" width={18}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="m9 12 2 2 4-4" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
    </Svg>
  );
}

function EyeIcon({ color, open }: { color: string; open: boolean }) {
  return (
    <Svg height={20} viewBox="0 0 24 24" width={20}>
      <Path
        d="M2 12C4.5 7.5 8 5.25 12 5.25C16 5.25 19.5 7.5 22 12C19.5 16.5 16 18.75 12 18.75C8 18.75 4.5 16.5 2 12Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M12 9.25C13.52 9.25 14.75 10.48 14.75 12C14.75 13.52 13.52 14.75 12 14.75C10.48 14.75 9.25 13.52 9.25 12C9.25 10.48 10.48 9.25 12 9.25Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
      {!open ? <Path d="M4 20L20 4" fill="none" stroke={color} strokeWidth={1.8} /> : null}
    </Svg>
  );
}

export function LoginScreen() {
  const { login } = useAuth();
  const { theme } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const sanitizedEmail = email.trim().toLowerCase();

    setSubmitting(true);
    setError(null);

    try {
      await login({ email: sanitizedEmail, senha });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Nao foi possivel entrar com essas credenciais',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function scrollToForm(y = 260) {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y, animated: true });
    });
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        style={styles.keyboardContainer}
        testID="login-keyboard-container"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
          testID="login-scroll-view"
        >
          <View style={styles.container}>
            <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent, borderColor: theme.colors.borderStrong }]}>
              <View style={styles.decorLines}>
                <Svg height={340} style={styles.decorSvg} viewBox="0 0 400 180" width={400}>
                  <Path d="M-20 140 Q100 60 200 90 T420 50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1.5} />
                  <Path d="M-20 160 Q220 80 220 110 T420 70" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
                  <Path d="M-20 120 Q80 40 180 70 T420 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
                  <Circle cx="240" cy="90" fill="rgba(57,255,20,0.08)" r={60} />
                  <Circle cx="320" cy="50" fill="rgba(255,255,255,0.03)" r={30} />
                </Svg>
              </View>

              <View style={styles.brandCenter}>
                <TrackItBanner width={260} height={80} />
              </View>

              <View style={styles.taglineBlock}>
                <Text style={[styles.tagline, { color: theme.colors.accentText }]}>Sua rota começa aqui.</Text>
                <Text style={[styles.taglineAccent, { color: '#39FF14' }]}>Operação em tempo real.</Text>
              </View>

              <View style={[styles.versionStrip, { borderColor: theme.colors.borderStrong }]}>
                <Text style={[styles.versionText, { color: theme.colors.accentText }]}>Rotas</Text>
                <View style={[styles.versionDivider, { backgroundColor: theme.colors.borderStrong }]} />
                <Text style={[styles.versionText, { color: theme.colors.accentText }]}>Operação Motorista</Text>
              </View>
            </View>

            <AppCard>
              <View style={styles.formHeaderRow}>
                <View style={[styles.formIconBubble, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
                  <ShieldCheckIcon color={theme.colors.primary} />
                </View>
                <View style={styles.formHeaderText}>
                  <Text style={[styles.formEyebrow, { color: theme.colors.textMuted }]}>Credenciais</Text>
                  <Text style={[styles.formTitle, { color: theme.colors.text }]}>Acesse sua conta</Text>
                </View>
              </View>

              <View style={[styles.fieldCard, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
                <View style={styles.fieldLabelRow}>
                  <View style={[styles.fieldIconDot, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <MailIcon color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.label, { color: theme.colors.text }]}>E-mail</Text>
                </View>
                <TextInput
                  accessibilityLabel="E-mail"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  onFocus={() => scrollToForm(240)}
                  placeholder="motorista@empresa.com"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  textContentType="username"
                  value={email}
                />
              </View>

              <View style={[styles.fieldCard, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
                <View style={styles.fieldLabelRow}>
                  <View style={[styles.fieldIconDot, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <LockIcon color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Senha</Text>
                </View>
                <View
                  style={[
                    styles.passwordField,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <TextInput
                    accessibilityLabel="Senha"
                    onChangeText={setSenha}
                    onFocus={() => scrollToForm(320)}
                    placeholder="Sua senha"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={!showPassword}
                    style={[styles.passwordInput, { color: theme.colors.text }]}
                    textContentType="password"
                    value={senha}
                  />
                  <Pressable
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => {
                      setShowPassword((current) => !current);
                    }}
                    style={styles.eyeButton}
                  >
                    <EyeIcon color={theme.colors.textMuted} open={showPassword} />
                  </Pressable>
                </View>
              </View>

              {error ? (
                <View style={[styles.errorRow, { backgroundColor: 'rgba(185,28,28,0.08)', borderColor: theme.colors.danger }]}>
                  <View style={[styles.errorDot, { backgroundColor: theme.colors.danger }]} />
                  <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>
                </View>
              ) : null}

              <PrimaryButton
                disabled={submitting}
                onPress={() => {
                  void handleSubmit();
                }}
                title={submitting ? 'Entrando...' : 'Entrar'}
              />
            </AppCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  container: {
    flexGrow: 1,
    padding: 18,
    gap: 18,
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 18,
    position: 'relative',
  },
  decorLines: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  brandCenter: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 8,
  },
  taglineBlock: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 24,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  taglineAccent: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  versionStrip: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    opacity: 0.75,
    textTransform: 'uppercase',
  },
  versionDivider: {
    height: 12,
    width: 1,
    opacity: 0.5,
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
  passwordField: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingLeft: 16,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 52,
  },
  eyeButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
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
