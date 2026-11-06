import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { AppIcon } from '../common/AppIcon';
import { useToast } from './Toast';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface CopyableFieldProps {
  value?: string | null;
  label: string;
  style?: ViewStyle;
  leadingIcon?: string;
}

function middleEllipsis(value: string) {
  if (value.length <= 25) return value;
  return `${value.slice(0, 10)}...${value.slice(-9)}`;
}

export const CopyableField: React.FC<CopyableFieldProps> = ({ value, label, style, leadingIcon }) => {
  const { showToast } = useToast();
  if (!value) return null;
  const copy = async () => {
    await Clipboard.setStringAsync(value);
    await Haptics.selectionAsync().catch(() => undefined);
    showToast({ type: 'success', title: 'Copied', message: `${label} copied to clipboard.` });
  };
  return (
    <Pressable
      onPress={copy}
      accessibilityRole="button"
      accessibilityLabel={`Copy ${label}: ${value}`}
      style={({ pressed }) => [styles.field, pressed && styles.pressed, style]}
    >
      {leadingIcon ? <AppIcon name={leadingIcon} size={15} color={COLORS.textSecondary} /> : null}
      <Text style={[TYPOGRAPHY.caption, styles.value]} numberOfLines={1}>{middleEllipsis(value)}</Text>
      <AppIcon name="copy" size={16} color={COLORS.info} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  field: { minWidth: 0, maxWidth: '100%', flexShrink: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder, backgroundColor: COLORS.surfaceSubtle },
  value: { minWidth: 0, color: COLORS.textPrimary, fontFamily: 'Inter_500Medium', flex: 1, fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.7 },
});
