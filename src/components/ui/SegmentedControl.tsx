import { ScrollView, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';

export interface SegmentItem<Value extends string = string> {
  label: string;
  value: Value;
  count?: number;
}

interface SegmentedControlProps<Value extends string> {
  items: SegmentItem<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function SegmentedControl<Value extends string>({ items, value, onChange, style, accessibilityLabel }: SegmentedControlProps<Value>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={[styles.row, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Scroll horizontally to see more filters."
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.label}${item.count === undefined ? '' : `, ${item.count}`}`}
            style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
          >
            <Text style={[TYPOGRAPHY.buttonSmall, styles.label, active && styles.labelActive]}>{item.label}</Text>
            {item.count !== undefined && <View style={[styles.count, active && styles.countActive]}><Text style={[TYPOGRAPHY.micro, styles.countText, active && styles.countTextActive]}>{item.count}</Text></View>}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { width: '100%', maxWidth: '100%', minWidth: 0, alignSelf: 'stretch', flexGrow: 0, flexShrink: 0 },
  row: { alignItems: 'center', gap: SPACING.sm, paddingHorizontal: 1, paddingVertical: 2 },
  chip: { minHeight: 44, flexShrink: 0, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.cardBorder, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  chipActive: { borderColor: '#cbd5e1', backgroundColor: '#edf2f7', ...SHADOWS.none },
  label: { color: COLORS.textSecondary, flexShrink: 0 },
  labelActive: { color: COLORS.primary, fontFamily: 'Inter_600SemiBold' },
  count: { minWidth: 20, minHeight: 20, flexShrink: 0, borderRadius: RADIUS.full, paddingHorizontal: 5, paddingVertical: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceSubtle },
  countActive: { backgroundColor: '#ffffff' },
  countText: { color: COLORS.textSecondary },
  countTextActive: { color: COLORS.primary },
  pressed: { opacity: 0.76 },
});
