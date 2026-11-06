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
import { StatusBadge } from '../../components/common/StatusBadge';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { useGetMyTasksQuery } from '../../services/cleaningTaskApi';
import type { CleaningTask, CleaningTaskStatus, CleaningTaskType, CleaningTaskRoom } from '../../types/cleaningTask';

type FilterTab = 'All' | 'InProgress' | 'Scheduled' | 'Delayed' | 'Completed';

const STATUS_PRIORITY: Record<CleaningTaskStatus, number> = {
  InProgress: 1,
  Delayed: 2,
  Scheduled: 3,
  Completed: 4,
};

const TYPE_CONFIG: Record<
  CleaningTaskType,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  Routine: { label: 'Routine', icon: 'sparkles-outline', color: COLORS.primary },
  DeepClean: { label: 'Deep Clean', icon: 'water-outline', color: COLORS.info },
  Emergency: { label: 'Emergency', icon: 'flash-outline', color: COLORS.error },
};

export const StaffTasksScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('All');

  const { data: tasksRes, isLoading, isFetching, error, refetch } = useGetMyTasksQuery();
  const rawTasks = tasksRes?.data || [];

  // Filter and Sort Tasks
  const filteredAndSortedTasks = useMemo(() => {
    let list = [...rawTasks];

    // Filter
    if (selectedFilter !== 'All') {
      list = list.filter((t) => t.status === selectedFilter);
    }

    // Sort: InProgress (1) -> Delayed (2) -> Scheduled (3) -> Completed (4)
    // Within same status: earliest scheduled first
    list.sort((a, b) => {
      const pA = STATUS_PRIORITY[a.status] || 5;
      const pB = STATUS_PRIORITY[b.status] || 5;
      if (pA !== pB) return pA - pB;

      const tA = new Date(a.scheduledTime).getTime();
      const tB = new Date(b.scheduledTime).getTime();
      return tA - tB;
    });

    return list;
  }, [rawTasks, selectedFilter]);

  const countsByStatus = useMemo(() => {
    const counts = { All: rawTasks.length, InProgress: 0, Scheduled: 0, Delayed: 0, Completed: 0 };
    rawTasks.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status] += 1;
      }
    });
    return counts;
  }, [rawTasks]);

  const completedTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return rawTasks.filter((task) => task.completedAt && new Date(task.completedAt).toDateString() === today).length;
  }, [rawTasks]);

  const renderTaskCard = ({ item }: { item: CleaningTask }) => {
    const room = (typeof item.roomId === 'object' ? item.roomId : {}) as CleaningTaskRoom;
    const typeCfg = TYPE_CONFIG[item.taskType] || TYPE_CONFIG.Routine;

    const scheduledDate = new Date(item.scheduledTime);
    const isToday = new Date().toDateString() === scheduledDate.toDateString();

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
        accessibilityRole="button"
        accessibilityLabel={`Open ${typeCfg.label.toLowerCase()} task for room ${room.roomNumber || 'not recorded'}`}
      >
        {/* Top Row: Room & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.roomInfo}>
            <Text style={styles.roomNumber}>Room {room.roomNumber || '—'}</Text>
            {room.floor !== undefined && (
              <Text style={styles.floorText}>Floor {room.floor} {room.layoutType ? `• ${room.layoutType}` : ''}</Text>
            )}
          </View>

          <StatusBadge status={item.status} />
        </View>

        {/* Middle Row: Task Type & Scheduled Time */}
        <View style={styles.cardBody}>
          <View style={styles.typeRow}>
            <Ionicons name={typeCfg.icon} size={14} color={typeCfg.color} style={{ marginRight: 4 }} />
            <Text style={[styles.typeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
          </View>

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.timeText}>
              {isToday ? 'Today, ' : `${scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}, `}
              {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Delay Reason Callout */}
        {item.status === 'Delayed' && item.delayReason && (
          <View style={styles.cardDelayBox}>
            <Ionicons name="alert-circle-outline" size={13} color={COLORS.error} />
            <Text style={styles.cardDelayText} numberOfLines={2}>
              Delayed: {item.delayReason}
            </Text>
          </View>
        )}

        {/* Footer: Photos & Action arrow */}
        <View style={styles.cardFooter}>
          <View style={styles.footerIndicators}>
            {item.afterImageUri && (
              <View style={styles.photoIndicator}>
                <Ionicons name="image" size={12} color={COLORS.success} />
                <Text style={styles.photoIndicatorText}>Proof attached</Text>
              </View>
            )}
          </View>

          <View style={styles.actionArrow}>
            <Text style={styles.viewDetailsText}>View task</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filterItems = [
    { label: 'All', value: 'All' as const, count: countsByStatus.All },
    { label: 'In progress', value: 'InProgress' as const, count: countsByStatus.InProgress },
    { label: 'Scheduled', value: 'Scheduled' as const, count: countsByStatus.Scheduled },
    { label: 'Delayed', value: 'Delayed' as const, count: countsByStatus.Delayed },
    { label: 'Completed', value: 'Completed' as const, count: countsByStatus.Completed },
  ];

  return (
    <ScreenContainer>
      <AppHeader
        title="Cleaning Tasks"
        subtitle="Manage assigned housekeeping duties"
        rightAction={
          <TouchableOpacity
            onPress={() => { void refetch(); }}
            disabled={isFetching}
            style={styles.refreshButton}
            accessibilityRole="button"
            accessibilityLabel={isFetching ? 'Refreshing tasks' : 'Refresh tasks'}
            accessibilityState={{ disabled: isFetching, busy: isFetching }}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        }
      />

      {!isLoading && !error ? (
        <>
          <Text style={styles.todayLabel}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
          <View style={styles.summaryRow} accessibilityLabel="Task summary">
            <View style={styles.summaryTile}>
              <Text style={styles.summaryValue}>{countsByStatus.Scheduled}</Text>
              <Text style={styles.summaryLabel}>Scheduled</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryValue}>{countsByStatus.InProgress}</Text>
              <Text style={styles.summaryLabel}>In progress</Text>
            </View>
            <View style={[styles.summaryTile, styles.summaryTileSuccess]}>
              <Text style={[styles.summaryValue, styles.summaryValueSuccess]}>{completedTodayCount}</Text>
              <Text style={[styles.summaryLabel, styles.summaryLabelSuccess]}>Done today</Text>
            </View>
          </View>
        </>
      ) : null}

      <SegmentedControl items={filterItems} value={selectedFilter} onChange={setSelectedFilter} accessibilityLabel="Filter cleaning tasks" style={styles.filterScroll} />

      {isLoading ? (
        <LoadingState message="Loading your assigned tasks..." />
      ) : error ? (
        <ErrorState
          title="Could Not Load Tasks"
          message="Unable to fetch your assigned housekeeping tasks. Please check your connection."
          onRetry={refetch}
        />
      ) : filteredAndSortedTasks.length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title={
            selectedFilter === 'All'
              ? 'No Tasks Assigned'
              : `No ${selectedFilter === 'InProgress' ? 'In-Progress' : selectedFilter} Tasks`
          }
          description={
            selectedFilter === 'All'
              ? 'You do not currently have any cleaning or maintenance tasks assigned.'
              : `You have no cleaning tasks currently marked as ${selectedFilter}.`
          }
        />
      ) : (
        <FlatList
          data={filteredAndSortedTasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTaskCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => { void refetch(); }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  summaryTile: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  summaryTileSuccess: { backgroundColor: '#ecfdf5', borderColor: '#cee5d9' },
  summaryValue: { ...TYPOGRAPHY.h3, color: COLORS.primary, fontVariant: ['tabular-nums'] },
  summaryValueSuccess: { color: '#047857' },
  summaryLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  summaryLabelSuccess: { color: COLORS.successText },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    gap: 8,
  },
  listContainer: {
    paddingHorizontal: SPACING.xl,
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
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  roomInfo: {
    flex: 1,
    minWidth: 120,
  },
  roomNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  floorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  cardBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSubtle,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    ...TYPOGRAPHY.captionSemiBold,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  timeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  cardDelayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs,
    gap: 4,
  },
  cardDelayText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.errorText,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSubtle,
  },
  footerIndicators: {
    flexDirection: 'row',
    flexShrink: 1,
    alignItems: 'center',
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  photoIndicatorText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.success,
  },
  actionArrow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  viewDetailsText: {
    ...TYPOGRAPHY.buttonSmall,
    color: COLORS.primary,
  },
});
