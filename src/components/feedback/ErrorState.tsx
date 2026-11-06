import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AppIcon as Ionicons } from '../common/AppIcon';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { RADIUS } from '../../theme/radius';
import { PrimaryButton } from '../common/PrimaryButton';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name="alert-circle-outline" size={36} color={COLORS.danger} />
      </View>
      <Text style={[TYPOGRAPHY.h3, styles.title]}>{title}</Text>
      <Text style={[TYPOGRAPHY.body, styles.message]}>{message}</Text>
      {onRetry && (
        <PrimaryButton
          title="Try Again"
          onPress={onRetry}
          style={styles.retryButton}
          compact
        />
      )}
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
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  retryButton: {
    marginTop: SPACING.lg,
    minWidth: 140,
  },
});
