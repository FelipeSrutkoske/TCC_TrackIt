import React, { useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';
import { PrimaryButton } from './PrimaryButton';
import { createSignaturePayload, SignaturePoint } from '../utils/signature';

type SignaturePadFieldProps = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

const DEFAULT_BOUNDS = { width: 280, height: 160 };

export function SignaturePadField({ label, value, onChange }: SignaturePadFieldProps) {
  const { theme } = useAppTheme();
  const [points, setPoints] = useState<SignaturePoint[]>([]);
  const [bounds, setBounds] = useState(DEFAULT_BOUNDS);

  function updateSignature(nextPoints: SignaturePoint[]) {
    setPoints(nextPoints);
    onChange(createSignaturePayload(nextPoints, bounds));
  }

  function addPointFromEvent(event?: GestureResponderEvent) {
    const point = {
      x: event?.nativeEvent.locationX ?? bounds.width / 2,
      y: event?.nativeEvent.locationY ?? bounds.height / 2,
    };

    updateSignature([...points, point]);
  }

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;

    if (width > 0 && height > 0) {
      setBounds({ width, height });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>

      <Pressable
        accessibilityLabel="Assinar entrega"
        accessibilityRole="button"
        onLayout={handleLayout}
        onPress={(event) => {
          addPointFromEvent(event);
        }}
        onTouchMove={(event) => {
          addPointFromEvent(event);
        }}
        testID="signature-pad"
        style={[
          styles.pad,
          {
            backgroundColor: theme.colors.surface,
            borderColor: value ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        {points.length === 0 ? (
          <Text style={[styles.placeholder, { color: theme.colors.textMuted }]}>Toque ou arraste para registrar a assinatura.</Text>
        ) : null}

        {points.map((point, index) => (
          <View
            key={`${point.x}-${point.y}-${index}`}
            style={[
              styles.dot,
              {
                backgroundColor: theme.colors.text,
                left: point.x,
                top: point.y,
              },
            ]}
          />
        ))}
      </Pressable>

      {value ? (
        <PrimaryButton
          onPress={() => {
            setPoints([]);
            onChange(null);
          }}
          title="Limpar assinatura"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  pad: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 14,
    textAlign: 'center',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 999,
    marginLeft: -2,
    marginTop: -2,
  },
});
