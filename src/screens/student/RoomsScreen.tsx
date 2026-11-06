import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { AppIcon } from '../../components/common/AppIcon';
import { AppTextInput } from '../../components/common/AppTextInput';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ROOM_TYPE_LABELS } from '../../components/hostel/RoomTypeCard';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import { useResidencyStatus } from '../../hooks/useResidencyStatus';
import { useGetHostelByIdQuery, useGetRoomOptionsQuery, type RoomSort } from '../../services/hostelApi';
import { extractErrorMessage } from '../../utils/error';
import { showDialog } from '../../utils/dialog';
import type { StudentStackParamList } from '../../navigation/types';
import type { Room, RoomLayoutType } from '../../types/api';

type Props = NativeStackScreenProps<StudentStackParamList, 'Rooms'>;
type LayoutFilter = RoomLayoutType | 'all';
const PAGE_SIZE = 10;

export const RoomsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { hostelId } = route.params;
  const [layout, setLayout] = useState<LayoutFilter>(route.params.layoutType ?? 'all');
  const [availability, setAvailability] = useState<'all' | 'available'>('all');
  const [sort, setSort] = useState<RoomSort>('room-number');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const list = useRef<FlatList<Room>>(null);
  const residency = useResidencyStatus();
  const { data: hostelResponse, isLoading: hostelLoading, error: hostelError, refetch: refetchHostel } = useGetHostelByIdQuery(hostelId);
  const hostel = hostelResponse?.data;
  const { currentData, isFetching, error, refetch } = useGetRoomOptionsQuery({
    hostelId, page, limit: PAGE_SIZE, layoutType: layout === 'all' ? undefined : layout,
    available: availability === 'available', q: query || undefined, sort,
  }, { refetchOnMountOrArgChange: true });
  const result = currentData?.data;

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // Availability may change while viewing the final page.
    if (result && page > Math.max(1, result.totalPages)) setPage(Math.max(1, result.totalPages));
  }, [result, page]);

  const refresh = () => { void refetch(); void refetchHostel(); residency.refetch(); };
  const reset = () => { setSearch(''); setQuery(''); setLayout('all'); setAvailability('all'); setSort('room-number'); setPage(1); };
  const goToPage = (next: number) => { setPage(next); list.current?.scrollToOffset({ offset: 0, animated: true }); };

  const selectRoom = (room: Room) => {
    if (!hostel) return;
    if (room.isLocked) {
      showDialog('Room Locked', 'This room is currently locked by administration and cannot accept new bookings.');
      return;
    }
    if (room.capacity <= room.occupiedCount) {
      showDialog('Room Full', 'This room is currently at full capacity.');
      return;
    }
    if (residency.isLoading || residency.isError) {
      showDialog('Unable to Check Booking', 'Please refresh and try again so we can check your current booking.');
      residency.refetch();
      return;
    }
    if (residency.hasActiveBooking) {
      const status = residency.activeBooking?.status;
      showDialog('Active Booking Exists',
        `You already have an active ${status === 'CheckedIn' ? 'hostel residency' : 'booking request'} in the system (${status}). You cannot apply for another room until your current booking is resolved.`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'View My Stay', onPress: () => navigation.navigate('StudentTabs', { screen: 'StayTab' }) }]);
      return;
    }
    navigation.navigate('BookingApplication', {
      room, hostelId: hostel._id, hostelName: hostel.name,
      fallbackRent: hostel.priceTier, hostelBanner: hostel.bannerImage,
    });
  };

  const header = (
    <View style={styles.filters}>
      <Text style={[TYPOGRAPHY.body, styles.muted]}>Choose a layout, compare rent and select your room.</Text>
      <AppTextInput value={search} onChangeText={setSearch} placeholder="Search room number" accessibilityLabel="Search room number"
        maxLength={100} autoCapitalize="none" autoCorrect={false} returnKeyType="search"
        containerStyle={{ marginBottom: 0 }} leftIcon={<AppIcon name="search-outline" size={20} color={COLORS.textSecondary} />} />
      <SegmentedControl<LayoutFilter> value={layout} onChange={(value) => { setLayout(value); setPage(1); }} accessibilityLabel="Room layout"
        items={[{ label: 'All layouts', value: 'all' }, { label: 'Single', value: 'Single' }, { label: '2-sharing', value: 'Shared-2' }, { label: '4-sharing', value: 'Shared-4' }]} />
      <SegmentedControl<'all' | 'available'> value={availability} onChange={(value) => { setAvailability(value); setPage(1); }} accessibilityLabel="Room availability"
        items={[{ label: 'All rooms', value: 'all' }, { label: 'Available only', value: 'available' }]} />
      <View style={styles.sortGroup}>
        <Text style={[TYPOGRAPHY.captionSemiBold, styles.muted]}>Sort by</Text>
        <SegmentedControl<RoomSort> value={sort} onChange={(value) => { setSort(value); setPage(1); }} accessibilityLabel="Sort rooms"
          items={[{ label: 'Room number', value: 'room-number' }, { label: 'Rent: low to high', value: 'rent-asc' }, { label: 'Rent: high to low', value: 'rent-desc' }]} />
      </View>
      <View style={styles.resultsHeader} accessibilityLiveRegion="polite">
        <Text style={[TYPOGRAPHY.bodySemiBold, styles.title]}>
          {result ? `${result.total} ${result.total === 1 ? 'room' : 'rooms'} found` : 'Finding rooms…'}
        </Text>
        {isFetching && result ? <ActivityIndicator size="small" color={COLORS.primary} /> : null}
      </View>
      {error && result ? <ErrorState message="Could not refresh rooms. Availability may have changed." onRetry={refresh} /> : null}
    </View>
  );

  return (
    <ScreenContainer>
      <AppHeader title="Choose a room" subtitle={hostel?.name ?? 'Room availability'} showBack onBack={() => navigation.goBack()} />
      {hostelLoading ? <LoadingState message="Loading hostel..." /> : hostelError || !hostel ? (
        <ErrorState message={extractErrorMessage(hostelError, 'Unable to load hostel.')} onRetry={refetchHostel} />
      ) : (
        <FlatList ref={list} data={result?.items ?? []} keyExtractor={(room) => room._id}
          contentContainerStyle={styles.list} ListHeaderComponent={header} keyboardShouldPersistTaps="handled"
          refreshing={isFetching && Boolean(result)} onRefresh={refresh} showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          ListEmptyComponent={isFetching ? <LoadingState message="Checking rooms..." /> : error ? (
            <ErrorState message={extractErrorMessage(error, 'Unable to load rooms.')} onRetry={refresh} />
          ) : <EmptyState icon="bed-outline" title="No matching rooms" description="Try another layout, room number or availability filter."
            actionTitle="Reset filters" onAction={reset} />}
          renderItem={({ item: room }) => {
            const beds = Math.max(0, room.capacity - room.occupiedCount);
            const available = !room.isLocked && beds > 0;
            const rent = room.monthlyRent ?? hostel.priceTier;
            const state = room.isLocked ? 'Unavailable · Locked' : beds === 0 ? 'Fully occupied' : `${beds} of ${room.capacity} beds available`;
            return (
              <Pressable onPress={() => selectRoom(room)} disabled={!available || residency.isLoading || isFetching}
                accessibilityRole="button" accessibilityState={{ disabled: !available || residency.isLoading || isFetching }}
                accessibilityLabel={`Room ${room.roomNumber}, ${ROOM_TYPE_LABELS[room.layoutType]}, PKR ${rent.toLocaleString()} per month. ${state}. Select room.`}
                style={({ pressed }) => [styles.room, pressed && { opacity: 0.75 }]}>
                <View style={styles.roomTop}>
                  <View style={styles.roomHeading}>
                    <Text style={[TYPOGRAPHY.h3, styles.title]}>Room {room.roomNumber}</Text>
                    <Text style={[TYPOGRAPHY.caption, styles.muted]}>{ROOM_TYPE_LABELS[room.layoutType]}</Text>
                  </View>
                  <View style={styles.rent}>
                    <Text style={[TYPOGRAPHY.bodySemiBold, styles.title]}>PKR {rent.toLocaleString()}</Text>
                    <Text style={[TYPOGRAPHY.caption, styles.muted]}>/ month</Text>
                  </View>
                </View>
                <View style={styles.roomBottom}>
                  <View style={styles.roomHeading}>
                    <Text style={[TYPOGRAPHY.captionSemiBold, { color: available ? COLORS.successText : COLORS.textSecondary }]}>{state}</Text>
                    {!available && <Text style={[TYPOGRAPHY.caption, styles.muted]}>Not accepting bookings</Text>}
                  </View>
                  {available && <View style={styles.select}><Text style={[TYPOGRAPHY.buttonSmall, { color: COLORS.primary }]}>Select</Text><AppIcon name="arrow-forward" size={17} color={COLORS.primary} /></View>}
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={result && result.totalPages > 0 ? (
            <View style={styles.footer}>
              <Text style={[TYPOGRAPHY.caption, styles.muted]}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, result.total)} of {result.total}
              </Text>
              <View style={styles.pagination}>
                <SecondaryButton title="Previous" compact disabled={page <= 1 || isFetching} onPress={() => goToPage(page - 1)} />
                <Text style={[TYPOGRAPHY.captionSemiBold, styles.title]}>Page {page} of {result.totalPages}</Text>
                <SecondaryButton title="Next" compact disabled={!result.hasMore || isFetching} onPress={() => goToPage(page + 1)} />
              </View>
              <Text style={[TYPOGRAPHY.caption, styles.muted]}>Availability is checked again when your booking is processed.</Text>
            </View>
          ) : undefined}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, flexGrow: 1 },
  filters: { paddingTop: SPACING.lg, gap: SPACING.md, marginBottom: SPACING.md },
  sortGroup: { gap: SPACING.xs },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm, paddingTop: SPACING.xs },
  title: { color: COLORS.textPrimary },
  muted: { color: COLORS.textSecondary },
  room: { borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.cardBorder, backgroundColor: COLORS.surface, padding: SPACING.lg, gap: SPACING.md },
  roomTop: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, alignItems: 'flex-start' },
  roomHeading: { flex: 1, minWidth: 110, gap: SPACING.xs },
  rent: { alignItems: 'flex-end', gap: SPACING.xs },
  roomBottom: { borderTopWidth: 1, borderTopColor: COLORS.borderSoft, paddingTop: SPACING.md, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.sm },
  select: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceSubtle },
  footer: { paddingTop: SPACING.xl, gap: SPACING.md },
  pagination: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
});
