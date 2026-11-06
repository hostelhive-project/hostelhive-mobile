import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Platform } from 'react-native';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { COLORS } from '../../theme/colors';
import { RADIUS } from '../../theme/radius';
import { SPACING } from '../../theme/spacing';

export const SkeletonBox: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}> = ({ width = '100%', height = 16, borderRadius = RADIUS.sm, style }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const reduceMotion = useMotionPreference();

  useEffect(() => {
    if (reduceMotion) { opacity.setValue(0.65); return; }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: COLORS.surfaceSubtle,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const HostelCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <SkeletonBox height={160} borderRadius={RADIUS.lg} />
      <View style={styles.cardContent}>
        <SkeletonBox width="70%" height={20} />
        <SkeletonBox width="45%" height={14} style={{ marginTop: 6 }} />
        <View style={styles.row}>
          <SkeletonBox width="30%" height={16} />
          <SkeletonBox width="25%" height={20} borderRadius={RADIUS.full} />
        </View>
      </View>
    </View>
  );
};

export const TaskCardSkeleton: React.FC = () => {
  return (
    <View style={styles.taskContainer}>
      <View style={styles.row}>
        <SkeletonBox width="40%" height={20} />
        <SkeletonBox width="25%" height={18} borderRadius={RADIUS.full} />
      </View>
      <SkeletonBox width="60%" height={14} style={{ marginTop: 8 }} />
      <SkeletonBox width="100%" height={36} borderRadius={RADIUS.md} style={{ marginTop: 12 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
  },
  cardContent: {
    paddingTop: SPACING.md,
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  taskContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
});

