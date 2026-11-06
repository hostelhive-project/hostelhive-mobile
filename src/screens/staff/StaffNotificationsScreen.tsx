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
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { NotificationToolbar } from '../../components/common/NotificationToolbar';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { showDialog } from '../../utils/dialog';
import {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../services/notificationApi';
import type { AppNotification } from '../../types/notification';

export const StaffNotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const {
    data: notificationsRes,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useListNotificationsQuery(
    filter === 'unread' ? { unreadOnly: true } : undefined
  );

  const { data: countRes, isFetching: isCountFetching, refetch: refetchCount } = useGetUnreadCountQuery();
  const unreadCount = countRes?.data?.count || 0;

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const notifications = useMemo(() => notificationsRes?.data || [], [notificationsRes]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    try {
      await markAllRead().unwrap();
    } catch {
      showDialog('Error', 'Unable to mark all notifications as read.');
    }
  };

  const handleNotificationPress = async (item: AppNotification) => {
    if (!item.isRead) {
      try {
        await markRead(item._id).unwrap();
      } catch {
        // non-blocking
      }
    }

    if (item.type === 'TaskAssigned' && item.relatedEntityId) {
      navigation.navigate('TaskDetail', { taskId: item.relatedEntityId });
    } else if (item.type === 'TaskAssigned') {
      navigation.navigate('TasksTab');
    } else if (item.type === 'ComplaintUpdate') {
      if (item.relatedEntityId) navigation.navigate('StaffComplaintDetail', { complaintId: item.relatedEntityId });
      else navigation.navigate('ComplaintsTab');
    } else {
      showDialog(item.title, item.body);
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.itemCard, !item.isRead && styles.unreadItemCard]}
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.isRead ? "Read" : "Unread"} notification: ${item.title}`}
        accessibilityHint="Open this update and mark it as read."
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={item.type === 'TaskAssigned' ? 'clipboard' : 'notifications'}
          size={20}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text
            style={[styles.itemTitle, !item.isRead && styles.unreadItemTitle]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.itemBody} numberOfLines={3}>
          {item.body}
        </Text>

        <Text style={styles.itemTime}>
          {new Date(item.createdAt).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <AppHeader title="Staff Alerts" subtitle="Duty notices and cleaning assignments" />
      <NotificationToolbar
        filter={filter}
        onFilterChange={setFilter}
        unreadCount={unreadCount}
        isMarkingAll={isMarkingAll}
        onMarkAllRead={handleMarkAllRead}
      />

      {isLoading ? (
        <LoadingState message="Loading staff alerts..." />
      ) : error ? (
        <ErrorState
          title="Unable to load alerts"
          message="Failed to connect to the notification service."
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isFetching || isCountFetching}
              onRefresh={() => { void refetch(); void refetchCount(); }}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title="No Staff Alerts"
              description={
                filter === 'unread'
                  ? 'You have caught up with all staff notifications.'
                  : 'You do not have any operational updates or duty notices at this time.'
              }
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  unreadItemCard: {
    backgroundColor: COLORS.infoLight,
    borderColor: COLORS.infoBorder,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    flexShrink: 0,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  itemTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    flex: 1,
  },
  unreadItemTitle: {
    fontFamily: 'Inter_600SemiBold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    flexShrink: 0,
    marginTop: 6,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  itemBody: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  itemTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
});
