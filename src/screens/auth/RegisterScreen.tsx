import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { showDialog } from '../../utils/dialog';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppTextInput } from '../../components/common/AppTextInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import {
  useRegisterStudentMutation,
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from '../../services/authApi';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { secureStorage } from '../../utils/secureStorage';
import { PhoneInputWithCountry } from '../../components/common/PhoneInputWithCountry';
import { AuthBrandPanel } from '../../components/common/AuthBrandPanel';
import { OTPInput } from '../../components/common/OTPInput';
import { Stepper } from '../../components/ui/Stepper';
import {
  CountryInfo,
  DEFAULT_COUNTRY,
  validateAndFormatPhone,
} from '../../utils/phoneUtils';
import { extractErrorMessage } from '../../utils/error';
import { OTP_EXPIRY_MS, formatOtpTime, useOtpCountdown } from '../../hooks/useOtpCountdown';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryInfo>(DEFAULT_COUNTRY);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const otpSecondsRemaining = useOtpCountdown(otpExpiresAt);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationError, setVerificationError] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const dispatch = useAppDispatch();
  const [registerMutation, { isLoading }] = useRegisterStudentMutation();
  const [verifyEmailMutation, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [resendVerificationMutation, { isLoading: isResending }] = useResendVerificationMutation();

  const validate = () => {
    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      errs.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errs.name = 'Name must be at least 2 characters long.';
    }

    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (trimmedPhone) {
      const phoneRes = validateAndFormatPhone(trimmedPhone, phoneCountry.code);
      if (!phoneRes.isValid) {
        errs.phone = phoneRes.error || 'Please enter a valid phone number.';
      }
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (!termsAccepted) {
      errs.terms = 'Please accept the terms and privacy policy to continue.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    let normalizedPhone: string | undefined = undefined;
    if (phone.trim()) {
      const phoneRes = validateAndFormatPhone(phone.trim(), phoneCountry.code);
      if (phoneRes.isValid && phoneRes.e164) {
        normalizedPhone = phoneRes.e164;
      }
    }

    try {
      const response = await registerMutation({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: normalizedPhone,
        termsAccepted: true,
      }).unwrap();

      if (response.success && response.data) {
        setVerificationRequired(true);
        setOtp('');
        setOtpExpiresAt(Date.now() + OTP_EXPIRY_MS);
        setVerificationMessage(`We sent a 6-digit code to ${response.data.email}.`);
        setVerificationError('');
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, 'Failed to create student account.');
      const status = (err as { status?: number })?.status;
      if (status === 503) {
        setVerificationRequired(true);
        setOtpExpiresAt(null);
        setVerificationMessage('Your account is pending email verification. Resend a code when email delivery is available.');
        setVerificationError(errorMsg);
      } else {
        showDialog('Registration Failed', errorMsg);
      }
    }
  };

  const handleVerifyEmail = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setVerificationError('Enter the 6-digit code sent to your email.');
      return;
    }
    setVerificationError('');
    try {
      const response = await verifyEmailMutation({ email: email.trim().toLowerCase(), otp }).unwrap();
      if (!response.success || !response.data) return;
      const { user, accessToken, refreshToken } = response.data;
      await secureStorage.saveTokens(accessToken, refreshToken);
      await secureStorage.saveCachedUser(user);
      dispatch(setCredentials({ user, accessToken, refreshToken }));
    } catch (err: unknown) {
      setVerificationError(extractErrorMessage(err, 'Could not verify the code.'));
    }
  };

  const handleResendCode = async () => {
    setVerificationError('');
    try {
      await resendVerificationMutation({ email: email.trim().toLowerCase() }).unwrap();
      setOtp('');
      setOtpExpiresAt(Date.now() + OTP_EXPIRY_MS);
      setVerificationMessage('If this account is awaiting verification, a new code has been sent.');
    } catch (err: unknown) {
      setVerificationError(extractErrorMessage(err, 'Could not resend the code.'));
    }
  };

  return (
    <ScreenContainer scrollable withKeyboardAvoid contentContainerStyle={styles.container}>
      <AuthBrandPanel showBack onBack={() => navigation.goBack()} />
      <View style={styles.card}>
        <Text accessibilityRole="header" style={[TYPOGRAPHY.h1, styles.title]}>
          {verificationRequired ? 'Verify your email' : 'Create your account'}
        </Text>
        <Text style={[TYPOGRAPHY.body, styles.description]}>
          {verificationRequired ? 'One final step to start your student account.' : 'Find a hostel and manage your stay in one place.'}
        </Text>
        <Stepper steps={['Your details', 'Verify email']} currentIndex={verificationRequired ? 1 : 0} />
        {verificationRequired ? (
          <>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, marginBottom: SPACING.md }]}>
              {verificationMessage || `Enter the verification code sent to ${email}.`}
            </Text>
            {otpExpiresAt !== null ? (
              <Text style={[TYPOGRAPHY.caption, styles.otpCountdown]}>
                {otpSecondsRemaining > 0
                  ? `Code expires in ${formatOtpTime(otpSecondsRemaining)}.`
                  : 'Code expired. Resend a new code.'}
              </Text>
            ) : null}
            <Text style={[TYPOGRAPHY.captionSemiBold, styles.fieldLabel]}>Email verification code</Text>
            <OTPInput
              value={otp}
              onChange={(value) => { setOtp(value); setVerificationError(''); }}
              error={Boolean(verificationError)}
              autoFocus
            />
            {verificationError ? <Text style={[TYPOGRAPHY.caption, styles.formError]}>{verificationError}</Text> : null}
            <PrimaryButton
              title="Verify Email"
              onPress={handleVerifyEmail}
              isLoading={isVerifying}
              disabled={
                isResending ||
                !/^\d{6}$/.test(otp) ||
                (otpExpiresAt !== null && otpSecondsRemaining === 0)
              }
              style={styles.submitButton}
            />
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isResending || otpSecondsRemaining > 0}
              style={styles.resendButton}
              accessibilityRole="button"
              accessibilityState={{ disabled: isResending || otpSecondsRemaining > 0, busy: isResending }}
            >
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.footerLink]}>
                {isResending
                  ? 'Sending code…'
                  : otpSecondsRemaining > 0
                    ? `Resend in ${formatOtpTime(otpSecondsRemaining)}`
                    : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
        <AppTextInput
          label="Full Name *"
          placeholder="e.g. Muhammad Ali"
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          error={errors.name}
          leftIcon={<Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />}
        />

        <AppTextInput
          label="Email Address *"
          placeholder="example@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
          }}
          error={errors.email}
          leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />}
        />

        <PhoneInputWithCountry
          label="Phone Number (optional)"
          value={phone}
          country={phoneCountry}
          onChangeText={(val) => {
            setPhone(val);
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
          }}
          onSelectCountry={setPhoneCountry}
          error={errors.phone}
          showValidityBadge
          isValid={phone.trim().length > 0 && validateAndFormatPhone(phone, phoneCountry.code).isValid}
        />

        <AppTextInput
          label="Password (min 8 characters) *"
          placeholder="••••••••"
          isPassword
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
          }}
          error={errors.password}
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />}
        />

        <AppTextInput
          label="Confirm Password *"
          placeholder="••••••••"
          isPassword
          value={confirmPassword}
          onChangeText={(val) => {
            setConfirmPassword(val);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
          }}
          error={errors.confirmPassword}
          leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textSecondary} />}
        />

        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => {
            setTermsAccepted((accepted) => !accepted);
            if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }));
          }}
          activeOpacity={0.8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAccepted }}
          accessibilityLabel="Accept HostelHive terms and privacy policy"
        >
          <View style={[styles.termsCheckbox, termsAccepted && styles.termsCheckboxChecked]}>
            {termsAccepted ? <Ionicons name="checkmark" size={14} color={COLORS.textInverse} /> : null}
          </View>
          <Text style={[TYPOGRAPHY.caption, styles.termsText]}>
            I agree to HostelHive’s Terms of Service and Privacy Policy.
          </Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: SPACING.sm }}>
          <TouchableOpacity style={{ minHeight: 44, justifyContent: 'center' }} accessibilityRole="link" onPress={() => navigation.navigate('LegalDocument', { kind: 'terms' })}><Text style={[TYPOGRAPHY.bodySemiBold, { color: COLORS.primary }]}>Read Terms of Service</Text></TouchableOpacity>
          <TouchableOpacity style={{ minHeight: 44, justifyContent: 'center' }} accessibilityRole="link" onPress={() => navigation.navigate('LegalDocument', { kind: 'privacy' })}><Text style={[TYPOGRAPHY.bodySemiBold, { color: COLORS.primary }]}>Read Privacy Policy</Text></TouchableOpacity>
        </View>
        {errors.terms ? <Text style={[TYPOGRAPHY.caption, styles.formError]}>{errors.terms}</Text> : null}

        <PrimaryButton
          title="Create Account"
          onPress={handleRegister}
          isLoading={isLoading}
          style={styles.submitButton}
        />
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[TYPOGRAPHY.body, styles.footerText]}>
          Already registered?{' '}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
          style={styles.footerAction}
          accessibilityRole="button"
          accessibilityLabel="Sign in to an existing account"
        >
          <Text style={[TYPOGRAPHY.bodySemiBold, styles.footerLink]}>
            Sign in
          </Text>
        </TouchableOpacity>
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
  title: { color: COLORS.textPrimary, marginBottom: SPACING.sm },
  description: { color: COLORS.textSecondary, marginBottom: SPACING.lg },
  fieldLabel: { color: COLORS.textPrimary, marginBottom: SPACING.sm },
  formError: { color: COLORS.dangerText, marginTop: -SPACING.sm, marginBottom: SPACING.sm },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  resendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: SPACING.md,
  },
  otpCountdown: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    minHeight: 48,
    paddingVertical: SPACING.xs,
  },
  termsCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsCheckboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: SPACING.xs,
    marginTop: SPACING.lg,
  },
  footerAction: { minHeight: 48, justifyContent: 'center' },
  footerText: {
    color: COLORS.textSecondary,
  },
  footerLink: {
    color: COLORS.primary,
  },
});

