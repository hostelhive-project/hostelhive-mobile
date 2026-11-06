import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../common/AppIcon';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';

/** Individual review ratings are whole stars; the numeric score stays explicit. */
export function ReviewRating({ rating }: { rating: number }) {
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return <Text style={[TYPOGRAPHY.caption, styles.unavailable]}>Rating unavailable</Text>;
  }

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${rating} out of 5 stars`} style={styles.row}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <AppIcon key={star} name={star <= rating ? 'star' : 'star-outline'} size={18} color={star <= rating ? COLORS.warning : COLORS.textMuted} />
        ))}
      </View>
      <Text style={[TYPOGRAPHY.bodySemiBold, styles.score]}>{rating}<Text style={[TYPOGRAPHY.caption, styles.unavailable]}> / 5</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.sm },
  stars: { flexDirection: 'row', gap: 3 },
  score: { color: COLORS.textPrimary },
  unavailable: { color: COLORS.textSecondary },
});
