import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StaffTabParamList, StaffStackParamList } from './types';
import { StaffTasksScreen } from '../screens/staff/StaffTasksScreen';
import { StaffTaskDetailScreen } from '../screens/staff/StaffTaskDetailScreen';
import { StaffComplaintsScreen } from '../screens/staff/StaffComplaintsScreen';
import { StaffComplaintDetailScreen } from '../screens/staff/StaffComplaintDetailScreen';
import { StaffNotificationsScreen } from '../screens/staff/StaffNotificationsScreen';
import { StaffProfileScreen } from '../screens/staff/StaffProfileScreen';
import { useGetUnreadCountQuery } from '../services/notificationApi';

import { useMobileTabOptions } from './mobileTabOptions';

const Tab = createBottomTabNavigator<StaffTabParamList>();
const Stack = createNativeStackNavigator<StaffStackParamList>();

const StaffTabs: React.FC = () => {
  const tabOptions = useMobileTabOptions();
  const { data: countRes } = useGetUnreadCountQuery();
  const unreadCount = countRes?.data?.count || 0;
  const onTabPress = () => ({ tabPress: () => { void Haptics.selectionAsync().catch(() => undefined); } });

  return (
    <Tab.Navigator
      initialRouteName="TasksTab"
      screenOptions={({ route }) => tabOptions(route.name)}
    >
      <Tab.Screen
        name="TasksTab"
        component={StaffTasksScreen}
        listeners={onTabPress}
      />
      <Tab.Screen
        name="ComplaintsTab"
        component={StaffComplaintsScreen}
        listeners={onTabPress}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={StaffNotificationsScreen}
        listeners={onTabPress}
        options={{
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={StaffProfileScreen}
        listeners={onTabPress}
      />
    </Tab.Navigator>
  );
};

export const StaffNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="StaffTabs" component={StaffTabs} />
      <Stack.Screen name="TaskDetail" component={StaffTaskDetailScreen} />
      <Stack.Screen name="StaffComplaintDetail" component={StaffComplaintDetailScreen} />
    </Stack.Navigator>
  );
};
