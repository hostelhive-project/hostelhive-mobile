import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { SegmentedControl } from '../ui/SegmentedControl';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface NotificationToolbarProps {
  filter: 'all' | 'unread';
  onFilterChange: (filter: 'all' | 'unread') => void;
  unreadCount: number;
  isMarkingAll: boolean;
  onMarkAllRead: () => void;
}

export function NotificationToolbar({ filter, onFilterChange, unreadCount, isMarkingAll, onMarkAllRead }: NotificationToolbarProps) {
  return (
    <View style={styles.toolbar}>
      <View style={styles.filters}>
        <SegmentedControl
          items={[
            { label: 'All', value: 'all' as const },
            { label: 'Unread', value: 'unread' as const, count: unreadCount },
          ]}
          value={filter}
          onChange={onFilterChange}
          accessibilityLabel="Filter notifications"
        />
      </View>
      {unreadCount > 0 || isMarkingAll ? (
        <Pressable
          onPress={onMarkAllRead}
          disabled={isMarkingAll}
          accessibilityRole="button"
          accessibilityLabel={isMarkingAll ? 'Marking all notifications as read' : 'Mark all notifications as read'}
          accessibilityState={{ disabled: isMarkingAll, busy: isMarkingAll }}
          style={({ pressed }) => [styles.button, (pressed || isMarkingAll) && styles.dimmed]}
        >
          {isMarkingAll ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <AppIcon name="checkmark-done-outline" size={18} color={COLORS.primary} />
          )}
          <Text style={[TYPOGRAPHY.buttonSmall, styles.label]}>{isMarkingAll ? 'Marking…' : 'Mark all read'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  filters: { flexBasis: 160, flexGrow: 1, flexShrink: 1, minWidth: 160, maxWidth: '100%' },
  button: {
    minHeight: 48,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  label: { color: COLORS.primary, flexShrink: 1 },
  dimmed: { opacity: 0.65 },
});
