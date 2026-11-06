import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AppIcon as Ionicons } from '../common/AppIcon';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { RADIUS } from '../../theme/radius';
import { PrimaryButton } from '../common/PrimaryButton';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={34} color={COLORS.primary} />
      </View>
      <Text style={[TYPOGRAPHY.h3, styles.title]}>{title}</Text>
      {description ? (
        <Text style={[TYPOGRAPHY.body, styles.description]}>{description}</Text>
      ) : null}
      {actionTitle && onAction ? (
        <PrimaryButton
          title={actionTitle}
          onPress={onAction}
          style={styles.actionButton}
          compact
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  description: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  actionButton: {
    marginTop: SPACING.lg,
    minWidth: 160,
  },
});
