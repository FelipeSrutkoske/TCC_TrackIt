import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrackItMark } from './TrackItMark';
import { useAppTheme } from '../../theme/AppThemeProvider';

type TrackItBannerProps = {
  width?: number;
  height?: number;
};

export function TrackItBanner({ width = 290, height = 100 }: TrackItBannerProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { width, minHeight: height }]}> 
      <TrackItMark height={56} width={44} />
      <View style={styles.wordmark}>
        <Text style={[styles.track, { color: theme.colors.accentText }]}>Track</Text>
        <Text style={[styles.it, { color: theme.colors.primary }]}>It</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  wordmark: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  track: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
  },
  it: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
  },
});
