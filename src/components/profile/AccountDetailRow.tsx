import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../common/AppIcon';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';

interface AccountDetailRowProps {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  label: string;
  value: React.ReactNode;
  trailing?: React.ReactNode;
  last?: boolean;
}

/** Stacked labels keep long hostel names and phone numbers readable at larger text sizes. */
export const AccountDetailRow: React.FC<AccountDetailRowProps> = ({ icon, label, value, trailing, last = false }) => (
  <View style={[styles.row, last && styles.last]}>
    <View style={styles.icon}><AppIcon name={icon} size={18} color={COLORS.textSecondary} /></View>
    <View style={styles.copy}>
      <Text style={[TYPOGRAPHY.caption, styles.label]}>{label}</Text>
      {typeof value === 'string' ? <Text selectable style={[TYPOGRAPHY.bodySemiBold, styles.value]}>{value}</Text> : value}
    </View>
    {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.lg, minHeight: 72, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft },
  last: { borderBottomWidth: 0, paddingBottom: SPACING.xs },
  icon: { alignSelf: 'flex-start', paddingTop: SPACING.xs },
  copy: { flex: 1, minWidth: 0, gap: SPACING.xs },
  label: { color: COLORS.textSecondary },
  value: { color: COLORS.textPrimary, flexShrink: 1 },
  trailing: { flexShrink: 0 },
});
