import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SeverityChip, StatusBadge } from '../../components/common/StatusBadge';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { COLORS } from '../../constants/colors';
import { RADIUS, SHADOWS, SPACING } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';
import { useGetAssignedComplaintsQuery } from '../../services/complaintApi';
import type { Complaint, ComplaintStatus } from '../../types/complaint';
import { categoryDisplayLabel } from '../../types/complaint';

type FilterStatus = 'ALL' | ComplaintStatus;

export const StaffComplaintsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('ALL');
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAssignedComplaintsQuery();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const complaints = useMemo(() => response?.data || [], [response]);
  const filteredComplaints = useMemo(
    () =>
      selectedStatus === 'ALL'
        ? complaints
        : complaints.filter((complaint) => complaint.status === selectedStatus),
    [complaints, selectedStatus]
  );

  const filters: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'All', value: 'ALL', count: complaints.length },
    { label: 'Submitted', value: 'Submitted', count: complaints.filter((item) => item.status === 'Submitted').length },
    { label: 'In Review', value: 'InReview', count: complaints.filter((item) => item.status === 'InReview').length },
    { label: 'Awaiting verification', value: 'AwaitingAdminVerification', count: complaints.filter((item) => item.status === 'AwaitingAdminVerification').length },
    { label: 'Resolved', value: 'Resolved', count: complaints.filter((item) => item.status === 'Resolved').length },
  ];

  const renderComplaint = ({ item }: { item: Complaint }) => {
    const resident = typeof item.residentId === 'object' ? item.residentId : null;
    const hostel = typeof item.hostelId === 'object' ? item.hostelId : null;
    const room = typeof item.roomId === 'object' ? item.roomId : null;
    const roomNumber = item.roomNumberAtSubmission || room?.roomNumber;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('StaffComplaintDetail', { complaintId: item._id })}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.severityTier} severity complaint`}
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

        <Text style={[TYPOGRAPHY.h3, styles.title]} numberOfLines={2}>
          {item.title || item.description}
        </Text>
        <Text style={[TYPOGRAPHY.body, styles.description]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.roomRow}>
          <Ionicons name="bed-outline" size={14} color={COLORS.textMuted} />
          <Text style={[TYPOGRAPHY.caption, styles.secondaryText]}>
            {roomNumber ? `Room ${roomNumber}` : 'Room not recorded'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metadata}>
            <SeverityChip level={item.severityTier} />
            {resident?.name ? (
              <Text style={[TYPOGRAPHY.caption, styles.residentText]} numberOfLines={2}>
                From {resident.name}
              </Text>
            ) : null}
          </View>
          <View style={styles.dateRow}>
            <Text style={[TYPOGRAPHY.caption, styles.secondaryText]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </View>
        </View>
        {hostel?.name ? (
          <Text style={[TYPOGRAPHY.caption, styles.hostelText]} numberOfLines={2}>
            {hostel.name}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer style={styles.screen}>
      <AppHeader
        title="Assigned Complaints"
        subtitle="Issues assigned to you by hostel administration"
      />

      <SegmentedControl items={filters} value={selectedStatus} onChange={setSelectedStatus} accessibilityLabel="Filter assigned complaints by status" style={styles.filterRow} />

      {isLoading && !response ? (
        <LoadingState message="Loading assigned complaints..." />
      ) : isError && !response ? (
        <ErrorState
          title="Unable to Load Complaints"
          message="Your assigned complaints could not be retrieved. Check your connection and try again."
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item._id}
          renderItem={renderComplaint}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { void refetch(); }} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="construct-outline"
              title={selectedStatus === 'ALL' ? 'No Assigned Complaints' : `No ${filters.find((filter) => filter.value === selectedStatus)?.label} Complaints`}
              description={
                selectedStatus === 'ALL'
                  ? 'Complaints assigned to you by the hostel administrator will appear here.'
                  : 'There are no assigned complaints with this status.'
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    maxWidth: '100%',
  },
  categoryText: {
    color: COLORS.primary,
    flexShrink: 1,
  },
  title: {
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  description: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
    paddingTop: SPACING.md,
  },
  metadata: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  secondaryText: {
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  residentText: { color: COLORS.textSecondary, flexShrink: 1 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginLeft: 'auto',
  },
  hostelText: {
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});
