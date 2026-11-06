import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppIcon as Ionicons } from '../common/AppIcon';
import { AppModal } from './AppModal';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { RADIUS } from '../../theme/radius';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';

export interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'destructive' | 'warning';
  icon?: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary',
  icon,
  isLoading = false,
}) => {
  const isDestructive = type === 'destructive';
  const isWarning = type === 'warning';

  const iconName: keyof typeof Ionicons.glyphMap =
    icon || (isDestructive ? 'trash-outline' : isWarning ? 'warning-outline' : 'help-circle-outline');

  const iconBg = isDestructive ? COLORS.dangerLight : isWarning ? COLORS.warningLight : COLORS.infoLight;
  const iconColor = isDestructive ? COLORS.danger : isWarning ? COLORS.warning : COLORS.info;

  return (
    <AppModal visible={visible} onClose={onClose} showCloseButton={false}>
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={28} color={iconColor} />
        </View>

        <Text style={[TYPOGRAPHY.h3, styles.title]}>{title}</Text>
        <Text style={[TYPOGRAPHY.body, styles.message]}>{message}</Text>

        <View style={styles.actionRow}>
          <SecondaryButton
            title={cancelText}
            onPress={onClose}
            disabled={isLoading}
            style={styles.cancelBtn}
          />
          <PrimaryButton
            title={confirmText}
            onPress={onConfirm}
            isLoading={isLoading}
            variant={isDestructive ? 'danger' : 'primary'}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
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
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});
