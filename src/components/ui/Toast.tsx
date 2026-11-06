import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon as Ionicons } from '../common/AppIcon';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { RADIUS } from '../../theme/radius';
import { SHADOWS } from '../../theme/shadows';
import { AppModal } from './AppModal';
import { SecondaryButton } from '../common/SecondaryButton';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      showToast: () => {},
      hideToast: () => {},
    };
  }
  return context;
};

// Global reference for calling toast from non-React components (e.g., utils/dialog.ts)
let globalToastHandler: ((opts: ToastOptions) => void) | null = null;
export const triggerGlobalToast = (opts: ToastOptions) => {
  if (globalToastHandler) {
    globalToastHandler(opts);
  }
};

const ICONS: Record<ToastType, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string; border: string }> = {
  success: {
    name: 'checkmark-circle',
    color: COLORS.success,
    bg: COLORS.successLight,
    border: COLORS.successBorder,
  },
  error: {
    name: 'alert-circle',
    color: COLORS.error,
    bg: COLORS.errorLight,
    border: COLORS.errorBorder,
  },
  warning: {
    name: 'warning',
    color: COLORS.warning,
    bg: COLORS.warningLight,
    border: COLORS.warningBorder,
  },
  info: {
    name: 'information-circle',
    color: COLORS.info,
    bg: COLORS.infoLight,
    border: COLORS.infoBorder,
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [details, setDetails] = useState<ToastOptions | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (opts: ToastOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(opts);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = opts.duration ?? 3500;
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    },
    [translateY, opacity, hideToast]
  );

  React.useEffect(() => {
    globalToastHandler = showToast;
    return () => {
      globalToastHandler = null;
    };
  }, [showToast]);

  const type = toast?.type || 'info';
  const cfg = ICONS[type];

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            {
              top: Math.max(insets.top + SPACING.xs, 12),
              transform: [{ translateY }],
              opacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={[styles.card, { borderColor: cfg.border }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.name} size={22} color={cfg.color} />
            </View>
            <View style={styles.content}>
              <Text style={[TYPOGRAPHY.h4, styles.title]} numberOfLines={1}>
                {toast.title}
              </Text>
              {toast.message ? (
                <Text style={[TYPOGRAPHY.caption, styles.message]} numberOfLines={2}>
                  {toast.message}
                </Text>
              ) : null}
              {(toast.type === 'error' || (toast.message?.length ?? 0) > 90) && (
                <Pressable accessibilityRole="button" accessibilityLabel="Read full message" style={{ minHeight: 44, justifyContent: 'center' }} onPress={() => { setDetails(toast); hideToast(); }}>
                  <Text style={[TYPOGRAPHY.buttonSmall, { color: COLORS.primary }]}>View details</Text>
                </Pressable>
              )}
            </View>
            <Pressable onPress={hideToast} style={styles.closeBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Dismiss notification">
              <Ionicons name="close" size={16} color={COLORS.textMuted} />
            </Pressable>
          </View>
        </Animated.View>
      )}
      <AppModal visible={Boolean(details)} onClose={() => setDetails(null)} title={details?.title || 'Message details'}>
        <Text selectable style={[TYPOGRAPHY.body, { color: COLORS.textPrimary, marginBottom: SPACING.lg }]}>{details?.message}</Text>
        <SecondaryButton title="Close" onPress={() => setDetails(null)} />
      </AppModal>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.floating,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
  },
  message: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});

