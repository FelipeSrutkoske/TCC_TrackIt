import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import { AppScreen } from '../components/AppScreen';
import { SecondaryButton } from '../components/SecondaryButton';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/AppThemeProvider';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { session, logout } = useAuth();
  const { theme } = useAppTheme();

  return (
    <AppScreen>
      <View style={styles.container}>
        <AppHeader
          title="Painel do motorista"
          subtitle="Acompanhe as entregas ativas e inicie a rota direto pelo aplicativo."
        />

        <AppCard>
          <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>Usuario autenticado</Text>
          <Text style={[styles.metaValue, { color: theme.colors.text }]}>{session?.user.nome}</Text>
          <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{session?.user.email}</Text>
          <SecondaryButton
            onPress={() => {
              navigation.navigate('CurrentDeliveries');
            }}
            title="Ver entregas atuais"
          />
          <SecondaryButton
            onPress={() => {
              navigation.navigate('History');
            }}
            title="Ver historico"
          />
          <SecondaryButton
            onPress={() => {
              void logout();
            }}
            title="Sair"
          />
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  metaLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 15,
  },
});
