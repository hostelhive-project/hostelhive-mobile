import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { AppIcon as Ionicons } from '../common/AppIcon';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { RADIUS } from '../../theme/radius';

export interface PhotoUploadCardProps {
  label: string;
  imageUri?: string | null;
  onPickImage: () => void;
  onRemoveImage?: () => void;
  isLoading?: boolean;
  error?: string;
  helperText?: string;
  style?: ViewStyle;
}

export const PhotoUploadCard: React.FC<PhotoUploadCardProps> = ({
  label,
  imageUri,
  onPickImage,
  onRemoveImage,
  isLoading = false,
  error,
  helperText,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text style={[TYPOGRAPHY.captionSemiBold, styles.label]}>{label}</Text>
        {imageUri && !isLoading ? (
          <TouchableOpacity
            onPress={onPickImage}
            activeOpacity={0.7}
            style={styles.changeButton}
            accessibilityRole="button"
            accessibilityLabel={`Change ${label}`}
          >
            <Text style={[TYPOGRAPHY.captionSemiBold, styles.changeText]}>Change</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" accessibilityLabel={label} />
          {isLoading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color={COLORS.surface} size="large" />
              <Text style={[TYPOGRAPHY.captionSemiBold, styles.uploadingText]}>Uploading...</Text>
            </View>
          )}
          {onRemoveImage && !isLoading && (
            <TouchableOpacity
              style={styles.deleteBadge}
              onPress={onRemoveImage}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label}`}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadBox, Boolean(error) && styles.uploadBoxError]}
          onPress={onPickImage}
          disabled={isLoading}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Upload ${label}`}
          accessibilityHint={helperText || 'Take a photo or choose from your gallery.'}
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={[TYPOGRAPHY.caption, styles.mutedText]}>Preparing image...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.uploadTitle]}>Upload Photo</Text>
              <Text style={[TYPOGRAPHY.caption, styles.uploadSubtitle]}>
                {helperText || 'Tap to take a photo or select from gallery'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
          <Text accessibilityRole="alert" style={[TYPOGRAPHY.caption, styles.errorText]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  label: {
    color: COLORS.textPrimary,
    flex: 1,
  },
  changeButton: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center', marginLeft: SPACING.sm },
  changeText: {
    color: COLORS.primary,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight + '20',
  },
  emptyContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  uploadTitle: {
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  uploadSubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  mutedText: {
    color: COLORS.textMuted,
  },
  previewContainer: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 25, 44, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  uploadingText: {
    color: COLORS.textInverse,
  },
  deleteBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  errorText: {
    color: COLORS.danger,
    flex: 1,
  },
});
