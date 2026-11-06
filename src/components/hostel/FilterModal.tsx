import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { AppIcon as Ionicons } from '../common/AppIcon';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS } from '../../constants/layout';
import { PrimaryButton } from '../common/PrimaryButton';
import { SecondaryButton } from '../common/SecondaryButton';
import type { HostelSearchParams } from '../../types/api';
import { AppModal } from '../ui/AppModal';

// Canonical HostelHive property amenities from registered backend properties
export const HOSTEL_FACILITY_OPTIONS = [
  'High-Speed Wi-Fi',
  'Air Conditioning',
  'Power Backup',
  'Laundry Facility',
];

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: HostelSearchParams;
  onApply: (filters: HostelSearchParams) => void;
}

const PRICE_PRESETS = [
  { label: 'Any Budget', value: undefined },
  { label: 'Up to 15k', value: 15000 },
  { label: 'Up to 25k', value: 25000 },
  { label: 'Up to 35k', value: 35000 },
  { label: 'Up to 50k', value: 50000 },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  initialFilters,
  onApply,
}) => {
  const [location, setLocation] = useState(initialFilters.location || '');
  const [maxPrice, setMaxPrice] = useState<number | undefined>(initialFilters.maxPrice);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    Array.isArray(initialFilters.facilities)
      ? initialFilters.facilities
      : initialFilters.facilities
      ? [initialFilters.facilities]
      : []
  );

  useEffect(() => {
    if (!visible) return;
    setLocation(initialFilters.location || '');
    setMaxPrice(initialFilters.maxPrice);
    setSelectedFacilities(
      Array.isArray(initialFilters.facilities)
        ? initialFilters.facilities
        : initialFilters.facilities
          ? [initialFilters.facilities]
          : []
    );
  }, [visible, initialFilters]);

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const handleReset = () => {
    setLocation('');
    setMaxPrice(undefined);
    setSelectedFacilities([]);
  };

  const handleApply = () => {
    onApply({
      location: location.trim() || undefined,
      maxPrice: maxPrice !== undefined && !isNaN(maxPrice) ? maxPrice : undefined,
      facilities: selectedFacilities.length > 0 ? selectedFacilities : undefined,
    });
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Filter hostels"
      subtitle="Narrow your results by area, budget, and amenities."
      containerStyle={styles.sheetContainer}
    >
        <View style={styles.content}>
            {/* Location Section */}
            <View style={styles.section}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.sectionTitle]}>
                Location / Area
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. F-8, Blue Area, Johar Town"
                  placeholderTextColor={COLORS.textMuted}
                  value={location}
                  onChangeText={setLocation}
                  accessibilityLabel="Filter by location or area"
                />
                {location.length > 0 && (
                  <TouchableOpacity onPress={() => setLocation('')} accessibilityRole="button" accessibilityLabel="Clear location filter" style={styles.clearLocation}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Price Tier Ceiling */}
            <View style={styles.section}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.sectionTitle]}>
                Maximum Monthly Budget (PKR)
              </Text>
              <View style={styles.chipRow}>
                {PRICE_PRESETS.map((preset) => {
                  const isSelected = maxPrice === preset.value;
                  return (
                    <TouchableOpacity
                      key={preset.label}
                      style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                      onPress={() => setMaxPrice(preset.value)}
                      activeOpacity={0.7}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isSelected && styles.presetChipTextSelected,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Facilities Filter */}
            <View style={styles.section}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.sectionTitle]}>
                Required Amenities & Facilities
              </Text>
              <View style={styles.facilitiesContainer}>
                {HOSTEL_FACILITY_OPTIONS.map((facility) => {
                  const isSelected = selectedFacilities.includes(facility);
                  return (
                    <TouchableOpacity
                      key={facility}
                      style={[
                        styles.facilityChip,
                        isSelected && styles.facilityChipSelected,
                      ]}
                      onPress={() => toggleFacility(facility)}
                      activeOpacity={0.7}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse'}
                        size={16}
                        color={isSelected ? COLORS.textInverse : COLORS.textSecondary}
                      />
                      <Text
                        style={[
                          styles.facilityChipText,
                          isSelected && styles.facilityChipTextSelected,
                        ]}
                      >
                        {facility}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          {/* Sheet Actions */}
          <View style={styles.footer}>
            <View style={styles.resetButtonWrapper}>
              <SecondaryButton title="Reset All" onPress={handleReset} />
            </View>
            <View style={styles.applyButtonWrapper}>
              <PrimaryButton title="Apply Filters" onPress={handleApply} />
            </View>
          </View>
        </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    paddingHorizontal: SPACING.sm,
  },
  content: {
    paddingVertical: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  textInput: {
    minWidth: 0,
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clearLocation: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  presetChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  presetChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  presetChipTextSelected: {
    color: COLORS.textInverse,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityChip: {
    minHeight: 44,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 6,
  },
  facilityChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  facilityChipText: {
    flexShrink: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  facilityChipTextSelected: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  resetButtonWrapper: {
    flex: 1,
  },
  applyButtonWrapper: {
    flex: 1.5,
  },
});
