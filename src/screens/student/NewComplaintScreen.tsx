import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { useNavigation } from '@react-navigation/native';
import { showDialog } from '../../utils/dialog';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppTextInput } from '../../components/common/AppTextInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { useCreateComplaintMutation } from '../../services/complaintApi';
import { useUploadImageMutation } from '../../services/uploadApi';
import { createUploadFormData, promptImageSource } from '../../utils/uploadHelpers';
import { useRequireActiveResident } from '../../hooks/useRequireActiveResident';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_SEVERITIES,
  type ComplaintCategory,
  type ComplaintSeverity,
} from '../../types/complaint';

// Icons are keyed by the UPPERCASE category value
const CATEGORY_ICONS: Record<ComplaintCategory, keyof typeof Ionicons.glyphMap>={
  PLUMBING: 'water-outline',
  ELECTRICAL: 'flash-outline',
  CLEANLINESS: 'sparkles-outline',
  NOISE: 'volume-high-outline',
  SECURITY: 'shield-outline',
  GENERAL: 'construct-outline',
};

import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';

export const NewComplaintScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isActiveResident, isLoading: isCheckingResidency } = useRequireActiveResident(true);

  const [category, setCategory] = useState<ComplaintCategory>('PLUMBING');
  const [severityTier, setSeverityTier] = useState<ComplaintSeverity>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [createComplaint, { isLoading: isSubmitting }] = useCreateComplaintMutation();
  const [uploadImage] = useUploadImageMutation();
  const { allowNavigation } = useUnsavedChanges(Boolean(title || description || photos.length || isUploadingPhotos));

  const handleAddPhoto = () => {
    if (photos.length >= 3) {
      showDialog('Photo limit reached', 'You can attach up to 3 photos to a complaint.');
      return;
    }
    promptImageSource({
      title: 'Add Complaint Photo',
      message: 'Choose a photo that helps explain the issue.',
      pickerOptions: { allowsEditing: true, quality: 0.8 },
      onImageSelected: (asset) => setPhotos((current) => current.length < 3 ? [...current, asset] : current),
    });
  };

  if (isCheckingResidency) {
    return (
      <ScreenContainer style={styles.centered}>
        <LoadingState message="Verifying active residency..." />
      </ScreenContainer>
    );
  }

  if (!isActiveResident) {
    return (
      <ScreenContainer style={styles.centered}>
        <EmptyState
          icon="lock-closed-outline"
          title="Resident Access Only"
          description="Only actively checked-in residents can file complaints."
          actionTitle="Go to My Stay"
          onAction={() => navigation.navigate('StudentTabs', { screen: 'StayTab' })}
        />
      </ScreenContainer>
    );
  }

  const handleSubmit = async () => {
    setValidationError(null);

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setValidationError('Please provide a description of the issue.');
      return;
    }

    if (trimmedDesc.length < 5) {
      setValidationError('Description must be at least 5 characters long.');
      return;
    }

    if (trimmedDesc.length > 2000) {
      setValidationError('Description must not exceed 2000 characters.');
      return;
    }

    try {
      setIsUploadingPhotos(photos.length > 0);
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const formData = await createUploadFormData(photo, '/complaints');
        const uploadResponse = await uploadImage(formData).unwrap();
        if (!uploadResponse.success || !uploadResponse.data?.url) {
          throw new Error(uploadResponse.message || 'A complaint photo could not be uploaded.');
        }
        photoUrls.push(uploadResponse.data.url);
      }

      const payload = {
        category,
        severityTier,
        title: title.trim() || undefined,
        description: trimmedDesc,
        photoUrls,
      };

      const res = await createComplaint(payload).unwrap();

      if (res.success) {
        setTitle('');
        setDescription('');
        setPhotos([]);
        setValidationError(null);

        showDialog(
          'Complaint Registered',
          severityTier === 'Critical'
            ? 'Your critical issue has been submitted and logged to the audit ledger. Management will be notified immediately.'
            : 'Your complaint has been submitted successfully. Management and staff will review it shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (navigation.canGoBack()) {
                  allowNavigation(() => navigation.goBack());
                } else {
                  allowNavigation(() => navigation.navigate('Complaints'));
                }
              },
            },
          ]
        );
      }
    } catch (err: any) {
      const errorMsg =
        err?.data?.message || err?.message || 'Failed to submit complaint. Please try again.';
      showDialog('Submission Error', errorMsg);
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  return (
    <ScreenContainer withKeyboardAvoid>
      <View style={styles.container}>
        <AppHeader
          title="File a Complaint"
          subtitle="Report room, facility, or maintenance issues"
          showBack
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Picker */}
          <View style={styles.section}>
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Issue Category</Text>
            <Text style={[TYPOGRAPHY.caption, styles.sectionSubtitle]}>
              Select the category that best describes the problem
            </Text>

            <View style={styles.categoryGrid}>
              {COMPLAINT_CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setCategory(cat.value)}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityLabel={cat.label}
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                  >
                    <Ionicons
                      name={CATEGORY_ICONS[cat.value]}
                      size={20}
                      color={isSelected ? COLORS.textInverse : COLORS.textPrimary}
                    />
                    <Text
                      style={[
                        TYPOGRAPHY.captionSemiBold,
                        styles.categoryCardText,
                        isSelected && styles.categoryCardTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Severity Picker */}
          <View style={styles.section}>
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Severity Level</Text>
            <Text style={[TYPOGRAPHY.caption, styles.sectionSubtitle]}>
              Indicate the urgency and impact of the issue
            </Text>

            <View style={styles.severityContainer}>
              {COMPLAINT_SEVERITIES.map((item) => {
                const isSelected = severityTier === item.tier;
                return (
                  <TouchableOpacity
                    key={item.tier}
                    onPress={() => setSeverityTier(item.tier)}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityLabel={`${item.label} severity`}
                    accessibilityHint={item.description}
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.severityCard, isSelected && styles.severityCardSelected]}
                  >
                    <View style={styles.severityHeader}>
                      <View style={styles.severityTitleRow}>
                        <View
                          style={[
                            styles.severityDot,
                            item.tier === 'Low' && styles.dotLow,
                            item.tier === 'Medium' && styles.dotMedium,
                            item.tier === 'High' && styles.dotHigh,
                            item.tier === 'Critical' && styles.dotCritical,
                          ]}
                        />
                        <Text style={[TYPOGRAPHY.bodySemiBold, styles.severityName]}>
                          {item.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                      )}
                    </View>
                    <Text style={[TYPOGRAPHY.caption, styles.severityDesc]}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {severityTier === 'Critical' && (
              <View style={styles.criticalNotice}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.info} />
                <Text style={[TYPOGRAPHY.caption, styles.criticalNoticeText]}>
                  Critical complaints are automatically committed to the permanent audit ledger for
                  accountability.
                </Text>
              </View>
            )}
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <AppTextInput
              label="Subject / Title (Optional)"
              placeholder="e.g., Leaking bathroom faucet in Room 204"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <AppTextInput
              label="Detailed Description *"
              placeholder="Please describe the issue in detail, including location within the room and when it started..."
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (validationError) setValidationError(null);
              }}
              multiline
              numberOfLines={5}
              maxLength={2000}
              error={validationError || undefined}
            />
            <Text style={[TYPOGRAPHY.caption, styles.characterCount]}>{description.length.toLocaleString()} / 2,000 characters</Text>
          </View>

          <View style={styles.section}>
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Photos (Optional)</Text>
            <Text style={[TYPOGRAPHY.caption, styles.sectionSubtitle]}>
              Add up to 3 photos to help staff understand the issue.
            </Text>
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={`${photo.uri}-${index}`} style={styles.photoPreview}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    disabled={isSubmitting || isUploadingPhotos}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove complaint photo ${index + 1}`}
                  >
                    <Ionicons name="close" size={16} color={COLORS.textInverse} />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 3 ? (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={handleAddPhoto}
                  disabled={isSubmitting || isUploadingPhotos}
                  accessibilityRole="button"
                  accessibilityLabel="Add a complaint photo"
                >
                  <Ionicons name="camera-outline" size={23} color={COLORS.primary} />
                  <Text style={[TYPOGRAPHY.captionSemiBold, styles.addPhotoText]}>Add photo</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <PrimaryButton
              title={isUploadingPhotos ? 'Uploading photos…' : 'Submit Complaint'}
              onPress={handleSubmit}
              isLoading={isSubmitting || isUploadingPhotos}
              disabled={isSubmitting || isUploadingPhotos}
            />
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.lg,
    ...SHADOWS.card,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  characterCount: { color: COLORS.textMuted, textAlign: 'right', marginTop: SPACING.xs },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryCard: {
    minHeight: 48,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryCardText: {
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  categoryCardTextSelected: {
    color: COLORS.textInverse,
  },
  severityContainer: {
    gap: SPACING.sm,
  },
  severityCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  severityCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
  },
  severityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  severityTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotLow: {
    backgroundColor: COLORS.textMuted,
  },
  dotMedium: {
    backgroundColor: COLORS.warning,
  },
  dotHigh: {
    backgroundColor: '#EA580C',
  },
  dotCritical: {
    backgroundColor: COLORS.danger,
  },
  severityName: {
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  severityDesc: {
    color: COLORS.textSecondary,
  },
  criticalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.infoLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.infoBorder,
  },
  criticalNoticeText: {
    color: COLORS.info,
    flex: 1,
  },
  buttonContainer: {
    marginTop: SPACING.md,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoPreview: {
    width: 104,
    height: 104,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceSubtle,
  },
  photoImage: { width: '100%', height: '100%' },
  removePhotoButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderBottomLeftRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  addPhotoButton: {
    width: 104,
    height: 104,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.cardBorder,
  },
  addPhotoText: { color: COLORS.primary },
});

