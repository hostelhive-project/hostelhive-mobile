import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { AuthBrandPanel } from '../../components/common/AuthBrandPanel';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppTextInput } from '../../components/common/AppTextInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { useLoginMutation } from '../../services/authApi';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { secureStorage } from '../../utils/secureStorage';
import { extractErrorMessage } from '../../utils/error';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const dispatch = useAppDispatch();
  const [loginMutation, { isLoading }] = useLoginMutation();

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    setFormError('');
    if (!validate()) return;

    try {
      const response = await loginMutation({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;

        // 1. Securely persist tokens and user profile
        await secureStorage.saveTokens(accessToken, refreshToken);
        await secureStorage.saveCachedUser(user);

        // 2. Dispatch credentials to Redux store (drives root role decision)
        dispatch(
          setCredentials({
            user,
            accessToken,
            refreshToken,
          })
        );
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, 'Failed to sign in. Please check your credentials.');
      setFormError(errorMsg);
    }
  };

  return (
    <ScreenContainer scrollable withKeyboardAvoid contentContainerStyle={styles.container}>
      <AuthBrandPanel />

      {/* Login Card */}
      <View style={styles.card}>
        <Text accessibilityRole="header" style={[TYPOGRAPHY.h1, styles.title]}>Welcome back</Text>
        <Text style={[TYPOGRAPHY.body, styles.subtitle]}>
          Sign in with your registered email.
        </Text>
        {formError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
            <Text style={[TYPOGRAPHY.captionMedium, styles.errorBannerText]}>{formError}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <AppTextInput
            label="Email Address"
            placeholder="example@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              setFormError('');
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />}
          />

          <AppTextInput
            label="Password"
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              setFormError('');
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() })}
            activeOpacity={0.7}
            style={styles.forgotPassword}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <Text style={[TYPOGRAPHY.bodySemiBold, styles.footerLink]}>Forgot password?</Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Sign in"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.submitButton}
          />
        </View>
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={[TYPOGRAPHY.body, styles.footerText]}>
            Don't have a student account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
            style={styles.footerAction}
            accessibilityRole="button"
            accessibilityLabel="Create a student account"
          >
            <Text style={[TYPOGRAPHY.bodySemiBold, styles.footerLink]}>
              Sign up
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('ActivateStaffInvite', { email: email.trim() })}
          activeOpacity={0.7}
          style={styles.staffInviteLink}
          accessibilityRole="button"
          accessibilityLabel="Activate staff invitation"
        >
          <Text style={[TYPOGRAPHY.bodySemiBold, styles.footerLink]}>
            Activate a staff invitation
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
    justifyContent: 'flex-start',
  },
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
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  errorBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, padding: SPACING.md, marginBottom: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.dangerBorder, backgroundColor: COLORS.dangerLight },
  errorBannerText: { color: COLORS.dangerText, flex: 1 },
  form: {
    marginTop: 0,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    minHeight: 48,
    justifyContent: 'center',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.xs,
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: SPACING.xs,
  },
  footerAction: { minHeight: 48, justifyContent: 'center' },
  staffInviteLink: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footerLink: {
    color: COLORS.primary,
    textAlign: 'center',
  },
});

