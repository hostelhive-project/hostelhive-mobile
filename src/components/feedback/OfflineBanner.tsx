import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../common/AppIcon';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { semantic, SPACING, TYPOGRAPHY } from '../../theme';

export const OfflineBanner: React.FC = () => {
  const { isOffline } = useNetworkStatus();
  if (!isOffline) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.banner}>
      <AppIcon name="wifi-off" size={16} color={semantic.warning.foreground} />
      <Text style={[TYPOGRAPHY.captionMedium, styles.text]}>You are offline. Changes may not be saved.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: { flexShrink: 0, minHeight: 38, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: semantic.warning.background, borderBottomWidth: 1, borderBottomColor: semantic.warning.border },
  text: { flex: 1, minWidth: 0, color: semantic.warning.foreground },
});
