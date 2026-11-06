import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../common/AppIcon';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, semantic } from '../../theme';
import type { RoomTypeSummary } from '../../services/hostelApi';
import type { RoomLayoutType } from '../../types/api';

export const ROOM_TYPE_LABELS: Record<RoomLayoutType, string> = {
  Single: 'Single room',
  'Shared-2': '2-sharing room',
  'Shared-4': '4-sharing room',
};

export function RoomTypeCard({ summary, onPress }: { summary: RoomTypeSummary; onPress: () => void }) {
  const available = summary.availableRooms > 0;
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      accessibilityLabel={`${ROOM_TYPE_LABELS[summary.layoutType]}, ${summary.availableRooms} of ${summary.totalRooms} rooms available, ${summary.availableBeds} beds available. View rooms.`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}>
      <View style={styles.top}>
        <View style={styles.icon}><AppIcon name="bed-outline" size={22} color={COLORS.primary} /></View>
        <View style={styles.heading}>
          <Text style={[TYPOGRAPHY.h3, styles.title]}>{ROOM_TYPE_LABELS[summary.layoutType]}</Text>
          <Text style={[TYPOGRAPHY.caption, styles.muted]}>{summary.totalRooms} {summary.totalRooms === 1 ? 'room' : 'rooms'} in this layout</Text>
        </View>
        <AppIcon name="chevron-forward" size={19} color={COLORS.textSecondary} />
      </View>
      <View style={styles.bottom}>
        <View style={styles.heading}>
          <Text style={[TYPOGRAPHY.caption, styles.muted]}>{available ? 'Starting rent / month' : 'Availability'}</Text>
          <Text style={[TYPOGRAPHY.bodySemiBold, styles.title]}>
            {summary.startingRent !== null ? `PKR ${summary.startingRent.toLocaleString()}` : 'No beds available'}
          </Text>
        </View>
        <View style={[styles.availability, !available && styles.full]}>
          <Text style={[TYPOGRAPHY.captionSemiBold, { color: available ? semantic.success.foreground : COLORS.textSecondary }]}>
            {summary.availableBeds} {summary.availableBeds === 1 ? 'bed' : 'beds'} available
          </Text>
          <Text style={[TYPOGRAPHY.caption, styles.muted]}>{summary.availableRooms} of {summary.totalRooms} rooms</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: SPACING.lg, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface },
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  icon: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, gap: 3 },
  title: { color: COLORS.textPrimary },
  muted: { color: COLORS.textSecondary },
  bottom: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.cardBorder, paddingTop: SPACING.md },
  availability: { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.md, backgroundColor: semantic.success.background, gap: 2 },
  full: { backgroundColor: COLORS.surfaceSubtle },
});
