import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { AppIcon } from '../common/AppIcon';
import { ReviewRating } from './ReviewRating';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import type { Review } from '../../types/api';

export function HostelReviewCard({ review, isOwn = false }: { review: Review; isOwn?: boolean }) {
  const name = typeof review.residentId === 'object' ? review.residentId?.name?.trim() : undefined;
  const date = new Date(review.createdAt);
  const dateLabel = Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={[styles.card, isOwn && styles.ownCard]}>
      <View style={styles.header}>
        <Avatar name={name || 'Resident'} size={40} />
        <View style={styles.identity}>
          <Text style={[TYPOGRAPHY.bodySemiBold, styles.name]}>{name || 'Resident (name unavailable)'}</Text>
          <Text style={[TYPOGRAPHY.caption, styles.date]}>{dateLabel}</Text>
        </View>
        {isOwn && <View style={styles.ownBadge}><AppIcon name="checkmark-circle" size={14} color={COLORS.successText} /><Text style={[TYPOGRAPHY.captionSemiBold, styles.ownLabel]}>Your review</Text></View>}
      </View>
      <ReviewRating rating={review.rating} />
      {review.comment?.trim() ? <Text style={[TYPOGRAPHY.body, styles.comment]}>{review.comment}</Text> : <Text style={[TYPOGRAPHY.bodySmall, styles.date]}>No written feedback provided.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder, gap: SPACING.md, ...SHADOWS.subtle },
  ownCard: { borderColor: COLORS.successBorder, backgroundColor: COLORS.successLight },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.sm },
  identity: { flex: 1, minWidth: 120 },
  name: { color: COLORS.textPrimary },
  date: { color: COLORS.textSecondary, marginTop: 2 },
  ownBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.successBorder },
  ownLabel: { color: COLORS.successText },
  comment: { color: COLORS.textPrimary },
});
