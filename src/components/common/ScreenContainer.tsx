import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { OfflineBanner } from '../feedback/OfflineBanner';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  withKeyboardAvoid?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  withKeyboardAvoid = false,
  refreshing = false,
  onRefresh,
}) => {
  const insets = useSafeAreaInsets();

  const content = scrollable ? (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 24) },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical={Boolean(onRefresh)}
      refreshControl={onRefresh ? (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
          progressBackgroundColor={COLORS.surface}
        />
      ) : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, { paddingBottom: insets.bottom }, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <OfflineBanner />
      {withKeyboardAvoid ? (
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    maxWidth: '100%',
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
  },
});

