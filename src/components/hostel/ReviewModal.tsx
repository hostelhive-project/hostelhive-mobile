import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { AppIcon as Ionicons } from '../common/AppIcon';
import { AppModal } from '../ui/AppModal';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS } from '../../constants/layout';
import { useCreateReviewMutation } from '../../services/hostelApi';
import { showDialog } from '../../utils/dialog';

interface ReviewModalProps {
  visible: boolean;
  hostelId: string;
  hostelName: string;
  onClose: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  hostelId,
  hostelName,
  onClose,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [createReview, { isLoading: isSubmitting }] = useCreateReviewMutation();

  const handleClose = () => {
    if (isSubmitting) return;
    setValidationError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setValidationError(null);

    if (!rating || rating < 1 || rating > 5) {
      setValidationError('Please select a rating between 1 and 5 stars.');
      return;
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length > 1000) {
      setValidationError('Review comments cannot exceed 1000 characters.');
      return;
    }

    try {
      const res = await createReview({
        hostelId,
        rating,
        comment: trimmedComment || undefined,
      }).unwrap();

      if (res.success) {
        setComment('');
        setRating(5);
        onClose();
        showDialog(
          'Review Submitted!',
          `Thank you for sharing your experience at ${hostelName}. Your review helps fellow students make informed decisions.`
        );
      }
    } catch (err: any) {
      const status = err?.status;
      let errorMsg = err?.data?.message || err?.message || 'Failed to submit review.';

      if (status === 409) {
        errorMsg = 'You have already reviewed this hostel. Only one review per resident is permitted.';
      } else if (status === 403) {
        errorMsg = 'You can only review a hostel you have checked in to or completed a stay at.';
      }

      setValidationError(errorMsg);
      showDialog('Submission Error', errorMsg);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      title="Write a review"
      subtitle={hostelName}
    >
        <View>
            {/* Star Rating Picker */}
            <View style={styles.ratingSection}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.sectionLabel]}>
                Your Rating
              </Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.7}
                    onPress={() => setRating(star)}
                    disabled={isSubmitting}
                    style={styles.starBtn}
                    accessibilityRole="radio"
                    accessibilityLabel={`${star} out of 5 stars`}
                    accessibilityState={{ selected: star === rating }}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color="#EAB308"
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingFeedback}>
                {rating} / 5 — {RATING_LABELS[rating]}
              </Text>
            </View>

            {/* Comment Input */}
            <View style={styles.commentSection}>
              <View style={styles.commentLabelRow}>
                <Text style={[TYPOGRAPHY.bodySemiBold, styles.sectionLabel]}>
                  Feedback & Experience <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <Text style={styles.counterText}>{comment.length}/1000</Text>
              </View>

              <TextInput
                style={styles.commentInput}
                placeholder="How was the cleanliness, room condition, Wi-Fi speed, and hostel management?"
                placeholderTextColor={COLORS.textMuted}
                value={comment}
                onChangeText={setComment}
                maxLength={1000}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            {validationError && (
              <View accessibilityRole="alert" style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{validationError}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <SecondaryButton title="Cancel" onPress={handleClose} disabled={isSubmitting} style={styles.actionButton} />
              <PrimaryButton title="Submit review" onPress={handleSubmit} isLoading={isSubmitting} style={styles.actionButton} />
            </View>
        </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  ratingSection: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  optionalText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'normal',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginVertical: SPACING.xs,
  },
  starBtn: {
    padding: SPACING.xs,
  },
  ratingFeedback: {
    fontSize: 13,
    fontWeight: '600',
    color: '#854D0E',
    marginTop: 2,
  },
  commentSection: {
    marginBottom: SPACING.lg,
  },
  commentLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  counterText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  commentInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  actionButton: { flex: 1 },
});
