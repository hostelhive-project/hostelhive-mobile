import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppIcon } from '../common/AppIcon';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { RADIUS } from '../../theme/radius';
import { SHADOWS } from '../../theme/shadows';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMotionPreference } from '../../hooks/useMotionPreference';

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  scrollable?: boolean;
  containerStyle?: ViewStyle;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  showCloseButton = true,
  scrollable = true,
  containerStyle,
}) => {
  const insets = useSafeAreaInsets();
  const reduceMotion = useMotionPreference();
  const translateY = useSharedValue(520);

  useEffect(() => {
    translateY.value = visible ? withTiming(0, { duration: reduceMotion ? 0 : 220 }) : 520;
  }, [visible, translateY, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const dragGesture = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((event) => {
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 800) {
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: reduceMotion ? 0 : 180 });
      }
    });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardLayer}
        >
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, SPACING.lg) },
              animatedStyle,
              containerStyle,
            ]}
          >
              <GestureDetector gesture={dragGesture}>
                <View style={styles.handleHitArea}>
                <View style={styles.handle} />
                </View>
              </GestureDetector>
              {(title || showCloseButton) && (
                <View style={styles.header}>
                  <View style={styles.headerTitleContainer}>
                    {title ? <Text accessibilityRole="header" style={[TYPOGRAPHY.h3, styles.title]}>{title}</Text> : null}
                    {subtitle ? <Text style={[TYPOGRAPHY.caption, styles.subtitle]}>{subtitle}</Text> : null}
                  </View>
                  {showCloseButton && (
                    <Pressable
                      onPress={onClose}
                      style={styles.closeBtn}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Close sheet"
                    >
                      <AppIcon name="close" size={19} color={COLORS.textSecondary} />
                    </Pressable>
                  )}
                </View>
              )}
              {scrollable ? (
                <ScrollView
                  style={styles.scrollBody}
                  contentContainerStyle={styles.body}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>
              ) : (
                <View style={styles.nonScrollableBody}>{children}</View>
              )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.backdrop },
  keyboardLayer: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    ...SHADOWS.modal,
  },
  handleHitArea: { height: 28, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#c9d2dd' },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  headerTitleContainer: { flex: 1 },
  title: { color: COLORS.textPrimary },
  subtitle: { color: COLORS.textSecondary, marginTop: 3 },
  closeBtn: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  scrollBody: { flexGrow: 0 },
  nonScrollableBody: { flex: 1, minHeight: 180 },
  body: { width: '100%', paddingBottom: SPACING.md },
});
