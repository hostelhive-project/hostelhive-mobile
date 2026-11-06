import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS } from '../../theme/radius';
import { SPACING } from '../../theme/spacing';

export interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  compact?: boolean;
  variant?: 'outline' | 'ghost' | 'surface';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  compact = false,
  variant = 'outline',
}) => {
  const isButtonDisabled = disabled || isLoading;

  const bgStyle =
    variant === 'ghost'
      ? styles.ghostBg
      : variant === 'surface'
      ? styles.surfaceBg
      : styles.outlineBg;

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
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isButtonDisabled, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.textPrimary} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              compact ? TYPOGRAPHY.buttonSmall : TYPOGRAPHY.button,
              styles.text,
              icon ? styles.textWithIcon : null,
              textStyle,
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
  },
  defaultButton: {
    minHeight: 52,
    paddingHorizontal: SPACING.xl,
  },
  compactButton: {
    minHeight: 48,
    paddingHorizontal: SPACING.md,
  },
  outlineBg: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  surfaceBg: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 0,
  },
  ghostBg: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  disabledButton: {
    backgroundColor: COLORS.disabledBg,
    borderColor: COLORS.disabledBg,
    opacity: 0.6,
  },
  text: {
    color: COLORS.textPrimary,
    flexShrink: 1,
    textAlign: 'center',
  },
  textWithIcon: {
    marginLeft: SPACING.sm,
  },
});
