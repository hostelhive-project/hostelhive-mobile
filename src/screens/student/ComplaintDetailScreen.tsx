import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SeverityChip, StatusBadge } from '../../components/common/StatusBadge';
import { CopyableField } from '../../components/ui/CopyableField';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import {
  useGetComplaintByIdQuery,
  useLazyGetComplaintBlockchainRecordQuery,
  useConfirmComplaintResolvedMutation,
  useReopenComplaintMutation,
} from '../../services/complaintApi';
import { Image } from 'expo-image';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { AppModal } from '../../components/ui/AppModal';
import { useComplaintAccess } from '../../hooks/useComplaintAccess';
import { showDialog } from '../../utils/dialog';
import type { StudentStackParamList } from '../../navigation/types';
import { categoryDisplayLabel } from '../../types/complaint';

type RouteProps = RouteProp<StudentStackParamList, 'ComplaintDetail'>;

export const ComplaintDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const { complaintId } = route.params;

  // Backend GET /api/complaints/:id only checks ownership (residentId === user.id).
  // No CheckedIn requirement for reading — CheckedOut students can view their own history.
  const { canViewComplaints, isLoading: isCheckingAccess } = useComplaintAccess();

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetComplaintByIdQuery(complaintId, {
    skip: !canViewComplaints,
  });

  const complaint = response?.data;
  const [getBlockchainRecord, { isFetching: isLoadingBlockchainRecord }] =
    useLazyGetComplaintBlockchainRecordQuery();
  const [confirmResolved, { isLoading: isConfirmingResolved }] = useConfirmComplaintResolvedMutation();
  const [reopenComplaint, { isLoading: isReopening }] = useReopenComplaintMutation();
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

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

  if (isCheckingAccess) {
    return (
      <ScreenContainer>
        <AppHeader title="Complaint" showBack />
        <LoadingState message="Loading complaint..." />
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <AppHeader title="Complaint" showBack />
        <LoadingState message="Loading complaint details..." />
      </ScreenContainer>
    );
  }

  if (isError || !complaint) {
    return (
      <ScreenContainer style={styles.container}>
        <AppHeader title="Complaint" showBack onBack={() => navigation.goBack()} />
        <ErrorState
          title="Complaint Not Found"
          message="Unable to load details for this complaint. It may not exist or you may not have access."
          onRetry={refetch}
        />
      </ScreenContainer>
    );
  }

  const staff = complaint.assignedStaffId;
  const hostel = typeof complaint.hostelId === 'object' ? complaint.hostelId : null;
  const room = typeof complaint.roomId === 'object' ? complaint.roomId : null;
  const roomNumber = complaint.roomNumberAtSubmission || room?.roomNumber;
  const isInReview = complaint.status === 'InReview';
  const isAwaitingVerification = complaint.status === 'AwaitingAdminVerification';
  const isResolved = complaint.status === 'Resolved';

  const handleConfirmResolution = () => showDialog(
    'Confirm the repair is resolved?',
    'Your confirmation lets hostel management know the reported issue is fixed. If it is still present, choose Reopen instead.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm resolved',
        onPress: async () => {
          try {
            await confirmResolved(complaintId).unwrap();
            showDialog('Resolution confirmed', 'Thank you. Hostel management has been notified.');
          } catch (error: any) {
            showDialog('Unable to confirm', error?.data?.message || error?.message || 'Refresh the complaint and try again.');
          }
        },
      },
    ]
  );

  const handleReopen = () => showDialog(
    'Reopen this complaint?',
    'The complaint will return to In Review and the assigned staff member and hostel administrator will be notified.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reopen complaint',
        style: 'destructive',
        onPress: async () => {
          try {
            await reopenComplaint(complaintId).unwrap();
            showDialog('Complaint reopened', 'The team has been notified to review the issue again.');
          } catch (error: any) {
            showDialog('Unable to reopen', error?.data?.message || error?.message || 'Refresh the complaint and try again.');
          }
        },
      },
    ]
  );

  const statusLabel = (status: string) => status === 'InReview'
    ? 'In Review'
    : status === 'AwaitingAdminVerification'
      ? 'Awaiting Admin Verification'
      : status;

  return (
    <ScreenContainer style={styles.container}>
      <AppHeader
        title="Complaint Details"
        subtitle={`ID: #${complaint._id.slice(-6).toUpperCase()}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => { void refetch(); }}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Status & Severity Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.categoryBadge}>
              <Ionicons name="construct-outline" size={14} color={COLORS.primary} />
              <Text style={[TYPOGRAPHY.captionSemiBold, styles.categoryText]}>
                {categoryDisplayLabel(complaint.category)}
              </Text>
            </View>
            <StatusBadge status={complaint.status} />
          </View>

          {complaint.title ? (
            <Text style={[TYPOGRAPHY.h2, styles.titleText]}>{complaint.title}</Text>
          ) : null}

          <Text style={[TYPOGRAPHY.body, styles.descriptionText]}>
            {complaint.description}
          </Text>

          <View style={styles.roomMeta}>
            <Ionicons name="bed-outline" size={15} color={COLORS.textMuted} />
            <Text style={[TYPOGRAPHY.caption, styles.dateMeta]}>
              {roomNumber ? `Room ${roomNumber}` : 'Room not recorded'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <SeverityChip level={complaint.severityTier} />

            <Text style={[TYPOGRAPHY.caption, styles.dateMeta]}>
              Filed {new Date(complaint.createdAt).toLocaleDateString()} at{' '}
              {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {complaint.photoUrls?.length ? (
          <View style={styles.sectionCard}>
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Photos from you</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {complaint.photoUrls.map((url, index) => (
                <TouchableOpacity
                  key={`${url}-${index}`}
                  onPress={() => setSelectedPhotoUrl(url)}
                  accessibilityRole="button"
                  accessibilityLabel={`View complaint photo ${index + 1}`}
                >
                  <Image source={{ uri: url }} style={styles.evidenceThumbnail} contentFit="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Current status</Text>
          <StatusBadge status={complaint.status} />
          <Text style={[TYPOGRAPHY.bodySmall, styles.currentStatusCopy]}>
            {isResolved
              ? 'Management marked this complaint resolved. Review the repair update, then confirm the issue is fixed or reopen it below.'
              : isAwaitingVerification
              ? 'Staff submitted the repair for review. Hostel management will verify the work before marking it resolved.'
              : isInReview
              ? 'Hostel management is reviewing the issue with the assigned staff member. Repair updates will appear here.'
              : 'Your complaint has been submitted. Hostel management will review it and assign a staff member.'}
          </Text>
        </View>

        {complaint.repairNote || complaint.repairProofImageUrl ? (
          <View style={styles.sectionCard}>
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Repair update</Text>
            {complaint.repairNote ? <Text style={[TYPOGRAPHY.body, styles.repairNote]}>{complaint.repairNote}</Text> : null}
            {complaint.repairProofImageUrl ? (
              <TouchableOpacity
                onPress={() => setSelectedPhotoUrl(complaint.repairProofImageUrl || null)}
                accessibilityRole="button"
                accessibilityLabel="View staff repair photo"
              >
                <Image source={{ uri: complaint.repairProofImageUrl }} style={styles.repairPhoto} contentFit="cover" />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Status history</Text>
          {!complaint.statusHistory?.length ? <Text style={[TYPOGRAPHY.bodySmall, styles.historyDate]}>No status changes recorded yet.</Text> : null}
          {(complaint.statusHistory || []).map((entry, index) => (
            <View key={`${entry.status}-${entry.changedAt}-${index}`} style={styles.historyRow}>
              <View style={styles.historyDot} />
              <View style={styles.historyCopy}>
                <Text style={[TYPOGRAPHY.bodySemiBold, styles.historyStatus]}>{statusLabel(entry.status)}</Text>
                <Text style={[TYPOGRAPHY.caption, styles.historyDate]}>
                  {new Date(entry.changedAt).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {isResolved ? (
          <View style={styles.resolutionActions}>
            {complaint.residentConfirmedAt ? (
              <View style={styles.confirmedBanner}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={[TYPOGRAPHY.captionSemiBold, styles.confirmedText]}>
                  You confirmed this resolution on {new Date(complaint.residentConfirmedAt).toLocaleDateString()}.
                </Text>
              </View>
            ) : (
              <PrimaryButton
                title="Confirm resolved"
                onPress={handleConfirmResolution}
                isLoading={isConfirmingResolved}
                disabled={isConfirmingResolved || isReopening}
                style={styles.resolutionButton}
              />
            )}
            <SecondaryButton
              title="Reopen complaint"
              onPress={handleReopen}
              isLoading={isReopening}
              disabled={isReopening || isConfirmingResolved}
              style={styles.resolutionButton}
            />
          </View>
        ) : null}

        {/* Assigned Staff Card */}
        <View style={styles.sectionCard}>
          <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Staff Assignment</Text>
          {staff ? (
            <View style={styles.staffContainer}>
              <View style={styles.staffAvatar}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.staffDetails}>
                <Text style={[TYPOGRAPHY.bodySemiBold, styles.staffName]}>{staff.name}</Text>
                <Text style={[TYPOGRAPHY.caption, styles.staffRole]}>Assigned maintenance staff</Text>
              </View>
            </View>
          ) : (
            <View style={styles.unassignedBox}>
              <Ionicons name="time-outline" size={20} color={COLORS.warning} />
              <Text style={[TYPOGRAPHY.caption, styles.unassignedText]}>
                No staff member has been assigned yet. The hostel manager will allocate a
                team member to inspect your issue.
              </Text>
            </View>
          )}
        </View>

        {/* Hostel Details */}
        {hostel ? (
          <View style={styles.sectionCard}>
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Hostel</Text>
            <View style={styles.hostelRow}>
              <Ionicons name="business-outline" size={18} color={COLORS.primary} />
              <View style={styles.hostelInfo}>
                <Text style={[TYPOGRAPHY.bodySemiBold, styles.hostelName]}>{hostel.name}</Text>
                <Text style={[TYPOGRAPHY.caption, styles.hostelLocation]}>
                  {hostel.location}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Blockchain Audit Record Box (Critical Complaints) */}
        {complaint.severityTier === 'Critical' && complaint.blockchainRef ? (
          <View style={styles.blockchainCard}>
            <View style={styles.blockchainHeader}>
              <Ionicons name="shield-outline" size={22} color={COLORS.info} />
              <View style={styles.blockchainHeaderText}>
                <Text style={[TYPOGRAPHY.bodySemiBold, styles.blockchainTitle]}>
                  Blockchain Audit Recorded
                </Text>
                <Text style={[TYPOGRAPHY.caption, styles.blockchainSubtitle]}>
                  Audit record available on ledger
                </Text>
              </View>
            </View>

            <CopyableField value={complaint.blockchainRef} label="Complaint audit reference" leadingIcon="shield-checkmark-outline" style={styles.blockchainRefBox} />

            <TouchableOpacity
              style={styles.explorerButton}
              onPress={handleViewOnExplorer}
              disabled={isLoadingBlockchainRecord}
              accessibilityRole="button"
              accessibilityLabel="View complaint audit record on blockchain explorer"
            >
              <Text style={[TYPOGRAPHY.captionSemiBold, styles.explorerButtonText]}>
                {isLoadingBlockchainRecord ? 'Loading explorer link...' : 'View on Explorer'}
              </Text>
              {!isLoadingBlockchainRecord && (
                <Ionicons name="open-outline" size={16} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            <Text style={[TYPOGRAPHY.caption, styles.blockchainNote]}>
              This complaint was flagged as Critical and a SHA-256 hash has been
              written to the HostelHive audit ledger for accountability purposes.
            </Text>
          </View>
        ) : null}
      </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    maxWidth: '100%',
  },
  categoryText: {
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  titleText: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  descriptionText: {
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  dateMeta: {
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  currentStatusCopy: { color: COLORS.textSecondary, marginTop: SPACING.md },
  staffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceSubtle,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  staffDetails: {
    flex: 1,
  },
  staffName: {
    color: COLORS.textPrimary,
  },
  staffRole: {
    color: COLORS.textSecondary,
  },
  unassignedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
  },
  unassignedText: {
    color: COLORS.warningText,
    flex: 1,
    lineHeight: 18,
  },
  hostelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  hostelInfo: {
    flex: 1,
  },
  hostelName: {
    color: COLORS.textPrimary,
  },
  hostelLocation: {
    color: COLORS.textSecondary,
  },
  blockchainCard: {
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.infoBorder,
  },
  blockchainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  blockchainHeaderText: {
    flex: 1,
  },
  blockchainTitle: {
    color: COLORS.info,
  },
  blockchainSubtitle: {
    color: COLORS.info,
  },
  blockchainRefBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.infoBorder,
    marginBottom: SPACING.sm,
  },
  blockchainNote: {
    color: COLORS.info,
    lineHeight: 18,
  },
  photoRow: {
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  evidenceThumbnail: {
    width: 112,
    height: 88,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
  },
  repairNote: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  repairPhoto: {
    width: '100%',
    height: 190,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cardBorder,
  },
  historyDot: {
    width: 9,
    height: 9,
    marginTop: 5,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  historyCopy: { flex: 1, minWidth: 0 },
  historyStatus: { color: COLORS.textPrimary },
  historyDate: { color: COLORS.textMuted, marginTop: 2 },
  resolutionActions: { gap: SPACING.sm },
  resolutionButton: { width: '100%' },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.successLight,
  },
  confirmedText: { flex: 1, color: COLORS.success },
  photoModal: { minHeight: 340 },
  fullPhoto: { width: '100%', height: 340, borderRadius: RADIUS.md },
  explorerButton: {
    minHeight: 48,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xs,
  },
  explorerButtonText: {
    color: COLORS.primary,
  },
});
