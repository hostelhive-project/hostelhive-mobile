import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '../components/common/AppIcon';
import { COLORS, navigationTokens as nav } from '../theme/tokens';

const destinations: Record<string, { label: string; icon: AppIconName }> = {
  HomeTab: { label: 'Home', icon: 'home-outline' },
  ExploreTab: { label: 'Explore', icon: 'compass-outline' },
  StayTab: { label: 'My Stay', icon: 'bed-outline' },
  TasksTab: { label: 'Tasks', icon: 'clipboard-outline' },
  ComplaintsTab: { label: 'Complaints', icon: 'chatbox-ellipses-outline' },
  NotificationsTab: { label: 'Alerts', icon: 'notifications-outline' },
  ProfileTab: { label: 'Profile', icon: 'person-outline' },
};

export function useMobileTabOptions() {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const labelGrowth = Math.max(0, fontScale - 1) * nav.labelLineHeight;

  return (routeName: string): BottomTabNavigationOptions => {
    const destination = destinations[routeName];
    return {
      headerShown: false,
      tabBarHideOnKeyboard: true,
      tabBarLabelPosition: 'below-icon',
      tabBarActiveTintColor: nav.selectedAccent,
      tabBarInactiveTintColor: nav.inactive,
      tabBarAccessibilityLabel: destination.label,
      tabBarStyle: {
        backgroundColor: nav.surface,
        borderTopColor: nav.border,
        borderTopWidth: 1,
        height: nav.barHeight + labelGrowth + insets.bottom,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 6),
        elevation: 0,
        shadowOpacity: 0,
      },
      tabBarItemStyle: { minHeight: nav.minimumTarget, paddingHorizontal: 0 },
      tabBarLabel: ({ focused }) => (
        <Text style={[styles.label, focused && styles.labelSelected]}>{destination.label}</Text>
      ),
      tabBarIcon: ({ focused }) => (
        <View style={[styles.iconFrame, focused && styles.iconSelected]}>
          <AppIcon name={destination.icon} size={nav.iconSize} color={focused ? nav.selectedAccent : nav.inactive} />
        </View>
      ),
      tabBarBadgeStyle: styles.badge,
    };
  };
}

const styles = StyleSheet.create({
  label: { fontFamily: 'Inter_500Medium', fontSize: nav.labelSize, lineHeight: nav.labelLineHeight, color: nav.inactive, textAlign: 'center', marginTop: 2 },
  labelSelected: { fontFamily: 'Inter_600SemiBold', color: nav.selectedAccent },
  iconFrame: { width: nav.iconFrameWidth, height: nav.iconFrameHeight, borderRadius: 10, borderTopWidth: 3, borderTopColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  iconSelected: { backgroundColor: nav.selectedSurface, borderTopColor: nav.selectedAccent },
  badge: { backgroundColor: COLORS.danger, color: COLORS.textInverse, fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 14, minWidth: 18, minHeight: 18, paddingHorizontal: 4, borderRadius: 10, borderWidth: 2, borderColor: nav.surface },
});
