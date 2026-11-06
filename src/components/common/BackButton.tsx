import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { AppIcon as Ionicons } from './AppIcon';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { RADIUS } from '../../theme/radius';

export interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  color?: string;
  size?: number;
}

/**
 * Standardized HostelHive mobile back button.
 * A quiet circular navigation control with a 48px touch target.
 */
export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  style,
  accessibilityLabel = 'Go back',
  color = COLORS.textPrimary,
  size = 20,
}) => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      const current = navigation.getState?.()?.routeNames || [];
      if (current.includes('StudentTabs')) navigation.navigate('StudentTabs', { screen: 'StayTab' });
      else if (current.includes('StaffTabs')) navigation.navigate('StaffTabs');
      else if (current.includes('Login')) navigation.navigate('Login');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="arrow-back" size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

