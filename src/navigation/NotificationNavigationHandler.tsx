import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { baseApi } from '../services/baseApi';
import { useMarkNotificationReadMutation } from '../services/notificationApi';
import { subscribeToNotificationEvents } from '../utils/pushNotifications';
import { navigationRef } from './navigationRef';

export function NotificationNavigationHandler({ navigationVersion }: { navigationVersion: number }) {
  const { user, isAuthenticated, isHydrated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [markRead] = useMarkNotificationReadMutation();
  const [pending, setPending] = useState<{ key: string; data: Record<string, unknown> } | null>(null);
  const handled = useRef(new Set<string>());
  useEffect(() => subscribeToNotificationEvents((key, data) => setPending({ key, data }), () => {
    dispatch(baseApi.util.invalidateTags(['Notification', 'Complaint', 'CleaningTask', 'Invoice', 'Booking']));
  }), [dispatch]);

  useEffect(() => {
    if (!pending || !isHydrated || !isAuthenticated || !user || !navigationRef.isReady()) return;
    const app = user.role === 'Student' ? 'StudentApp' : user.role === 'CleaningStaff' ? 'StaffApp' : null;
    if (!app || !navigationRef.getRootState()?.routeNames.includes(app)) return;
    let active = true;
    void (async () => {
      if (handled.current.has(pending.key)) return;
      const storageKey = `hostelhive.push.last.${user._id}`;
      const previous = await AsyncStorage.getItem(storageKey).catch(() => null);
      if (!active) return;
      if (previous === pending.key || (pending.data.userId && pending.data.userId !== user._id)) {
        setPending(null); return;
      }
      handled.current.add(pending.key);
      const id = typeof pending.data.relatedEntityId === 'string' && /^[a-f\d]{24}$/i.test(pending.data.relatedEntityId) ? pending.data.relatedEntityId : null;
      const type = pending.data.type;
      if (app === 'StaffApp') {
        if (type === 'ComplaintUpdate' && id) navigationRef.navigate('StaffApp', { screen: 'StaffComplaintDetail', params: { complaintId: id } });
        else if (type === 'TaskAssigned' && id) navigationRef.navigate('StaffApp', { screen: 'TaskDetail', params: { taskId: id } });
        else navigationRef.navigate('StaffApp', { screen: 'StaffTabs', params: { screen: 'NotificationsTab' } });
      } else {
        if (type === 'ComplaintUpdate' && id) navigationRef.navigate('StudentApp', { screen: 'ComplaintDetail', params: { complaintId: id } });
        else if (type === 'RentDue') navigationRef.navigate('StudentApp', { screen: 'Invoices' });
        else if (type === 'BookingUpdate') navigationRef.navigate('StudentApp', { screen: 'StudentTabs', params: { screen: 'StayTab' } });
        else navigationRef.navigate('StudentApp', { screen: 'StudentTabs', params: { screen: 'NotificationsTab' } });
      }
      if (typeof pending.data.notificationId === 'string') void markRead(pending.data.notificationId);
      void AsyncStorage.setItem(storageKey, pending.key).catch(() => undefined);
      setPending(null);
    })();
    return () => { active = false; };
  }, [pending, user, isAuthenticated, isHydrated, navigationVersion, markRead]);
  return null;
}
