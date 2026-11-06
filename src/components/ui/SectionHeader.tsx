import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { AppIcon as Ionicons } from '../common/AppIcon';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionTitle,
  onAction,
  rightElement,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        <Text style={[TYPOGRAPHY.h3, styles.title]}>{title}</Text>
        {subtitle ? <Text style={[TYPOGRAPHY.caption, styles.subtitle]}>{subtitle}</Text> : null}
      </View>

      {rightElement ? (
        rightElement
      ) : actionTitle && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.7}
          style={styles.actionBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[TYPOGRAPHY.buttonSmall, styles.actionText]}>{actionTitle}</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
  },
  actionText: {
    color: COLORS.primary,
  },
});

