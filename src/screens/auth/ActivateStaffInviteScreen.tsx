import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppTextInput } from '../../components/common/AppTextInput';
import { AuthBrandPanel } from '../../components/common/AuthBrandPanel';
import { OTPInput } from '../../components/common/OTPInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { COLORS } from '../../constants/colors';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';
import { useActivateStaffInviteMutation, useResendVerificationMutation } from '../../services/authApi';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { secureStorage } from '../../utils/secureStorage';
import { extractErrorMessage } from '../../utils/error';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ActivateStaffInvite'>;

export const ActivateStaffInviteScreen: React.FC<Props> = ({ navigation, route }) => {
  const [email, setEmail] = useState(route.params?.email?.trim() || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const [activateInvite, { isLoading: isActivating }] = useActivateStaffInviteMutation();
  const [resendCode, { isLoading: isResending }] = useResendVerificationMutation();

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  const handleActivate = async () => {
    if (!isEmailValid) {
      setError('Enter the email address where the staff invitation was sent.');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    try {
      const response = await activateInvite({
        email: normalizedEmail,
        otp,
        newPassword: password,
      }).unwrap();

      if (!response.success || !response.data) return;
      const { user, accessToken, refreshToken } = response.data;
      await secureStorage.saveTokens(accessToken, refreshToken);
      await secureStorage.saveCachedUser(user);
      dispatch(setCredentials({ user, accessToken, refreshToken }));
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Could not activate this staff account.'));
    }
  };

  const handleResend = async () => {
    if (!isEmailValid) {
      setError('Enter a valid email address first.');
      return;
    }
    setError('');
    try {
      await resendCode({ email: normalizedEmail }).unwrap();
      setOtp('');
      setMessage('If a staff invitation is waiting for verification, a code has been sent.');
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Could not request another code.'));
    }
  };

  return (
    <ScreenContainer scrollable withKeyboardAvoid contentContainerStyle={styles.container}>
      <AuthBrandPanel showBack onBack={() => navigation.goBack()} />

      <View style={styles.card}>
        <Text accessibilityRole="header" style={[TYPOGRAPHY.h1, styles.title]}>Activate staff account</Text>
        <Text style={[TYPOGRAPHY.body, styles.description]}>
          Use the invitation sent by your hostel admin to join the team.
        </Text>

        <AppTextInput
          label="Email Address"
          placeholder="example@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError('');
          }}
          leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />}
        />

        <Text style={[TYPOGRAPHY.captionSemiBold, styles.fieldLabel]}>Email verification code</Text>
        <OTPInput value={otp} onChange={(value) => { setOtp(value); setError(''); }} error={Boolean(error)} />
        <Text style={[TYPOGRAPHY.caption, styles.helper]}>
          Codes expire after 90 seconds. If yours expired, request a new one.
        </Text>

        <View style={styles.passwordSection}>
          <Text accessibilityRole="header" style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Choose your password</Text>
          <Text style={[TYPOGRAPHY.caption, styles.sectionDescription]}>Your email and password are confirmed together when you activate.</Text>
        </View>

        <AppTextInput
          label="Create Password"
          placeholder="At least 8 characters"
          isPassword
          autoCapitalize="none"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError('');
          }}
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />}
        />

        <AppTextInput
          label="Confirm Password"
          placeholder="Re-enter your password"
          isPassword
          autoCapitalize="none"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setError('');
          }}
          leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textSecondary} />}
        />

        {message ? <Text style={[TYPOGRAPHY.caption, styles.message]}>{message}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={[TYPOGRAPHY.caption, styles.error]}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleResend}
          disabled={isResending || isActivating}
          activeOpacity={0.7}
          style={styles.resendButton}
          accessibilityRole="button"
          accessibilityState={{ disabled: isResending || isActivating, busy: isResending }}
        >
          <Text style={[TYPOGRAPHY.bodySemiBold, styles.link]}>
            {isResending ? 'Sending code…' : 'Resend verification code'}
          </Text>
        </TouchableOpacity>

        <PrimaryButton
          title="Verify and Activate"
          onPress={handleActivate}
          isLoading={isActivating}
          disabled={isResending}
          style={styles.submitButton}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  fieldLabel: { color: COLORS.textPrimary, marginBottom: SPACING.sm },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  passwordSection: { borderTopWidth: 1, borderTopColor: COLORS.cardBorder, paddingTop: SPACING.xl, marginTop: SPACING.sm, marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.textPrimary, marginBottom: SPACING.xs },
  sectionDescription: { color: COLORS.textSecondary },
  title: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  helper: {
    color: COLORS.textSecondary,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  message: {
    color: COLORS.success,
    marginTop: SPACING.xs,
  },
  error: {
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  resendButton: {
    alignSelf: 'flex-end',
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  link: {
    color: COLORS.primary,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
});
