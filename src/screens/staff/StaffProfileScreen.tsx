import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { ProfileIdentityCard } from '../../components/profile/ProfileIdentityCard';
import { AccountDetailRow } from '../../components/profile/AccountDetailRow';
import { ProfileActionRow } from '../../components/profile/ProfileActionRow';
import { StatusBadge } from '../../components/common/StatusBadge';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useGetHostelByIdQuery } from '../../services/hostelApi';
import { showDialog } from '../../utils/dialog';
import { signOut } from '../../utils/logout';

export const StaffProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const hostelId = typeof user?.hostelId === 'string' ? user.hostelId : null;
  const { data: hostelResponse, isLoading: isHostelLoading, isFetching: isHostelFetching, isError: hasHostelError, refetch: refetchHostel } =
    useGetHostelByIdQuery(hostelId ?? '', { skip: !hostelId });
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = React.useState(false);

  const handleLogout = () => {
    showDialog(
      'Sign Out',
      'Are you sure you want to log out of HostelHive Staff Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut(dispatch, user?._id);
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer
      scrollable
      refreshing={isHostelFetching && !isHostelLoading}
      onRefresh={hostelId ? () => { void refetchHostel(); } : undefined}
    >
      <AppHeader title="Staff Profile" subtitle="Your hostel, information, and security" />
      <View style={styles.container}>
        <ProfileIdentityCard name={user?.name?.trim() || 'Staff Member'} email={user?.email} imageUri={user?.profileImageUrl} role="Cleaning Staff" />

        <View style={styles.sectionCard}>
          <Text accessibilityRole="header" style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Staff details</Text>
          <Text style={[TYPOGRAPHY.caption, styles.sectionSubtitle]}>Your hostel assignment and contact information.</Text>
          <AccountDetailRow
            icon="business-outline"
            label="Working at"
            value={
              !hostelId
                ? 'No hostel assigned'
                : isHostelLoading
                  ? 'Loading hostel…'
                  : hostelResponse?.data?.name || (hasHostelError ? 'Hostel details unavailable' : 'Hostel name unavailable')
            }
          />
          <AccountDetailRow icon="call-outline" label="Phone number" value={user?.phone || 'Not specified'} />
          <AccountDetailRow
            icon="shield-checkmark-outline"
            label="Account status"
            value={<StatusBadge status={user?.isActive ? 'Active' : 'Inactive'} />}
            last
          />
        </View>

        <View style={styles.actionContainer}>
          <ProfileActionRow
            icon="lock-closed-outline"
            title="Change password"
            description="Update your account security"
            onPress={() => setIsChangePasswordModalVisible(true)}
          />
          <ProfileActionRow
            icon="log-out-outline"
            title="Sign out"
            description="Sign out of this account"
            onPress={handleLogout}
            destructive
          />
        </View>
      </View>
      <ChangePasswordModal
        visible={isChangePasswordModalVisible}
        onClose={() => setIsChangePasswordModalVisible(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  sectionCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.card },
  sectionTitle: { color: COLORS.textPrimary },
  sectionSubtitle: { color: COLORS.textSecondary, marginTop: SPACING.xs, marginBottom: SPACING.xs },
  actionContainer: { gap: SPACING.sm },
});

