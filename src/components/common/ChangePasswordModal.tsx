import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppModal } from '../ui/AppModal';
import { AppTextInput } from './AppTextInput';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/layout';
import { useChangePasswordMutation } from '../../services/authApi';
import { extractErrorMessage } from '../../utils/error';
import { showDialog } from '../../utils/dialog';
import { useAppDispatch } from '../../store/hooks';
import { secureStorage } from '../../utils/secureStorage';
import { logout } from '../../store/slices/authSlice';
import { baseApi } from '../../services/baseApi';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ visible, onClose }) => {
  const dispatch = useAppDispatch();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleClose = () => {
    if (isLoading) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      handleClose();
      await secureStorage.clearSession();
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
      showDialog('Password Changed', 'Your password has been updated. Please sign in again with your new password.');
    } catch (requestError: unknown) {
      setError(extractErrorMessage(requestError, 'Unable to change your password. Please try again.'));
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      title="Change password"
      subtitle="Confirm your current password, then choose a new one."
    >
      <View style={styles.form}>
            <AppTextInput
              label="Current Password"
              placeholder="Enter current password"
              isPassword
              autoCapitalize="none"
              value={currentPassword}
              onChangeText={(value) => {
                setCurrentPassword(value);
                setError('');
              }}
            />
            <AppTextInput
              label="New Password (at least 8 characters)"
              placeholder="Enter new password"
              isPassword
              autoCapitalize="none"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                setError('');
              }}
            />
            <AppTextInput
              label="Confirm New Password"
              placeholder="Re-enter new password"
              isPassword
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setError('');
              }}
            />

            {error ? <Text accessibilityRole="alert" style={[TYPOGRAPHY.caption, styles.error]}>{error}</Text> : null}

            <View style={styles.actions}>
              <SecondaryButton
                title="Cancel"
                onPress={handleClose}
                disabled={isLoading}
                style={styles.actionButton}
              />
              <PrimaryButton
                title="Save Password"
                onPress={handleSubmit}
                isLoading={isLoading}
                style={styles.actionButton}
              />
            </View>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  form: { gap: SPACING.xs },
  error: {
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionButton: {
    flex: 1,
  },
});
