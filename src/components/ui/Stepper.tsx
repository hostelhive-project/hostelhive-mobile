import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../common/AppIcon';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface StepperProps { steps: string[]; currentIndex: number; }

export const Stepper: React.FC<StepperProps> = ({ steps, currentIndex }) => (
  <View style={styles.row} accessible accessibilityLabel={`Step ${currentIndex + 1} of ${steps.length}: ${steps[currentIndex]}`}>
    {steps.map((step, index) => {
      const done = index < currentIndex;
      const active = index === currentIndex;
      return (
        <View key={step} style={styles.step}>
          <View style={styles.progress}>
            <View style={[styles.circle, active && styles.activeCircle, done && styles.doneCircle]}>
              {done ? <AppIcon name="checkmark" size={14} color={COLORS.textInverse} /> : <Text style={[TYPOGRAPHY.captionSemiBold, styles.number, active && styles.activeNumber]}>{index + 1}</Text>}
            </View>
            {index < steps.length - 1 ? <View style={[styles.connector, done && styles.connectorDone]} /> : null}
          </View>
          <Text style={[TYPOGRAPHY.captionMedium, styles.label, active && styles.activeLabel, done && styles.doneLabel]}>{step}</Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.xxl, paddingVertical: SPACING.sm },
  step: { flex: 1, minWidth: 0 },
  progress: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  circle: { width: 28, height: 28, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, flexShrink: 0 },
  activeCircle: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  doneCircle: { borderColor: COLORS.success, backgroundColor: COLORS.success },
  number: { color: COLORS.textSecondary },
  activeNumber: { color: COLORS.textInverse },
  label: { color: COLORS.textSecondary, paddingRight: SPACING.sm },
  activeLabel: { color: COLORS.primary },
  doneLabel: { color: COLORS.successText },
  connector: { height: 1, flex: 1, marginHorizontal: SPACING.sm, backgroundColor: COLORS.cardBorder },
  connectorDone: { backgroundColor: COLORS.successBorder },
});
