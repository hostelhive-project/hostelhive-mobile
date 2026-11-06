import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { AppIcon as Ionicons } from './AppIcon';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { RADIUS, SPACING } from '../../constants/layout';

interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  isPassword = false,
  leftIcon,
  containerStyle,
  inputContainerStyle,
  style,
  ...inputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  const isMultiline = Boolean(inputProps.multiline);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[TYPOGRAPHY.captionSemiBold, styles.label]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          isMultiline && styles.inputContainerMultiline,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
          inputContainerStyle,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          style={[
            TYPOGRAPHY.body,
            styles.input,
            isMultiline && styles.inputMultiline,
            leftIcon ? styles.inputWithLeftIcon : null,
            style,
          ]}
          placeholderTextColor={COLORS.textMuted}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          {...inputProps}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <View style={styles.errorContainer} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
          <Text style={[TYPOGRAPHY.caption, styles.errorText]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.md,
    minHeight: 50,
    paddingHorizontal: SPACING.md,
  },
  inputContainerMultiline: {
    height: undefined,
    minHeight: 112,
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
  },
  inputFocused: {
    borderColor: COLORS.inputBorderFocus,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textPrimary,
    minHeight: 48,
    paddingVertical: SPACING.md,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 0,
    paddingBottom: 0,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: 4,
  },
  errorText: {
    color: COLORS.danger,
    flex: 1,
  },
});

