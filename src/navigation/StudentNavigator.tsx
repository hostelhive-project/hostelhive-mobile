import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StudentTabParamList, StudentStackParamList } from './types';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { ExploreScreen } from '../screens/student/ExploreScreen';
import { StayScreen } from '../screens/student/StayScreen';
import { NotificationsScreen } from '../screens/student/NotificationsScreen';
import { ProfileScreen } from '../screens/student/ProfileScreen';
import { HostelDetailsScreen } from '../screens/student/HostelDetailsScreen';
import { RoomsScreen } from '../screens/student/RoomsScreen';
import { ReviewsScreen } from '../screens/student/ReviewsScreen';
import { HouseRulesScreen } from '../screens/student/HouseRulesScreen';
import { RoomPreviewScreen } from '../screens/student/RoomPreviewScreen';
import { BookingApplicationScreen } from '../screens/student/BookingApplicationScreen';
import { ComplaintsScreen } from '../screens/student/ComplaintsScreen';
import { NewComplaintScreen } from '../screens/student/NewComplaintScreen';
import { ComplaintDetailScreen } from '../screens/student/ComplaintDetailScreen';
import { InvoicesScreen } from '../screens/student/InvoicesScreen';
import { InvoiceDetailScreen } from '../screens/student/InvoiceDetailScreen';
import { ChatbotScreen } from '../screens/student/ChatbotScreen';
import { useGetUnreadCountQuery } from '../services/notificationApi';

import { useMobileTabOptions } from './mobileTabOptions';

const Tab = createBottomTabNavigator<StudentTabParamList>();
const Stack = createNativeStackNavigator<StudentStackParamList>();

const StudentTabs: React.FC = () => {
  const tabOptions = useMobileTabOptions();
  const { data: countRes } = useGetUnreadCountQuery();
  const unreadCount = countRes?.data?.count || 0;
  const onTabPress = () => ({ tabPress: () => { void Haptics.selectionAsync().catch(() => undefined); } });

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => tabOptions(route.name)}
    >
      <Tab.Screen
        name="HomeTab"
        component={StudentHomeScreen}
        listeners={onTabPress}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreScreen}
        listeners={onTabPress}
      />
      <Tab.Screen
        name="StayTab"
        component={StayScreen}
        listeners={onTabPress}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        listeners={onTabPress}
        options={{
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        listeners={onTabPress}
      />
    </Tab.Navigator>
  );
};

export const StudentNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="StudentTabs" component={StudentTabs} />
      <Stack.Screen name="HostelDetails" component={HostelDetailsScreen} />
      <Stack.Screen name="Rooms" component={RoomsScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="HouseRules" component={HouseRulesScreen} />
      <Stack.Screen name="BookingApplication" component={BookingApplicationScreen} />
      <Stack.Screen name="RoomPreview" component={RoomPreviewScreen} />
      <Stack.Screen name="Complaints" component={ComplaintsScreen} />
      <Stack.Screen name="NewComplaint" component={NewComplaintScreen} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
      <Stack.Screen name="Invoices" component={InvoicesScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
    </Stack.Navigator>
  );
};

