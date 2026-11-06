import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { BackButton } from './BackButton';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { RADIUS } from '../../theme/radius';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
  variant?: 'main' | 'back' | 'floating';
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBack,
  showLogo = false,
  rightAction,
  variant = 'back',
  style,
}) => {
  const shouldShowBack = showBack !== undefined ? showBack : Boolean(onBack);

  if (variant === 'floating') {
    return (
      <View style={[styles.floatingHeader, style]}>
        <BackButton onPress={onBack} />
        {rightAction && <View style={styles.floatingRight}>{rightAction}</View>}
      </View>
    );
  }

  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftContainer}>
        {shouldShowBack && (
          <BackButton
            onPress={onBack}
            style={styles.headerBackButton}
          />
        )}

        {showLogo && (
          <Image
            source={require('../../../assets/brand/hostelhive-logo-ui.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        )}

        <View style={styles.titleContainer}>
          {title ? (
            <Text accessibilityRole="header" style={[shouldShowBack ? TYPOGRAPHY.h3 : TYPOGRAPHY.h1, styles.title]}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={[shouldShowBack ? TYPOGRAPHY.caption : TYPOGRAPHY.bodySmall, styles.subtitle]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction && <View style={styles.rightContainer}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSoft,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerBackButton: {
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: COLORS.textPrimary,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    flexShrink: 0,
  },
  floatingHeader: {
    position: 'absolute',
    top: SPACING.xl,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  floatingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
