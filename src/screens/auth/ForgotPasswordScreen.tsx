import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppTextInput } from '../../components/common/AppTextInput';
import { AuthBrandPanel } from '../../components/common/AuthBrandPanel';
import { OTPInput } from '../../components/common/OTPInput';
import { Stepper } from '../../components/ui/Stepper';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { COLORS } from '../../constants/colors';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { TYPOGRAPHY } from '../../constants/typography';
import { useRequestPasswordResetMutation, useResetPasswordMutation } from '../../services/authApi';
import { extractErrorMessage } from '../../utils/error';
import { showDialog } from '../../utils/dialog';
import { OTP_EXPIRY_MS, formatOtpTime, useOtpCountdown } from '../../hooks/useOtpCountdown';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const [email, setEmail] = useState(route.params?.email?.trim() || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const otpSecondsRemaining = useOtpCountdown(otpExpiresAt);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [requestCode, { isLoading: isRequesting }] = useRequestPasswordResetMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const requestResetCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    try {
      await requestCode({ email: normalizedEmail }).unwrap();
      setEmail(normalizedEmail);
      setCodeRequested(true);
      setOtp('');
      setOtpExpiresAt(Date.now() + OTP_EXPIRY_MS);
      setMessage('If an account exists for this email, a reset code has been sent.');
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Could not request a reset code.'));
    }
  };

  const submitNewPassword = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    try {
      await resetPassword({ email, otp, newPassword }).unwrap();
      showDialog('Password Reset', 'Your password has been updated. Sign in with your new password.');
      navigation.replace('Login');
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Could not reset your password.'));
    }
  };

  return (
    <ScreenContainer scrollable withKeyboardAvoid contentContainerStyle={styles.container}>
      <AuthBrandPanel showBack onBack={() => navigation.goBack()} />

      <View style={styles.card}>
        <Text accessibilityRole="header" style={[TYPOGRAPHY.h1, styles.title]}>
          {codeRequested ? 'Create a new password' : 'Reset your password'}
        </Text>
        <Text style={[TYPOGRAPHY.body, styles.description]}>
          {codeRequested
            ? message
            : 'Enter your registered email address and we will send you a reset code.'}
        </Text>

        <Stepper steps={['Email address', 'Code & password']} currentIndex={codeRequested ? 1 : 0} />

        <AppTextInput
          label="Email Address"
          placeholder="example@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!codeRequested}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError('');
          }}
          leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />}
        />

        {codeRequested ? (
          <>
            <Text style={[TYPOGRAPHY.captionSemiBold, styles.fieldLabel]}>Reset code</Text>
            <OTPInput value={otp} onChange={(value) => { setOtp(value); setError(''); }} error={Boolean(error)} autoFocus />
            <Text style={[TYPOGRAPHY.caption, styles.otpCountdown]}>
              {otpSecondsRemaining > 0
                ? `Code expires in ${formatOtpTime(otpSecondsRemaining)}.`
                : 'Code expired. Request a new code.'}
            </Text>
            <AppTextInput
              label="New Password"
              placeholder="At least 8 characters"
              isPassword
              autoCapitalize="none"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                setError('');
              }}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />}
            />
            <AppTextInput
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              isPassword
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setError('');
              }}
              leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textSecondary} />}
            />

            <TouchableOpacity
              onPress={requestResetCode}
              disabled={isRequesting || otpSecondsRemaining > 0}
              activeOpacity={0.7}
              style={styles.resendButton}
              accessibilityRole="button"
              accessibilityState={{ disabled: isRequesting || otpSecondsRemaining > 0, busy: isRequesting }}
            >
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.link]}>
                {isRequesting
                  ? 'Sending code…'
                  : otpSecondsRemaining > 0
                    ? `Resend in ${formatOtpTime(otpSecondsRemaining)}`
                    : 'Resend reset code'}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        {error ? <Text accessibilityRole="alert" style={[TYPOGRAPHY.caption, styles.error]}>{error}</Text> : null}

        <PrimaryButton
          title={codeRequested ? 'Reset Password' : 'Send Reset Code'}
          onPress={codeRequested ? submitNewPassword : requestResetCode}
          isLoading={codeRequested ? isResetting : isRequesting}
          disabled={
            codeRequested &&
            (isRequesting || (otpExpiresAt !== null && otpSecondsRemaining === 0))
          }
          style={styles.submitButton}
        />
      </View>

      <TouchableOpacity onPress={() => navigation.replace('Login')} activeOpacity={0.7} style={styles.signInLink} accessibilityRole="button" accessibilityLabel="Return to sign in">
        <Text style={[TYPOGRAPHY.body, styles.footerText]}>Remembered your password? </Text>
        <Text style={[TYPOGRAPHY.bodySemiBold, styles.link]}>Sign in</Text>
      </TouchableOpacity>
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
  title: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  resendButton: {
    alignSelf: 'flex-end',
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  otpCountdown: {
    color: COLORS.textSecondary,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  error: {
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  signInLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    minHeight: 48,
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  link: {
    color: COLORS.primary,
  },
});
