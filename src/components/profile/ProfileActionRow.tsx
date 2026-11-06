import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon } from '../common/AppIcon';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface ProfileActionRowProps {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  title: string;
  description: string;
  onPress: () => void;
  destructive?: boolean;
}

export const ProfileActionRow: React.FC<ProfileActionRowProps> = ({ icon, title, description, onPress, destructive = false }) => (
  <TouchableOpacity
    style={[styles.row, destructive && styles.destructiveRow]}
    onPress={onPress}
    activeOpacity={0.75}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityHint={description}
  >
    <View style={[styles.icon, destructive && styles.destructiveIcon]}>
      <AppIcon name={icon} size={20} color={destructive ? COLORS.danger : COLORS.primary} />
    </View>
    <View style={styles.copy}>
      <Text style={[TYPOGRAPHY.button, styles.title, destructive && styles.destructiveTitle]}>{title}</Text>
      <Text style={[TYPOGRAPHY.caption, styles.description]}>{description}</Text>
    </View>
    <AppIcon name="chevron-forward" size={18} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, minHeight: 76, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.cardBorder, backgroundColor: COLORS.surface },
  destructiveRow: { borderColor: COLORS.dangerBorder },
  icon: { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceSubtle, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  destructiveIcon: { backgroundColor: COLORS.dangerLight },
  copy: { flex: 1, minWidth: 0 },
  title: { color: COLORS.textPrimary },
  destructiveTitle: { color: COLORS.dangerText },
  description: { color: COLORS.textSecondary, marginTop: SPACING.xxs },
});
