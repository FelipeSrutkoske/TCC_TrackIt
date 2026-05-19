import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../theme/AppThemeProvider';

export function LoginScreen() {
  const { login } = useAuth();
  const { theme } = useAppTheme();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      await login({ email, senha });
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
      <View style={styles.container}>
        <AppHeader
          title="Acesse sua conta"
          subtitle="Entre com o usuario motorista vinculado ao TrackIt."
        />

        <AppCard>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>E-mail</Text>
            <TextInput
              accessibilityLabel="E-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="motorista@empresa.com"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={email}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Senha</Text>
            <TextInput
              accessibilityLabel="Senha"
              onChangeText={setSenha}
              placeholder="Sua senha"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={senha}
            />
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
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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
