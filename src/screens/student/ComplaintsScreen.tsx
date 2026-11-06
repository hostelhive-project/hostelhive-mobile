import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SeverityChip, StatusBadge } from '../../components/common/StatusBadge';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { useGetMyComplaintsQuery } from '../../services/complaintApi';
import { useComplaintAccess } from '../../hooks/useComplaintAccess';
import type { StudentStackParamList } from '../../navigation/types';
import type { Complaint, ComplaintStatus } from '../../types/complaint';
import { categoryDisplayLabel } from '../../types/complaint';

type NavigationProp = NativeStackNavigationProp<StudentStackParamList, 'Complaints'>;

type FilterStatus = 'ALL' | ComplaintStatus;

export const ComplaintsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // Separate view vs create guards per backend contract:
  // GET /api/complaints/mine — no CheckedIn check, any Student can read
  // POST /api/complaints — CheckedIn required (backend enforces 403)
  const { canViewComplaints, canCreateComplaint, isLoading: isCheckingAccess } = useComplaintAccess();
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('ALL');

  const {
    data: response,
    isLoading: isComplaintsLoading,
    isFetching,
    isError: isComplaintsError,
    refetch,
  } = useGetMyComplaintsQuery(undefined, {
    skip: !canViewComplaints,
  });

  const complaints: Complaint[] = useMemo(() => response?.data || [], [response]);

  const filteredComplaints = useMemo(() => {
    if (selectedStatus === 'ALL') return complaints;
    return complaints.filter((c) => c.status === selectedStatus);
  }, [complaints, selectedStatus]);

  if (isCheckingAccess) {
    return (
      <ScreenContainer style={styles.loadingContainer}>
        <LoadingState message="Loading complaints..." />
      </ScreenContainer>
    );
  }

  const filters: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'All', value: 'ALL', count: complaints.length },
    { label: 'Submitted', value: 'Submitted', count: complaints.filter((c) => c.status === 'Submitted').length },
    { label: 'In Review', value: 'InReview', count: complaints.filter((c) => c.status === 'InReview').length },
    { label: 'Awaiting verification', value: 'AwaitingAdminVerification', count: complaints.filter((c) => c.status === 'AwaitingAdminVerification').length },
    { label: 'Resolved', value: 'Resolved', count: complaints.filter((c) => c.status === 'Resolved').length },
  ];

  const renderComplaintItem = ({ item }: { item: Complaint }) => {
    const isCritical = item.severityTier === 'Critical';
    const room = typeof item.roomId === 'object' ? item.roomId : null;
    const roomNumber = item.roomNumberAtSubmission || room?.roomNumber;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ComplaintDetail', { complaintId: item._id })}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title || categoryDisplayLabel(item.category)} complaint`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Ionicons name="construct-outline" size={14} color={COLORS.primary} />
            <Text style={[TYPOGRAPHY.captionSemiBold, styles.categoryText]}>
              {categoryDisplayLabel(item.category)}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <Text style={[TYPOGRAPHY.h3, styles.cardTitle]} numberOfLines={2}>
          {item.title || item.description}
        </Text>

        <Text style={[TYPOGRAPHY.bodySmall, styles.cardSnippet]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.roomRow}>
          <Ionicons name="bed-outline" size={14} color={COLORS.textMuted} />
          <Text style={[TYPOGRAPHY.caption, styles.dateText]}>
            {roomNumber ? `Room ${roomNumber}` : 'Room not recorded'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerTags}>
            <SeverityChip level={item.severityTier} />

            {isCritical && item.blockchainRef ? (
              <View style={styles.auditPill}>
                <Ionicons name="shield-outline" size={12} color={COLORS.info} />
                <Text style={[TYPOGRAPHY.smallBadge, styles.auditPillText]}>Audit record available</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.footerDate}>
            <Text style={[TYPOGRAPHY.caption, styles.dateText]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer style={styles.screen}>
      <AppHeader
        title="My Complaints"
        subtitle="View and track your submitted complaints"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          canCreateComplaint ? (
            <TouchableOpacity
              style={styles.newButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('NewComplaint')}
              accessibilityRole="button"
              accessibilityLabel="File a new complaint"
            >
              <Ionicons name="add" size={20} color={COLORS.textInverse} />
              <Text style={[TYPOGRAPHY.captionSemiBold, styles.newButtonText]}>New</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <SegmentedControl items={filters} value={selectedStatus} onChange={setSelectedStatus} accessibilityLabel="Filter complaints by status" style={styles.filterRow} />

      {isComplaintsLoading ? (
        <LoadingState message="Loading your complaints..." />
      ) : isComplaintsError && !response ? (
        <ErrorState
          title="Unable to Load Complaints"
          message="Your complaint history could not be retrieved. Check your connection and try again."
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item._id}
          renderItem={renderComplaintItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isComplaintsLoading}
              onRefresh={() => { void refetch(); }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="construct-outline"
              title={
                selectedStatus === 'ALL'
                  ? 'No Complaints Filed'
                  : `No ${selectedStatus === 'InReview' ? 'In Review' : selectedStatus === 'AwaitingAdminVerification' ? 'Awaiting Admin Verification' : selectedStatus} Complaints`
              }
              description={
                selectedStatus === 'ALL'
                  ? canCreateComplaint
                    ? 'If you experience any issues with water, electricity, room maintenance, or cleanliness, report them here.'
                    : 'Your complaint history from your previous stay will appear here.'
                  : 'There are no complaints matching this status filter.'
              }
              actionTitle={selectedStatus === 'ALL' && canCreateComplaint ? 'File a Complaint' : undefined}
              onAction={
                selectedStatus === 'ALL' && canCreateComplaint
                  ? () => navigation.navigate('NewComplaint')
                  : undefined
              }
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  newButton: {
    minHeight: 48,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  newButtonText: {
    color: COLORS.textInverse,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
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
    marginBottom: SPACING.sm,
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
  cardTitle: {
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSnippet: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    flexShrink: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.sm,
  },
  footerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  auditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  auditPillText: {
    color: COLORS.info,
    fontWeight: '600',
  },
  footerDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  dateText: {
    color: COLORS.textMuted,
  },
});
