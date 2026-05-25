import React, { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../theme/AppThemeProvider';
import { PrimaryButton } from './PrimaryButton';
import { createSignaturePayload, SignaturePoint } from '../utils/signature';

type SignaturePadFieldProps = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  onDrawStart?: () => void;
  onDrawEnd?: () => void;
};

const DEFAULT_BOUNDS = { width: 280, height: 160 };
const POINT_SPACING = 2;
const MAX_INTERPOLATION_DISTANCE = 28;
const STROKE_WIDTH = 4;
const EDGE_INSET = STROKE_WIDTH / 2 + 1;

function buildPathData(points: SignaturePoint[]) {
  if (points.length === 0) {
    return '';
  }

  const [firstPoint, ...restPoints] = points;
  const segments = [`M ${firstPoint.x} ${firstPoint.y}`];

  for (const point of restPoints) {
    segments.push(`L ${point.x} ${point.y}`);
  }

  return segments.join(' ');
}

export function SignaturePadField({
  label,
  value,
  onChange,
  onDrawStart,
  onDrawEnd,
}: SignaturePadFieldProps) {
  const { theme } = useAppTheme();
  const [strokes, setStrokes] = useState<SignaturePoint[][]>([]);
  const [bounds, setBounds] = useState(DEFAULT_BOUNDS);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<SignaturePoint | null>(null);
  const allPointsRef = useRef<SignaturePoint[]>([]);
  const strokesRef = useRef<SignaturePoint[][]>([]);

  function commitStrokes(nextStrokes: SignaturePoint[][]) {
    strokesRef.current = nextStrokes;
    setStrokes(nextStrokes);
  }

  function buildInterpolatedPoints(from: SignaturePoint, to: SignaturePoint) {
    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < 0.5) {
      return [];
    }

    const steps = Math.max(Math.ceil(distance / POINT_SPACING), 1);
    const nextPoints: SignaturePoint[] = [];

    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      nextPoints.push({
        x: from.x + deltaX * ratio,
        y: from.y + deltaY * ratio,
      });
    }

    return nextPoints;
  }

  function getPointFromEvent(event?: GestureResponderEvent) {
    const x = event?.nativeEvent.locationX;
    const y = event?.nativeEvent.locationY;

    if (typeof x !== 'number' || typeof y !== 'number') {
      return null;
    }

    const minX = EDGE_INSET;
    const minY = EDGE_INSET;
    const maxX = Math.max(bounds.width - EDGE_INSET, minX);
    const maxY = Math.max(bounds.height - EDGE_INSET, minY);

    if (x < minX || x > maxX || y < minY || y > maxY) {
      return null;
    }

    return { x, y };
  }

  function addPointFromEvent(event: GestureResponderEvent | undefined, interpolate: boolean) {
    const point = getPointFromEvent(event);

    if (!point) {
      // Break the segment when pointer leaves drawing bounds,
      // so returning to the pad does not create a ricochet line.
      lastPointRef.current = null;
      return;
    }

    const currentStrokes = strokesRef.current;

    if (currentStrokes.length === 0) {
      const nextStrokes = [[point]];
      allPointsRef.current = [...allPointsRef.current, point];
      lastPointRef.current = point;
      commitStrokes(nextStrokes);
      return;
    }

    const nextStrokes = [...currentStrokes];
    const currentStroke = nextStrokes[nextStrokes.length - 1] ?? [];
    const previousPoint = lastPointRef.current;

    if (!interpolate || !previousPoint) {
      nextStrokes[nextStrokes.length - 1] = [...currentStroke, point];
      allPointsRef.current = [...allPointsRef.current, point];
      lastPointRef.current = point;
      commitStrokes(nextStrokes);
      return;
    }

    const deltaX = point.x - previousPoint.x;
    const deltaY = point.y - previousPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > MAX_INTERPOLATION_DISTANCE) {
      nextStrokes[nextStrokes.length - 1] = [...currentStroke, point];
      allPointsRef.current = [...allPointsRef.current, point];
      lastPointRef.current = point;
      commitStrokes(nextStrokes);
      return;
    }

    const interpolatedPoints = buildInterpolatedPoints(previousPoint, point);

    if (interpolatedPoints.length === 0) {
      return;
    }

    nextStrokes[nextStrokes.length - 1] = [...currentStroke, ...interpolatedPoints];
    allPointsRef.current = [...allPointsRef.current, ...interpolatedPoints];
    lastPointRef.current = point;
    commitStrokes(nextStrokes);
  }

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;

    if (width > 0 && height > 0) {
      setBounds((currentBounds) => {
        if (currentBounds.width === width && currentBounds.height === height) {
          return currentBounds;
        }

        return { width, height };
      });
    }
  }

  function finalizeStroke() {
    if (!isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;
    onDrawEnd?.();
    onChange(createSignaturePayload(allPointsRef.current, bounds));
  }

  const hasSignature = strokes.length > 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>

      <View
        accessibilityLabel="Assinar entrega"
        accessibilityRole="button"
        onLayout={handleLayout}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onStartShouldSetResponder={() => true}
        onTouchStart={(event) => {
          isDrawingRef.current = true;
          onDrawStart?.();
          lastPointRef.current = null;
          commitStrokes([...strokesRef.current, []]);
          addPointFromEvent(event, false);
        }}
        onTouchMove={(event) => {
          if (!isDrawingRef.current) {
            return;
          }

          addPointFromEvent(event, true);
        }}
        onTouchEnd={finalizeStroke}
        onTouchCancel={finalizeStroke}
        testID="signature-pad"
        style={[
          styles.pad,
          {
            backgroundColor: theme.colors.surface,
            borderColor: value ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        {!hasSignature ? (
          <Text style={[styles.placeholder, { color: theme.colors.textMuted }]}>Toque ou arraste para registrar a assinatura.</Text>
        ) : null}

        <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
          {strokes.map((stroke, index) => {
            const pathData = buildPathData(stroke);

            if (!pathData) {
              return null;
            }

            return (
              <Path
                key={`stroke-${index}`}
                d={pathData}
                fill="none"
                stroke={theme.colors.text}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={STROKE_WIDTH}
              />
            );
          })}
        </Svg>
      </View>

      {value ? (
        <PrimaryButton
          onPress={() => {
            isDrawingRef.current = false;
            lastPointRef.current = null;
            allPointsRef.current = [];
            commitStrokes([]);
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
});
