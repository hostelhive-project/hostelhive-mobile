import React, { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
  label?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, error = false, autoFocus = false, label = 'Email verification code' }) => {
  const refs = useRef<Array<{ focus: () => void } | null>>([]);
  const digits = value.slice(0, 6).padEnd(6, ' ').split('').map((digit) => /\d/.test(digit) ? digit : '');

  const updateDigit = (index: number, input: string) => {
    const incoming = input.replace(/\D/g, '');
    const next = [...digits];
    const start = incoming.length === 6 ? 0 : index;
    if (!incoming) next[index] = '';
    else incoming.slice(0, 6 - start).split('').forEach((digit, offset) => { next[start + offset] = digit; });
    onChange(next.map((digit) => digit || ' ').join('').trimEnd());
    if (incoming) refs.current[Math.min(start + incoming.length, 5)]?.focus();
  };

  return (
    <View style={styles.group} accessibilityLabel={label}>
      {Array.from({ length: 6 }, (_, index) => (
        <TextInput
          key={index}
          ref={(ref) => { refs.current[index] = ref; }}
          style={[TYPOGRAPHY.h3, styles.box, error && styles.errorBox]}
          value={digits[index] || ''}
          onChangeText={(text) => updateDigit(index, text)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
              const next = [...digits];
              next[index - 1] = '';
              onChange(next.map((digit) => digit || ' ').join('').trimEnd());
              refs.current[index - 1]?.focus();
            }
          }}
          keyboardType="number-pad"
          maxLength={6}
          textContentType={index === 0 ? 'oneTimeCode' : undefined}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          importantForAutofill={index === 0 ? 'yes' : 'no'}
          autoFocus={autoFocus && index === 0}
          selectTextOnFocus
          accessibilityLabel={`${label}, digit ${index + 1} of 6`}
          accessibilityHint="Enter one digit. You can paste the full six-digit code."
          returnKeyType={index === 5 ? 'done' : 'next'}
          onSubmitEditing={() => refs.current[Math.min(index + 1, 5)]?.focus()}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  group: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm, marginBottom: SPACING.md },
  box: { flex: 1, minWidth: 0, height: 54, padding: 0, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, color: COLORS.primary, textAlign: 'center', fontVariant: ['tabular-nums'] },
  errorBox: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight },
});
