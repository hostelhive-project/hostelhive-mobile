import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { ProfileIdentityCard } from '../../components/profile/ProfileIdentityCard';
import { AccountDetailRow } from '../../components/profile/AccountDetailRow';
import { ProfileActionRow } from '../../components/profile/ProfileActionRow';
import { AppModal } from '../../components/ui/AppModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { PhoneInputWithCountry } from '../../components/common/PhoneInputWithCountry';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateUser } from '../../store/slices/authSlice';
import { useUpdateProfileMutation } from '../../services/authApi';
import { secureStorage } from '../../utils/secureStorage';
import { showDialog } from '../../utils/dialog';
import { signOut } from '../../utils/logout';
import {
  CountryInfo,
  formatPhoneDisplay,
  parseExistingPhone,
  validateAndFormatPhone,
  isE164Valid,
} from '../../utils/phoneUtils';

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  // Edit Phone Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editCountry, setEditCountry] = useState<CountryInfo>(
    () => parseExistingPhone(user?.phone).country
  );
  const [editPhoneInput, setEditPhoneInput] = useState<string>(
    () => parseExistingPhone(user?.phone).nationalNumber
  );
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);

  const handleOpenEditPhone = () => {
    const parsed = parseExistingPhone(user?.phone);
    setEditCountry(parsed.country);
    setEditPhoneInput(parsed.nationalNumber);
    setPhoneError(null);
    setIsEditModalVisible(true);
  };

  const handleSavePhone = async () => {
    setPhoneError(null);
    const trimmed = editPhoneInput.trim();

    if (!trimmed) {
      setPhoneError('Phone number is required.');
      return;
    }

    const validation = validateAndFormatPhone(trimmed, editCountry.code);
    if (!validation.isValid || !validation.e164) {
      setPhoneError(validation.error || 'Please enter a valid phone number.');
      return;
    }

    if (!user?._id) return;

    try {
      const res = await updateProfile({
        id: user._id,
        phone: validation.e164,
      }).unwrap();

      if (res.success) {
        dispatch(updateUser({ phone: validation.e164 }));
        await secureStorage.saveCachedUser({ ...user, phone: validation.e164 });
        setIsEditModalVisible(false);
        showDialog('Profile Updated', 'Your phone number has been updated successfully.');
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to update phone number.';
      setPhoneError(msg);
    }
  };

  const handleLogout = () => {
    showDialog(
      'Sign Out',
      'Are you sure you want to log out of HostelHive?',
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

  const hasValidPhone = isE164Valid(user?.phone);
  const displayName = user?.name?.trim() || 'Student';
  return (
    <ScreenContainer scrollable>
      <AppHeader title="Student Profile" subtitle="Your information, security, and account" />
      <View style={styles.container}>
        <ProfileIdentityCard name={displayName} email={user?.email} imageUri={user?.profileImageUrl} role={user?.role || 'Student'} />

        <View style={styles.sectionCard}>
          <Text accessibilityRole="header" style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Account details</Text>
          <Text style={[TYPOGRAPHY.caption, styles.sectionSubtitle]}>Keep your contact information up to date.</Text>

          {user?.residentCode ? <AccountDetailRow icon="finger-print-outline" label="Resident ID" value={user.residentCode} /> : null}
          <AccountDetailRow
            icon="call-outline"
            label="Phone number"
            value={
              <View style={styles.phoneValue}>
                <Text selectable style={[TYPOGRAPHY.bodySemiBold, styles.detailValue]}>
                  {user?.phone ? formatPhoneDisplay(user.phone) : 'Not specified'}
                </Text>
                {hasValidPhone ? (
                  <View style={styles.validBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={COLORS.successText} />
                    <Text style={[TYPOGRAPHY.captionMedium, styles.validBadgeText]}>Valid number</Text>
                  </View>
                ) : null}
              </View>
            }
            trailing={
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Edit phone number"
                onPress={handleOpenEditPhone}
                style={styles.editPhoneBtn}
              >
                <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            }
          />
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

      {/* Edit Phone Number Modal */}
      <AppModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        title="Update phone number"
        subtitle="Select your country and enter your mobile number. Format will be validated and normalized."
      >
        <View>
          <PhoneInputWithCountry
            label="Phone Number"
            required
            value={editPhoneInput}
            country={editCountry}
            onChangeText={(val) => {
              setEditPhoneInput(val);
              if (phoneError) setPhoneError(null);
            }}
            onSelectCountry={setEditCountry}
            error={phoneError}
            showValidityBadge
            isValid={validateAndFormatPhone(editPhoneInput, editCountry.code).isValid}
          />

          <View style={styles.modalButtons}>
            <SecondaryButton
              title="Cancel"
              onPress={() => setIsEditModalVisible(false)}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              title="Save phone"
              onPress={handleSavePhone}
              isLoading={isUpdating}
              disabled={isUpdating}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </AppModal>

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
  detailValue: { color: COLORS.textPrimary, flexShrink: 1 },
  phoneValue: { alignItems: 'flex-start', gap: SPACING.xs },
  validBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xxs, backgroundColor: COLORS.successLight, borderRadius: RADIUS.full },
  validBadgeText: { color: COLORS.successText },
  editPhoneBtn: { width: 48, height: 48, backgroundColor: COLORS.surfaceSubtle, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  actionContainer: { gap: SPACING.sm },
  modalButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.md },
});
