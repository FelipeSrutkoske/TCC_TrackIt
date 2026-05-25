import React, { useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { AppCard } from '../components/AppCard';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { TrackItBanner } from '../components/brand/TrackItBanner';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../theme/AppThemeProvider';

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

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        testID="login-keyboard-container"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={[styles.hero, { backgroundColor: theme.colors.surfaceAccent }]}> 
              <View style={styles.heroCopy}>
                <Text style={[styles.heroEyebrow, { color: theme.colors.accentText }]}>TrackIt Mobile</Text>
                <Text style={[styles.heroTitle, { color: theme.colors.accentText }]}>Acesse sua rota com identidade TrackIt.</Text>
                <Text style={[styles.heroSubtitle, { color: theme.colors.accentText }]}>Entre com o usuario motorista para acompanhar entregas e operar a jornada do dia.</Text>
              </View>
              <TrackItBanner />
            </View>

            <View style={styles.content}>
              <View style={styles.headingBlock}>
                <Text style={[styles.headingTitle, { color: theme.colors.text }]}>Acesse sua conta</Text>
                <Text style={[styles.headingSubtitle, { color: theme.colors.textMuted }]}>Entre com o usuario motorista vinculado ao TrackIt.</Text>
              </View>

              <AppCard>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>E-mail</Text>
                  <TextInput
                    accessibilityLabel="E-mail"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="motorista@empresa.com"
                    placeholderTextColor={theme.colors.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.borderStrong,
                        color: theme.colors.text,
                      },
                    ]}
                    textContentType="username"
                    value={email}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Senha</Text>
                  <View
                    style={[
                      styles.passwordField,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.borderStrong,
                      },
                    ]}
                  >
                    <TextInput
                      accessibilityLabel="Senha"
                      onChangeText={setSenha}
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

                {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

                <PrimaryButton
                  disabled={submitting}
                  onPress={() => {
                    void handleSubmit();
                  }}
                  title={submitting ? 'Entrando...' : 'Entrar'}
                />
              </AppCard>
            </View>
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
  },
  container: {
    flexGrow: 1,
    padding: 18,
    gap: 20,
  },
  hero: {
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    overflow: 'hidden',
    gap: 18,
  },
  heroCopy: {
    gap: 10,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  content: {
    gap: 16,
  },
  headingBlock: {
    gap: 6,
  },
  headingTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headingSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordField: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 56,
  },
  eyeButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  error: {
    fontSize: 14,
    fontWeight: '700',
  },
});
