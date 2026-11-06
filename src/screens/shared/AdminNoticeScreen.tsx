import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signOut } from '../../utils/logout';

export const AdminNoticeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);

  const handleLogout = async () => {
    await signOut(dispatch, user?._id);
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="desktop-outline" size={48} color={COLORS.primary} />
        </View>

        <Text style={[TYPOGRAPHY.h2, styles.title]}>Admin Portal Access</Text>
        <Text style={[TYPOGRAPHY.body, styles.message]}>
          Hello <Text style={styles.boldText}>{user?.name || 'Administrator'}</Text>. Hostel management, room allocation, check-in approvals, and property administration are optimized for the{' '}
          <Text style={styles.boldText}>HostelHive Web Admin Portal</Text>.
        </Text>

        <View style={styles.instructionCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
          <Text style={[TYPOGRAPHY.caption, styles.instructionText]}>
            Please sign in on your laptop or desktop browser to access administrative workflows.
          </Text>
        </View>

        <SecondaryButton
          title="Change Password"
          onPress={() => setIsChangePasswordModalVisible(true)}
          icon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />}
          style={styles.changePasswordButton}
        />
        <PrimaryButton title="Sign Out" onPress={handleLogout} style={styles.logoutButton} />
      </View>
      <ChangePasswordModal
        visible={isChangePasswordModalVisible}
        onClose={() => setIsChangePasswordModalVisible(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.subtle,
  },
  title: {
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  boldText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.infoLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  instructionText: {
    color: COLORS.info,
    flex: 1,
    lineHeight: 16,
  },
  logoutButton: {
    width: '100%',
  },
  changePasswordButton: {
    width: '100%',
    marginBottom: SPACING.md,
  },
});

