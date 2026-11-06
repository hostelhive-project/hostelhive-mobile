import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { showDialog } from '../../utils/dialog';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { PhotoUploadCard } from '../../components/ui/PhotoUploadCard';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import type { StudentStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateUser } from '../../store/slices/authSlice';
import { secureStorage } from '../../utils/secureStorage';
import { useCreateBookingMutation } from '../../services/bookingApi';
import { useUploadImageMutation } from '../../services/uploadApi';
import { useUpdateProfileMutation } from '../../services/authApi';
import { createUploadFormData, promptImageSource } from '../../utils/uploadHelpers';
import { PhoneInputWithCountry } from '../../components/common/PhoneInputWithCountry';
import {
  CountryInfo,
  DEFAULT_COUNTRY,
  validateAndFormatPhone,
  parseExistingPhone,
  formatPhoneDisplay,
} from '../../utils/phoneUtils';

import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';

type Props = NativeStackScreenProps<StudentStackParamList, 'BookingApplication'>;

export const BookingApplicationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { room, hostelName, fallbackRent } = route.params;
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [createBooking, { isLoading: isSubmitting }] = useCreateBookingMutation();
  const [uploadImage] = useUploadImageMutation();
  const [updateProfile] = useUpdateProfileMutation();

  // User Phone state & parsing
  const initialPhoneState = parseExistingPhone(user?.phone);
  const [isEditingUserPhone, setIsEditingUserPhone] = useState(!initialPhoneState.isValid);
  const [userPhoneCountry, setUserPhoneCountry] = useState<CountryInfo>(initialPhoneState.country);
  const [userPhoneInput, setUserPhoneInput] = useState<string>(initialPhoneState.nationalNumber);
  const [userPhoneError, setUserPhoneError] = useState<string | null>(null);

  // Emergency Contact Form State
  const [emergencyCountry, setEmergencyCountry] = useState<CountryInfo>(DEFAULT_COUNTRY);
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [cnicFrontUrl, setCnicFrontUrl] = useState<string | null>(null);
  const [cnicBackUrl, setCnicBackUrl] = useState<string | null>(null);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Errors
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);

  const { allowNavigation } = useUnsavedChanges(Boolean(emergencyContact || cnicFrontUrl || cnicBackUrl || termsAccepted || isUploadingFront || isUploadingBack || userPhoneInput !== initialPhoneState.nationalNumber));

  const effectiveRent =
    room.monthlyRent !== undefined && room.monthlyRent !== null
      ? room.monthlyRent
      : fallbackRent;

  const availableBeds = Math.max(0, room.capacity - room.occupiedCount);

  const handlePickImage = (side: 'front' | 'back') => {
    setErrorMessage(null);
    promptImageSource({
      title: `CNIC ${side === 'front' ? 'Front' : 'Back'} Photo`,
      message: 'Choose how you want to upload your CNIC photo for verification:',
      pickerOptions: {
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      },
      onImageSelected: async (asset) => {
        try {
          if (side === 'front') {
            setIsUploadingFront(true);
          } else {
            setIsUploadingBack(true);
          }

          const formData = await createUploadFormData(asset, '/cnic');
          const uploadRes = await uploadImage(formData).unwrap();

          if (uploadRes?.success && uploadRes.data?.url) {
            if (side === 'front') {
              setCnicFrontUrl(uploadRes.data.url);
            } else {
              setCnicBackUrl(uploadRes.data.url);
            }
          } else {
            throw new Error(uploadRes?.message || 'Failed to upload photo.');
          }
        } catch (err: any) {
          // eslint-disable-next-line no-console
          console.error('[STUDENT CNIC PHOTO] Upload error:', err);
          const message =
            err?.data?.message ||
            err?.error ||
            err?.message ||
            'Image upload failed. Please try again.';
          const statusText = err?.status ? ` (Status: ${err.status})` : '';
          showDialog('Upload Error', `${message}${statusText}`);
        } finally {
          if (side === 'front') {
            setIsUploadingFront(false);
          } else {
            setIsUploadingBack(false);
          }
        }
      },
    });
  };

  const handleSubmitApplication = async () => {
    setErrorMessage(null);
    setContactError(null);
    setTermsError(null);
    setUserPhoneError(null);

    // Validate inputs
    let hasError = false;

    // 1. Validate student contact number
    let finalUserPhone = user?.phone || '';
    if (isEditingUserPhone || !initialPhoneState.isValid) {
      const studentPhoneVal = validateAndFormatPhone(userPhoneInput, userPhoneCountry.code);
      if (!studentPhoneVal.isValid || !studentPhoneVal.e164) {
        setUserPhoneError(
          studentPhoneVal.error || 'A valid contact phone number is required before booking.'
        );
        hasError = true;
      } else {
        finalUserPhone = studentPhoneVal.e164;
      }
    }

    // 2. Validate emergency contact
    const emergencyVal = validateAndFormatPhone(emergencyContact, emergencyCountry.code);
    if (!emergencyVal.isValid || !emergencyVal.e164) {
      setContactError(emergencyVal.error || 'A valid emergency contact phone number is required.');
      hasError = true;
    }

    // 3. Terms acceptance
    if (!termsAccepted) {
      setTermsError('You must agree to hostel terms and conditions to proceed.');
      hasError = true;
    }

    if (hasError) return;

    if (room.isLocked) {
      showDialog('Room Unavailable', 'This room is locked and cannot accept new bookings.');
      return;
    }

    if (availableBeds <= 0) {
      showDialog('Room Full', 'This room is already at full capacity.');
      return;
    }

    try {
      // If user phone was updated or corrected, save to user profile first
      if (user?._id && finalUserPhone && finalUserPhone !== user.phone) {
        const updateRes = await updateProfile({ id: user._id, phone: finalUserPhone }).unwrap();
        if (updateRes.success && updateRes.data) {
          dispatch(updateUser({ phone: finalUserPhone }));
          await secureStorage.saveCachedUser({ ...user, phone: finalUserPhone });
          setIsEditingUserPhone(false);
        }
      }

      const payload = {
        roomId: room._id,
        emergencyContact: emergencyVal.e164,
        cnicFrontUrl: cnicFrontUrl || undefined,
        cnicBackUrl: cnicBackUrl || undefined,
        termsAcceptedAt: new Date().toISOString(),
      };

      const result = await createBooking(payload).unwrap();

      if (result.success) {
        showDialog(
          'Application Submitted!',
          `Your booking request for Room ${room.roomNumber} has been received. Hostel management will review your application.`,
          [
            {
              text: 'View My Stay',
              onPress: () => {
                allowNavigation(() => navigation.navigate('StudentTabs', { screen: 'StayTab' }));
              },
            },
          ]
        );
      }
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'Unable to submit booking application. Please try again.';
      setErrorMessage(msg);
      showDialog('Application Error', msg);
    }
  };

  return (
    <ScreenContainer scrollable withKeyboardAvoid>
      <AppHeader
        title="Booking Application"
        subtitle={`Request allocation for Room ${room.roomNumber}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* Selected Room Summary */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.layoutTag}>
              <Text style={styles.layoutTagText}>{room.layoutType} Layout</Text>
            </View>
            <View style={styles.statusTag}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.statusTagText}>{availableBeds} bed(s) available</Text>
            </View>
          </View>

          <Text style={[TYPOGRAPHY.h2, styles.roomHeading]}>Room {room.roomNumber}</Text>
          <Text style={[TYPOGRAPHY.body, styles.hostelSubtext]}>{hostelName}</Text>

          {/* Pricing Highlight */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Monthly Rent for this Room</Text>
            <Text style={[TYPOGRAPHY.h2, styles.priceValue]}>
              PKR {effectiveRent.toLocaleString()}
              <Text style={styles.perMonthText}> / month</Text>
            </Text>
          </View>

          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Ionicons name="people-outline" size={18} color={COLORS.primary} />
              <Text style={styles.specLabel}>Capacity: {room.capacity} beds</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="bed-outline" size={18} color={COLORS.primary} />
              <Text style={styles.specLabel}>Occupied: {room.occupiedCount} beds</Text>
            </View>
          </View>
        </View>

        {/* Global Error Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={COLORS.error} />
            <Text style={[TYPOGRAPHY.caption, styles.errorBannerText]}>{errorMessage}</Text>
          </View>
        )}

        {/* Applicant Information Section */}
        <View style={styles.section}>
          <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Applicant Details</Text>
          <Text style={[TYPOGRAPHY.caption, styles.sectionSubtitle]}>
            Verified account details submitted to hostel management
          </Text>

          <View style={styles.applicantInfoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Full Name:</Text>
              <Text style={styles.infoVal}>{user?.name || 'Student'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Email Address:</Text>
              <Text style={styles.infoVal}>{user?.email || '—'}</Text>
            </View>

            {/* Student Contact Number */}
            {!isEditingUserPhone && initialPhoneState.isValid ? (
              <View style={styles.phoneSummaryContainer}>
                <View style={styles.phoneSummaryHeader}>
                  <Text style={styles.infoKey}>Contact Number:</Text>
                  <TouchableOpacity
                    onPress={() => setIsEditingUserPhone(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.changePhoneText}>Change</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.phoneSummaryRow}>
                  <Text style={styles.infoVal}>{formatPhoneDisplay(user?.phone)}</Text>
                  <View style={styles.validBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                    <Text style={styles.validBadgeText}>Valid number</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.phoneEditContainer}>
                <PhoneInputWithCountry
                  label="Your Mobile Number"
                  required
                  value={userPhoneInput}
                  country={userPhoneCountry}
                  onChangeText={(val) => {
                    setUserPhoneInput(val);
                    if (userPhoneError) setUserPhoneError(null);
                  }}
                  onSelectCountry={setUserPhoneCountry}
                  error={userPhoneError}
                  helperText="Required for booking confirmation and hostel management"
                  showValidityBadge
                  isValid={validateAndFormatPhone(userPhoneInput, userPhoneCountry.code).isValid}
                />
                {initialPhoneState.isValid && (
                  <TouchableOpacity
                    style={styles.cancelChangeButton}
                    onPress={() => {
                      setUserPhoneInput(initialPhoneState.nationalNumber);
                      setUserPhoneCountry(initialPhoneState.country);
                      setUserPhoneError(null);
                      setIsEditingUserPhone(false);
                    }}
                  >
                    <Text style={styles.cancelChangeText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Emergency Contact Section */}
        <View style={styles.section}>
          <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>
            Emergency Contact <Text style={styles.requiredStar}>*</Text>
          </Text>
          <Text style={[TYPOGRAPHY.caption, styles.sectionSubtitle]}>
            Parent or guardian mobile number for urgent matters during stay
          </Text>

          <PhoneInputWithCountry
            value={emergencyContact}
            country={emergencyCountry}
            onChangeText={(val) => {
              setEmergencyContact(val);
              if (contactError) setContactError(null);
            }}
            onSelectCountry={setEmergencyCountry}
            error={contactError}
            showValidityBadge
            isValid={validateAndFormatPhone(emergencyContact, emergencyCountry.code).isValid}
          />
        </View>

        {/* CNIC Verification Section */}
        <View style={styles.section}>
          <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Identity Verification (CNIC)</Text>
          <Text style={[TYPOGRAPHY.caption, styles.sectionSubtitle]}>
            Upload clear photos of front and back of your CNIC / National ID
          </Text>

          <View style={styles.uploadRow}>
            <View style={{ flex: 1 }}>
              <PhotoUploadCard
                label="CNIC Front"
                helperText="Photo side"
                imageUri={cnicFrontUrl}
                isLoading={isUploadingFront}
                onPickImage={() => handlePickImage('front')}
                onRemoveImage={() => setCnicFrontUrl(null)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PhotoUploadCard
                label="CNIC Back"
                helperText="Address side"
                imageUri={cnicBackUrl}
                isLoading={isUploadingBack}
                onPickImage={() => handlePickImage('back')}
                onRemoveImage={() => setCnicBackUrl(null)}
              />
            </View>
          </View>
        </View>

        {/* Terms & Policies Checkbox */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.8}
            onPress={() => {
              setTermsAccepted(!termsAccepted);
              if (termsError) setTermsError(null);
            }}
          >
            <View
              style={[
                styles.checkboxBox,
                termsAccepted && styles.checkboxBoxChecked,
                !!termsError && styles.checkboxBoxError,
              ]}
            >
              {termsAccepted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <View style={styles.checkboxLabelContainer}>
              <Text style={[TYPOGRAPHY.body, styles.checkboxLabel]}>
                I confirm that all submitted details and documents are authentic. I agree to comply
                with hostel community rules and monthly rent obligations.
              </Text>
            </View>
          </TouchableOpacity>
          {termsError && (
            <Text style={[TYPOGRAPHY.caption, styles.fieldErrorText]}>{termsError}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PrimaryButton
            title="Submit Booking Application"
            onPress={handleSubmitApplication}
            isLoading={isSubmitting}
            disabled={isSubmitting || isUploadingFront || isUploadingBack}
            style={styles.actionButton}
          />
          <SecondaryButton
            title="Cancel"
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
            style={styles.actionButton}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  layoutTag: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  layoutTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  roomHeading: {
    color: COLORS.textPrimary,
  },
  hostelSubtext: {
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  priceContainer: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  priceValue: {
    color: COLORS.primary,
  },
  perMonthText: {
    fontSize: 13,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  errorBannerText: {
    color: COLORS.error,
    flex: 1,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  requiredStar: {
    color: COLORS.error,
  },
  applicantInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  infoKey: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  fieldErrorText: {
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxBoxError: {
    borderColor: COLORS.error,
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  actions: {
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  actionButton: {
    width: '100%',
  },
  phoneSummaryContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  phoneSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  phoneSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changePhoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    gap: 3,
  },
  validBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  phoneEditContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  cancelChangeButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: SPACING.xs,
  },
  cancelChangeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
