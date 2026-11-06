import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { AppIcon as Ionicons } from './AppIcon';
import { AppModal } from '../ui/AppModal';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { RADIUS, SPACING } from '../../constants/layout';
import { COUNTRIES, CountryInfo, DEFAULT_COUNTRY } from '../../utils/phoneUtils';

export interface PhoneInputWithCountryProps {
  label?: string;
  required?: boolean;
  value: string;
  country?: CountryInfo;
  onChangeText: (text: string) => void;
  onSelectCountry?: (country: CountryInfo) => void;
  error?: string | null;
  helperText?: string;
  containerStyle?: ViewStyle;
  disabled?: boolean;
  showValidityBadge?: boolean;
  isValid?: boolean;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  label,
  required = false,
  value,
  country = DEFAULT_COUNTRY,
  onChangeText,
  onSelectCountry,
  error,
  helperText,
  containerStyle,
  disabled = false,
  showValidityBadge = false,
  isValid = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (selected: CountryInfo) => {
    onSelectCountry?.(selected);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label Row */}
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[TYPOGRAPHY.captionSemiBold, styles.label]}>
            {label}
            {required && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          {showValidityBadge && isValid && (
            <View style={styles.validBadge}>
              <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
              <Text style={styles.validBadgeText}>Valid number</Text>
            </View>
          )}
        </View>
      ) : null}

      {/* Input Group */}
      <View
        style={[
          styles.inputGroup,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        {/* Country Selector Pill */}
        <TouchableOpacity
          style={styles.countryButton}
          activeOpacity={0.7}
          disabled={disabled}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Country code, ${country.name}, ${country.dialCode}`}
          accessibilityHint="Opens the country code picker"
          accessibilityState={{ disabled, expanded: modalVisible }}
        >
          <Text style={styles.flagText}>{country.flag}</Text>
          <Text style={styles.dialCodeText}>{country.dialCode}</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* National Number Input */}
        <TextInput
          style={[TYPOGRAPHY.body, styles.textInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={country.example || '300 1234567'}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={`${label || 'Phone number'}${required ? ', required' : ''}`}
          accessibilityHint={error || helperText || `Enter your phone number without the ${country.dialCode} country code`}
          accessibilityState={{ disabled }}
        />
      </View>

      {/* Error or Helper Text */}
      {error ? (
        <Text style={[TYPOGRAPHY.caption, styles.errorText]}>{error}</Text>
      ) : helperText ? (
        <Text style={[TYPOGRAPHY.caption, styles.helperText]}>{helperText}</Text>
      ) : null}

      {/* Country Selection Modal */}
      <AppModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setSearchQuery(''); }}
        title="Select country"
        subtitle="Choose your phone country code"
        scrollable={false}
        containerStyle={styles.countryPickerSheet}
      >
        <View style={styles.countryPickerBody}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search country name or code"
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              accessibilityLabel="Search countries"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Clear country search"
              >
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.code === country.code;
              return (
                <TouchableOpacity
                  style={[styles.countryItem, isSelected && styles.countryItemSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityLabel={`${item.name}, ${item.dialCode}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <View style={styles.countryItemInfo}>
                    <Text style={[TYPOGRAPHY.bodySemiBold, styles.countryItemName]}>
                      {item.name}
                    </Text>
                    <Text style={[TYPOGRAPHY.caption, styles.countryItemDialCode]}>
                      {item.dialCode}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={[TYPOGRAPHY.caption, styles.emptyListText]}>No countries found</Text>
              </View>
            }
          />
        </View>
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    color: COLORS.textPrimary,
  },
  requiredStar: {
    color: COLORS.error,
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    gap: 3,
  },
  validBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 48,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.surfaceSubtle,
    opacity: 0.7,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    gap: 4,
  },
  flagText: {
    fontSize: 18,
  },
  dialCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.inputBorder,
    marginHorizontal: SPACING.xs,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    paddingVertical: 0,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  helperText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  countryPickerBody: { flex: 1, minHeight: 0 },
  countryPickerSheet: { height: '90%' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    height: 40,
    gap: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.inputBorder,
  },
  countryItemSelected: {
    backgroundColor: '#F0F7FF',
  },
  countryItemFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  countryItemInfo: {
    flex: 1,
  },
  countryItemName: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  countryItemDialCode: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  emptyList: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyListText: {
    color: COLORS.textMuted,
  },
});
