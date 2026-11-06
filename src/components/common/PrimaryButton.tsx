import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS } from '../../theme/radius';
import { SPACING } from '../../theme/spacing';
import { SHADOWS } from '../../theme/shadows';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'accent' | 'outline' | 'ghost';
  compact?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  variant = 'primary',
  compact = false,
}) => {
  const isButtonDisabled = disabled || isLoading;

  const bgStyle =
    variant === 'danger'
      ? styles.dangerBg
      : variant === 'accent'
      ? styles.accentBg
      : variant === 'outline'
      ? styles.outlineBg
      : variant === 'ghost'
      ? styles.ghostBg
      : styles.primaryBg;

  const textVariantStyle =
    variant === 'outline' || variant === 'ghost' ? styles.outlineText : styles.primaryText;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact ? styles.compactButton : styles.defaultButton,
        bgStyle,
        isButtonDisabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isButtonDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isButtonDisabled, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator
          color={isButtonDisabled || variant === 'outline' || variant === 'ghost' ? COLORS.textSecondary : COLORS.textInverse}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              compact ? TYPOGRAPHY.buttonSmall : TYPOGRAPHY.button,
              textVariantStyle,
              icon ? styles.textWithIcon : null,
              textStyle,
              isButtonDisabled && styles.disabledText,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    ...SHADOWS.subtle,
  },
  defaultButton: {
    minHeight: 52,
    paddingHorizontal: SPACING.xl,
  },
  compactButton: {
    minHeight: 48,
    paddingHorizontal: SPACING.md,
  },
  primaryBg: {
    backgroundColor: COLORS.primary,
  },
  dangerBg: {
    backgroundColor: COLORS.danger,
  },
  accentBg: {
    backgroundColor: COLORS.accent,
  },
  outlineBg: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  ghostBg: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  disabledButton: {
    backgroundColor: COLORS.disabledBg,
    borderColor: COLORS.disabledBg,
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryText: {
    color: COLORS.textInverse,
    flexShrink: 1,
    textAlign: 'center',
  },
  outlineText: {
    color: COLORS.primary,
    flexShrink: 1,
    textAlign: 'center',
  },
  disabledText: { color: COLORS.textSecondary },
  textWithIcon: {
    marginLeft: SPACING.sm,
  },
});
