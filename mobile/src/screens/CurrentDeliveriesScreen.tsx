import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DeliveryCard } from '../components/DeliveryCard';
import { EmptyState } from '../components/EmptyState';
import { AppHeader } from '../components/AppHeader';
import { LoadingState } from '../components/LoadingState';
import { AppScreen } from '../components/AppScreen';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { listCurrentDeliveries } from '../services/deliveries.service';
import { Delivery } from '../types/delivery';
import { useAppTheme } from '../theme/AppThemeProvider';

type CurrentDeliveriesScreenProps = Partial<
  NativeStackScreenProps<RootStackParamList, 'CurrentDeliveries'>
>;

export function CurrentDeliveriesScreen({ navigation }: CurrentDeliveriesScreenProps) {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDeliveries() {
      if (!session?.accessToken) {
        setDeliveries([]);
        setIsLoading(false);
        return;
      }

      try {
        const items = await listCurrentDeliveries(session.accessToken);

        setDeliveries(items);
        setError(null);
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Nao foi possivel carregar as entregas atuais',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDeliveries();
  }, [session?.accessToken]);

  return (
    <AppScreen>
      <View style={styles.container}>
        <AppHeader
          title="Entregas atuais"
          subtitle="Consulte as rotas em andamento e as proximas entregas disponiveis para inicio."
        />

        {isLoading ? <LoadingState message="Carregando entregas..." /> : null}

        {!isLoading && error ? (
          <EmptyState
            title="Falha ao carregar entregas"
            description={error}
          />
        ) : null}

        {!isLoading && !error && deliveries.length === 0 ? (
          <EmptyState
            title="Nenhuma entrega ativa no momento"
            description="Quando novas atribuicoes estiverem disponiveis, elas aparecerao aqui."
          />
        ) : null}

        {!isLoading && !error && deliveries.length > 0 ? (
          <ScrollView contentContainerStyle={styles.list}>
            {deliveries.map((delivery) => (
              <DeliveryCard
                delivery={delivery}
                key={delivery.id}
                onPressDetails={() => {
                  navigation?.navigate?.('DeliveryDetails', { delivery });
                }}
              />
            ))}
          </ScrollView>
        ) : null}
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
  list: {
    gap: 16,
    paddingBottom: 24,
  },
});
