import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { AppIcon as Ionicons } from '../common/AppIcon';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import type { Hostel } from '../../types/api';

interface HostelCardProps {
  hostel: Hostel;
  onPress: () => void;
}

export const HostelCard: React.FC<HostelCardProps> = ({ hostel, onPress }) => {
  const [imageError, setImageError] = useState(false);

  const displayImageUri =
    !imageError && (hostel.bannerImage?.trim() || hostel.images?.[0]?.trim() || null);

  const visibleFacilities = hostel.facilities?.slice(0, 3) || [];
  const extraFacilitiesCount = (hostel.facilities?.length || 0) - visibleFacilities.length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${hostel.name}, located at ${hostel.location}. Starting from PKR ${hostel.priceTier} per month.`}
    >
      {/* Property Image or Fallback */}
      <View style={[styles.imageContainer, !displayImageUri && styles.imageContainerEmpty]}>
        {displayImageUri ? (
          <Image
            source={{ uri: displayImageUri }}
            style={styles.image}
            contentFit="cover"
            transition={180}
            cachePolicy="memory-disk"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="business" size={44} color={COLORS.textMuted} />
            <Text style={[TYPOGRAPHY.caption, styles.fallbackText]}>Student Accommodation</Text>
          </View>
        )}

        {/* Rating Badge Overlay */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={13} color="#EAB308" />
          <Text style={[TYPOGRAPHY.captionSemiBold, styles.ratingText]}>
            {hostel.ratingAvg > 0 ? hostel.ratingAvg.toFixed(1) : 'New'}
          </Text>
        </View>

        {/* Review Count Tag if reviews exist */}
        {hostel.reviewCount > 0 && (
          <View style={styles.reviewBadge}>
            <Text style={[TYPOGRAPHY.caption, styles.reviewText]}>
              {hostel.reviewCount} {hostel.reviewCount === 1 ? 'review' : 'reviews'}
            </Text>
          </View>
        )}
      </View>

      {/* Property Details */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[TYPOGRAPHY.h3, styles.title]} numberOfLines={2} ellipsizeMode="tail">
            {hostel.name}
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={15} color={COLORS.primaryLight} />
          <Text style={[TYPOGRAPHY.caption, styles.locationText]} numberOfLines={1}>
            {hostel.location}
          </Text>
        </View>

        {/* Facilities Chips */}
        {visibleFacilities.length > 0 && (
          <View style={styles.facilitiesRow}>
            {visibleFacilities.map((fac, idx) => (
              <View key={`${fac}-${idx}`} style={styles.facilityPill}>
                <Text style={styles.facilityText} numberOfLines={1}>
                  {fac}
                </Text>
              </View>
            ))}
            {extraFacilitiesCount > 0 && (
              <View style={styles.extraPill}>
                <Text style={styles.extraText}>+{extraFacilitiesCount}</Text>
              </View>
            )}
          </View>
        )}

        {/* Price & Action Footer */}
        <View style={styles.footerRow}>
          <View>
            <Text style={[TYPOGRAPHY.caption, styles.priceLabel]}>Starting from</Text>
            <Text style={[TYPOGRAPHY.h3, styles.priceValue]}>
              PKR {hostel.priceTier?.toLocaleString() || '—'}
              <Text style={styles.perMonthText}> / mo</Text>
            </Text>
          </View>

          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Rooms</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.card} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  imageContainer: {
    height: undefined,
    width: '100%',
    backgroundColor: COLORS.surfaceSubtle,
    position: 'relative',
    aspectRatio: 1.8,
  },
  imageContainerEmpty: { aspectRatio: undefined, height: 120 },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    gap: 6,
  },
  fallbackText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  ratingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  ratingText: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  reviewBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(11, 18, 32, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  reviewText: {
    color: COLORS.textInverse,
    fontSize: 11,
  },
  content: {
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: COLORS.textPrimary,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 4,
  },
  locationText: {
    color: COLORS.textSecondary,
    flex: 1,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  facilityPill: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    maxWidth: '100%',
  },
  facilityText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  extraPill: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  extraText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSubtle,
    paddingTop: SPACING.md,
    marginTop: 2,
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  priceLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  priceValue: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  perMonthText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  viewButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 4,
    minHeight: 48,
  },
  viewButtonText: {
    ...TYPOGRAPHY.buttonSmall, color: COLORS.textInverse, flexShrink: 1, textAlign: 'center',
  },
});

