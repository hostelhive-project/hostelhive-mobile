import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { StudentNavigator } from './StudentNavigator';
import { StaffNavigator } from './StaffNavigator';
import { AdminNoticeScreen } from '../screens/shared/AdminNoticeScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../theme/colors';
import { BrandMark } from '../components/common/AppIcon';
import { TYPOGRAPHY } from '../theme/typography';

const Stack = createNativeStackNavigator<RootStackParamList>();
const ONBOARDING_KEY = 'hostelhive.onboarding.completed.v1';

export const RootNavigator: React.FC = () => {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const [firstLaunch, setFirstLaunch] = useState<boolean | null>(null);
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => {
        if (active) setFirstLaunch(value !== '1');
      })
      .catch(() => {
        if (active) setFirstLaunch(true);
      });
    const timer = setTimeout(() => setSplashElapsed(true), 620);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const completeOnboarding = useCallback(() => {
    setFirstLaunch(false);
    void AsyncStorage.setItem(ONBOARDING_KEY, '1').catch(() => undefined);
  }, []);

  if (!splashElapsed || !isHydrated || firstLaunch === null) return <BrandSplash />;

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'fade' }}
      key={firstLaunch ? 'first-launch' : 'returning-user'}
    >
      {firstLaunch ? (
        <Stack.Screen name="Onboarding">
          {() => <OnboardingScreen onComplete={completeOnboarding} />}
        </Stack.Screen>
      ) : !isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user?.role === 'Student' ? (
        <Stack.Screen name="StudentApp" component={StudentNavigator} />
      ) : user?.role === 'CleaningStaff' ? (
        <Stack.Screen name="StaffApp" component={StaffNavigator} />
      ) : user?.role === 'Admin' ? (
        <Stack.Screen name="AdminNotice" component={AdminNoticeScreen} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

const BrandSplash: React.FC = () => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 460, easing: Easing.out(Easing.quad) });
    scale.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [opacity, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.splash}>
      <StatusBar style="light" />
      <Animated.View style={[styles.splashContent, animatedStyle]}>
        <BrandMark size={82} />
        <Text style={[TYPOGRAPHY.h1, styles.splashTitle]}>HostelHive</Text>
        <Text style={[TYPOGRAPHY.caption, styles.splashSubtitle]}>Student living, in one place.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  splashContent: { alignItems: 'center', gap: 10 },
  splashTitle: { color: '#fff', marginTop: 8 },
  splashSubtitle: { color: '#d5deea' },
});
