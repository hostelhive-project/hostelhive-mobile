import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, semantic, severity } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS, SPACING } from '../../theme/tokens';
import { AppIcon } from './AppIcon';
import type { BookingStatus } from '../../types/api';

interface StatusBadgeProps {
  status: BookingStatus | string;
  style?: ViewStyle;
  showDot?: boolean;
}

interface SeverityChipProps {
  level: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  style?: ViewStyle;
}

const LABELS: Record<string, string> = {
  CheckedIn: 'Checked in',
  CheckedOut: 'Checked out',
  InProgress: 'In progress',
  InReview: 'In review',
  AwaitingAdminVerification: 'Awaiting verification',
  PartiallyPaid: 'Partially paid',
  DeepClean: 'Deep clean',
  PendingApproval: 'Pending approval',
};

function normalize(value: string) {
  return value.replace(/[_\s-]/g, '').toLowerCase();
}

function humanize(value: string) {
  if (LABELS[value]) return LABELS[value];
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function statusAppearance(status: string) {
  const value = normalize(status);
  if (['checkedin', 'paid', 'resolved', 'completed', 'active', 'verified'].includes(value)) return semantic.success;
  if (['approved', 'scheduled', 'available', 'checkedout'].includes(value)) return value === 'checkedout' ? semantic.neutral : semantic.info;
  if (['pending', 'pendingapproval', 'partiallypaid', 'inreview', 'awaitingadminverification', 'awaitingverification', 'inprogress', 'due'].includes(value)) return semantic.warning;
  if (['inactive', 'rejected', 'overdue', 'delayed', 'failed', 'critical', 'cancelled'].includes(value)) return semantic.danger;
  return semantic.neutral;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style, showDot = true }) => {
  const theme = statusAppearance(String(status));
  const label = humanize(String(status));
  return (
    <View accessibilityLabel={`Status: ${label}`} style={[styles.badge, { backgroundColor: theme.background, borderColor: theme.border }, style]}>
      {showDot && <View style={[styles.dot, { backgroundColor: theme.icon }]} />}
      <Text style={[TYPOGRAPHY.smallBadge, styles.badgeText, { color: theme.foreground }]}>{label}</Text>
    </View>
  );
};

export const SeverityChip: React.FC<SeverityChipProps> = ({ level, style }) => {
  const normalizedLevel = (['Low', 'Medium', 'High', 'Critical'].includes(level) ? level : 'Low') as keyof typeof severity;
  const theme = severity[normalizedLevel];
  const iconName = normalizedLevel === 'Low' ? 'minus' : normalizedLevel === 'Medium' ? 'triangle-alert' : normalizedLevel === 'High' ? 'circle-alert' : 'shield-alert';
  return (
    <View accessibilityLabel={`${normalizedLevel} severity`} style={[styles.severityChip, { backgroundColor: theme.background, borderColor: theme.border }, style]}>
      <AppIcon name={iconName} size={12} color={theme.icon} strokeWidth={2} />
      <Text style={[TYPOGRAPHY.smallBadge, styles.badgeText, { color: theme.foreground }]}>{normalizedLevel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 1,
    maxWidth: '100%',
    gap: 6,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { color: COLORS.textPrimary, flexShrink: 1 },
});
