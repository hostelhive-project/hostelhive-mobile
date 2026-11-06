import React, { useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CopyableField } from '../../components/ui/CopyableField';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { COLORS } from '../../constants/colors';
import { RADIUS, SHADOWS, SPACING } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';
import {
  useGetComplaintByIdQuery,
  useLazyGetComplaintBlockchainRecordQuery,
  useMarkComplaintFixedMutation,
} from '../../services/complaintApi';
import type { StaffStackParamList } from '../../navigation/types';
import { categoryDisplayLabel } from '../../types/complaint';
import { showDialog } from '../../utils/dialog';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { AppModal } from '../../components/ui/AppModal';
import { AppTextInput } from '../../components/common/AppTextInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { useUploadImageMutation } from '../../services/uploadApi';
import { createUploadFormData, promptImageSource } from '../../utils/uploadHelpers';

type StaffComplaintDetailRoute = RouteProp<StaffStackParamList, 'StaffComplaintDetail'>;

export const StaffComplaintDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<StaffComplaintDetailRoute>();
  const { complaintId } = route.params;
  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetComplaintByIdQuery(complaintId);
  const [getBlockchainRecord, { isFetching: isLoadingBlockchainRecord }] =
    useLazyGetComplaintBlockchainRecordQuery();
  const [markComplaintFixed, { isLoading: isMarkingFixed }] = useMarkComplaintFixedMutation();
  const [uploadImage, { isLoading: isUploadingProof }] = useUploadImageMutation();
  const [isRepairModalVisible, setIsRepairModalVisible] = useState(false);
  const [repairNote, setRepairNote] = useState('');
  const [repairProof, setRepairProof] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [isSubmittingRepair, setIsSubmittingRepair] = useState(false);

  const complaint = response?.data;

  const handlePickRepairPhoto = () => promptImageSource({
    title: 'Add repair proof',
    message: 'Choose a photo that shows the completed repair.',
    pickerOptions: { allowsEditing: true, quality: 0.8 },
    onImageSelected: setRepairProof,
  });

  const handleMarkFixed = async () => {
    if (isSubmittingRepair) return;
    setIsSubmittingRepair(true);
    try {
      let repairProofImageUrl: string | undefined;
      if (repairProof) {
        const formData = await createUploadFormData(repairProof, '/complaints');
        const uploadResult = await uploadImage(formData).unwrap();
        repairProofImageUrl = uploadResult.data?.url;
        if (!repairProofImageUrl) throw new Error('The repair photo upload did not return an image URL.');
      }
      await markComplaintFixed({
        complaintId,
        body: {
          repairNote: repairNote.trim() || undefined,
          repairProofImageUrl,
        },
      }).unwrap();
      setIsRepairModalVisible(false);
      setRepairNote('');
      setRepairProof(null);
      showDialog('Submitted for Verification', 'The administrator has been notified to review the repair evidence.');
    } catch (error: any) {
      showDialog(
        'Unable to Submit Repair',
        error?.data?.message || error?.message || 'Please refresh the complaint and try again.'
      );
    } finally {
      setIsSubmittingRepair(false);
    }
  };

  const handleViewOnExplorer = async () => {
    try {
      const result = await getBlockchainRecord(complaintId).unwrap();
      const record = result.data;
      if (!record?.explorerUrl) {
        showDialog(
          'Explorer Link Unavailable',
          `This record is on ${record?.network || 'the configured ledger'}, but it does not have a public explorer transaction URL. It may have been recorded in simulated mode.`
        );
        return;
      }
      await Linking.openURL(record.explorerUrl);
    } catch (error: any) {
      showDialog(
        'Blockchain Record Unavailable',
        error?.data?.message || error?.message || 'Unable to load the public explorer link. Please try again.'
      );
    }
  };

  if (isLoading && !complaint) {
    return (
      <ScreenContainer style={styles.screen}>
        <AppHeader title="Complaint Details" showBack onBack={() => navigation.goBack()} />
        <View style={styles.loadingContent}>
          <LoadingState message="Loading complaint details..." />
        </View>
      </ScreenContainer>
    );
  }

  if (!complaint) {
    return (
      <ScreenContainer style={styles.screen}>
        <AppHeader title="Complaint Details" showBack onBack={() => navigation.goBack()} />
        <ErrorState
          title="Complaint Unavailable"
          message="Unable to retrieve this complaint. Check your connection or ask your administrator to confirm its assignment."
          onRetry={refetch}
        />
      </ScreenContainer>
    );
  }

  const resident = typeof complaint.residentId === 'object' ? complaint.residentId : null;
  const hostel = typeof complaint.hostelId === 'object' ? complaint.hostelId : null;
  const room = typeof complaint.roomId === 'object' ? complaint.roomId : null;
  const roomNumber = complaint.roomNumberAtSubmission || room?.roomNumber;
  const statusLabel = complaint.status === 'InReview'
    ? 'In Review'
    : complaint.status === 'AwaitingAdminVerification'
    ? 'Awaiting Admin Verification'
    : complaint.status;

  return (
    <ScreenContainer style={styles.screen}>
      <AppHeader
        title="Complaint Details"
        subtitle={`ID: #${complaint._id.slice(-6).toUpperCase()}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => { void refetch(); }}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.categoryBadge}>
              <Ionicons name="construct-outline" size={15} color={COLORS.primary} />
              <Text style={[TYPOGRAPHY.captionSemiBold, styles.categoryText]}>
                {categoryDisplayLabel(complaint.category)}
              </Text>
            </View>
            <StatusBadge status={complaint.status} />
          </View>

          <Text style={[TYPOGRAPHY.h2, styles.title]}>
            {complaint.title || categoryDisplayLabel(complaint.category)}
          </Text>
          <Text style={[TYPOGRAPHY.body, styles.description]}>{complaint.description}</Text>

          <View style={styles.divider} />
          <InfoRow label="Severity" value={`${complaint.severityTier} priority`} />
          <InfoRow label="Room" value={roomNumber ? `Room ${roomNumber}` : 'Room not recorded'} />
          <InfoRow label="Reported by" value={resident?.name || 'Resident'} />
          {hostel?.name ? <InfoRow label="Hostel" value={hostel.name} /> : null}
          <InfoRow label="Submitted" value={new Date(complaint.createdAt).toLocaleString()} />
        </View>

        {complaint.photoUrls?.length ? (
          <View style={styles.card}>
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Photos from resident</Text>
            <View style={styles.photoRow}>
              {complaint.photoUrls.map((url, index) => (
                <TouchableOpacity
                  key={`${url}-${index}`}
                  onPress={() => setSelectedPhotoUrl(url)}
                  accessibilityRole="button"
                  accessibilityLabel={`View resident complaint photo ${index + 1}`}
                >
                  <Image source={{ uri: url }} style={styles.evidenceThumbnail} contentFit="cover" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-branch-outline" size={19} color={COLORS.primary} />
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Current Status</Text>
          </View>
          <Text style={[TYPOGRAPHY.body, styles.statusDescription]}>
            This complaint is currently <Text style={styles.statusEmphasis}>{statusLabel}</Text>.{' '}
            {complaint.status === 'InReview'
              ? 'After fixing the issue, submit it for admin verification below.'
              : complaint.status === 'AwaitingAdminVerification'
              ? 'The repair has been submitted. Hostel administration must verify it before it is resolved.'
              : 'The final resolution status is managed by hostel administration.'}
          </Text>
          {complaint.repairNote || complaint.repairProofImageUrl ? (
            <View style={styles.repairEvidence}>
              <Text style={[TYPOGRAPHY.captionSemiBold, styles.evidenceTitle]}>Submitted repair evidence</Text>
              {complaint.repairNote ? <Text style={[TYPOGRAPHY.body, styles.repairNote]}>{complaint.repairNote}</Text> : null}
              {complaint.repairProofImageUrl ? (
                <TouchableOpacity
                  onPress={() => setSelectedPhotoUrl(complaint.repairProofImageUrl || null)}
                  accessibilityRole="button"
                  accessibilityLabel="View repair proof photo"
                >
                  <Image source={{ uri: complaint.repairProofImageUrl }} style={styles.repairPhoto} contentFit="cover" />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Status history</Text>
          {!complaint.statusHistory?.length ? <Text style={[TYPOGRAPHY.bodySmall, styles.historyDate]}>No status changes recorded yet.</Text> : null}
          {(complaint.statusHistory || []).map((entry, index) => (
            <View key={`${entry.status}-${entry.changedAt}-${index}`} style={styles.historyRow}>
              <View style={styles.historyDot} />
              <View style={styles.historyCopy}>
                <Text style={[TYPOGRAPHY.bodySemiBold, styles.historyStatus]}>
                  {entry.status === 'InReview' ? 'In Review' : entry.status === 'AwaitingAdminVerification' ? 'Awaiting Admin Verification' : entry.status}
                </Text>
                <Text style={[TYPOGRAPHY.caption, styles.historyDate]}>{new Date(entry.changedAt).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        {complaint.status === 'InReview' ? (
          <TouchableOpacity
            style={[styles.markFixedButton, (isMarkingFixed || isUploadingProof || isSubmittingRepair) && styles.markFixedButtonDisabled]}
            onPress={() => setIsRepairModalVisible(true)}
            disabled={isMarkingFixed || isUploadingProof || isSubmittingRepair}
            accessibilityRole="button"
            accessibilityLabel="Mark repair as fixed and submit it for admin verification"
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textInverse} />
            <Text style={[TYPOGRAPHY.button, styles.markFixedButtonText]}>
              {isMarkingFixed ? 'Submitting...' : 'Mark as Fixed'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {complaint.severityTier === 'Critical' ? (
          <View style={styles.auditCard}>
            <View style={styles.auditHeading}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.info} />
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.auditTitle]}>Critical Complaint Audit</Text>
            </View>
            {complaint.blockchainRef ? (
              <>
                <Text style={[TYPOGRAPHY.caption, styles.auditLabel]}>AUDIT REFERENCE</Text>
                <CopyableField value={complaint.blockchainRef} label="Complaint audit reference" leadingIcon="shield-checkmark-outline" />
                <TouchableOpacity
                  onPress={handleViewOnExplorer}
                  disabled={isLoadingBlockchainRecord}
                  accessibilityRole="button"
                  style={styles.explorerButton}
                >
                  <Text style={[TYPOGRAPHY.captionSemiBold, styles.explorerText]}>
                    {isLoadingBlockchainRecord ? 'Loading explorer...' : 'View on Explorer'}
                  </Text>
                  {!isLoadingBlockchainRecord ? (
                    <Ionicons name="open-outline" size={16} color={COLORS.primary} />
                  ) : null}
                </TouchableOpacity>
              </>
            ) : (
              <Text style={[TYPOGRAPHY.caption, styles.auditPending]}>
                The audit record is not available yet.
              </Text>
            )}
          </View>
        ) : null}
      </ScrollView>
      <AppModal
        visible={isRepairModalVisible}
        onClose={() => { if (!isMarkingFixed && !isUploadingProof && !isSubmittingRepair) setIsRepairModalVisible(false); }}
        title="Submit repair for review"
        subtitle="The administrator will review this before resolving the complaint."
      >
        <View>
          <AppTextInput
            label="Repair note (optional)"
            placeholder="Describe what you repaired or checked"
            value={repairNote}
            onChangeText={setRepairNote}
            multiline
            maxLength={500}
            containerStyle={styles.repairInput}
          />
          <Text style={[TYPOGRAPHY.caption, styles.charCount]}>{repairNote.length}/500</Text>
          {repairProof ? (
            <View style={styles.selectedProof}>
              <Image source={{ uri: repairProof.uri }} style={styles.selectedProofImage} contentFit="cover" />
              <TouchableOpacity
                onPress={() => setRepairProof(null)}
                style={styles.removeProofButton}
                accessibilityRole="button"
                accessibilityLabel="Remove repair proof photo"
              >
                <Ionicons name="close" size={17} color={COLORS.textInverse} />
              </TouchableOpacity>
            </View>
          ) : (
            <SecondaryButton
              title="Add repair photo (optional)"
              onPress={handlePickRepairPhoto}
              disabled={isMarkingFixed || isUploadingProof || isSubmittingRepair}
              style={styles.modalFullButton}
              icon={<Ionicons name="camera-outline" size={18} color={COLORS.textPrimary} />}
            />
          )}
          <View style={styles.modalActions}>
            <SecondaryButton
              title="Cancel"
              onPress={() => setIsRepairModalVisible(false)}
              disabled={isMarkingFixed || isUploadingProof || isSubmittingRepair}
              style={styles.modalAction}
            />
            <PrimaryButton
              title="Submit for review"
              onPress={handleMarkFixed}
              isLoading={isMarkingFixed || isUploadingProof || isSubmittingRepair}
              disabled={isMarkingFixed || isUploadingProof || isSubmittingRepair}
              style={styles.modalAction}
            />
          </View>
        </View>
      </AppModal>
      <AppModal
        visible={Boolean(selectedPhotoUrl)}
        onClose={() => setSelectedPhotoUrl(null)}
        title="Complaint photo"
        scrollable={false}
        containerStyle={styles.photoModal}
      >
        {selectedPhotoUrl ? <Image source={{ uri: selectedPhotoUrl }} style={styles.fullPhoto} contentFit="contain" /> : null}
      </AppModal>
    </ScreenContainer>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={[TYPOGRAPHY.caption, styles.infoLabel]}>{label}</Text>
    <Text style={[TYPOGRAPHY.bodySemiBold, styles.infoValue]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    maxWidth: '100%',
  },
  categoryText: {
    color: COLORS.primary,
    flexShrink: 1,
  },
  title: {
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  description: {
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  infoLabel: {
    color: COLORS.textMuted,
    flex: 1,
    minWidth: 0,
  },
  infoValue: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  statusDescription: {
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: SPACING.md,
  },
  statusEmphasis: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  markFixedButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  markFixedButtonDisabled: {
    opacity: 0.65,
  },
  markFixedButtonText: {
    color: COLORS.textInverse,
    flexShrink: 1,
    textAlign: 'center',
  },
  auditCard: {
    backgroundColor: COLORS.infoLight,
    borderColor: COLORS.infoBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  auditHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  auditTitle: {
    color: COLORS.info,
    flex: 1,
  },
  auditLabel: {
    color: COLORS.textMuted,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  auditPending: {
    color: COLORS.textSecondary,
  },
  explorerButton: {
    minHeight: 48,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
  },
  explorerText: {
    color: COLORS.primary,
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  evidenceThumbnail: { width: 108, height: 88, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceSubtle },
  repairEvidence: { marginTop: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceSubtle },
  evidenceTitle: { color: COLORS.textPrimary, marginBottom: SPACING.sm },
  repairNote: { color: COLORS.textSecondary, marginBottom: SPACING.sm },
  repairPhoto: { width: '100%', height: 180, borderRadius: RADIUS.md, backgroundColor: COLORS.card },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.cardBorder },
  historyDot: { width: 9, height: 9, marginTop: 5, borderRadius: 5, backgroundColor: COLORS.primary },
  historyCopy: { flex: 1, minWidth: 0 },
  historyStatus: { color: COLORS.textPrimary },
  historyDate: { color: COLORS.textMuted, marginTop: 2 },
  repairInput: { marginBottom: 0 },
  charCount: { textAlign: 'right', color: COLORS.textMuted, marginBottom: SPACING.md },
  selectedProof: { position: 'relative', marginBottom: SPACING.md },
  selectedProofImage: { width: '100%', height: 156, borderRadius: RADIUS.md },
  removeProofButton: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  modalActions: { flexDirection: 'column-reverse', gap: SPACING.sm, marginTop: SPACING.md },
  modalAction: { width: '100%' },
  modalFullButton: { width: '100%' },
  photoModal: { minHeight: 340 },
  fullPhoto: { width: '100%', height: 340, borderRadius: RADIUS.md },
});
