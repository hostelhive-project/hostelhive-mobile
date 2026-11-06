import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AppIcon as Ionicons, BrandMark } from '../../components/common/AppIcon';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { HostelCard } from '../../components/hostel/HostelCard';
import { HostelCardSkeleton } from '../../components/ui/SkeletonCard';
import { ErrorState } from '../../components/feedback/ErrorState';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { RADIUS } from '../../theme/radius';
import { SHADOWS } from '../../theme/shadows';
import { useAppSelector } from '../../store/hooks';
import { useResidencyStatus } from '../../hooks/useResidencyStatus';
import { useGetHostelsQuery } from '../../services/hostelApi';
import { useGetUnreadCountQuery } from '../../services/notificationApi';
import type { Hostel } from '../../types/api';

export const StudentHomeScreen: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const navigation = useNavigation<any>();

  // Authoritative derived residency hook
  const {
    activeBooking,
    isLoading: isBookingsLoading,
    isFetching: isBookingsFetching,
    isError: isBookingsError,
    refetch: refetchResidency,
  } = useResidencyStatus();

  // Real hostels for Top Rated preview
  const {
    data: hostelsResponse,
    isLoading: isHostelsLoading,
    isFetching: isHostelsFetching,
    isError: isHostelsError,
    refetch: refetchHostels,
  } = useGetHostelsQuery();

  const rawHostels = hostelsResponse?.data || [];

  // Notifications unread count
  const {
    data: countRes,
    isLoading: isCountLoading,
    isFetching: isCountFetching,
    refetch: refetchUnreadCount,
  } = useGetUnreadCountQuery();
  const unreadCount = countRes?.data?.count || 0;

  const handleRefresh = () => {
    void Promise.all([refetchResidency(), refetchHostels(), refetchUnreadCount()]);
  };

  const topHostels = useMemo(() => {
    return rawHostels.slice(0, 4);
  }, [rawHostels]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.scrollContent}
      refreshing={
        (isBookingsFetching || isHostelsFetching || isCountFetching) &&
        !isBookingsLoading && !isHostelsLoading && !isCountLoading
      }
      onRefresh={handleRefresh}
    >
      {/* Top Header with Brand & Notification Action */}
      <View style={styles.homeHeader}>
        <View style={styles.homeIdentity}>
          <BrandMark size={40} />
          <View style={styles.greetingCopy}>
            <Text style={[TYPOGRAPHY.caption, styles.greetingSubtitle]}>Welcome to HostelHive</Text>
            <Text accessibilityRole="header" style={[TYPOGRAPHY.h1, styles.greetingTitle]}>Hi, {firstName}</Text>
          </View>
        </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('StudentTabs', { screen: 'NotificationsTab' })}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
            {unreadCount > 0 ? (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Shortcut Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <View style={styles.heroTitleRow}>
              <Text style={[TYPOGRAPHY.h1, styles.heroTitle]}>Find your stay</Text>
              <View style={styles.heroIcon}>
                <Ionicons name="business-outline" size={22} color={COLORS.textInverse} />
              </View>
            </View>
            <Text style={[TYPOGRAPHY.body, styles.heroSubtitle]}>
              Compare hostels, rooms and monthly rent.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('StudentTabs', { screen: 'ExploreTab' })}
            accessibilityRole="button"
            accessibilityLabel="Search hostels by name, area or landmark"
          >
            <View style={styles.searchIcon}>
              <Ionicons name="search" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.searchCopy}>
              <Text style={[TYPOGRAPHY.button, styles.searchTitle]}>Search hostels</Text>
              <Text style={[TYPOGRAPHY.caption, styles.searchHint]}>Name, area or landmark</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Action Hub */}
        <View style={styles.section}>
          <SectionHeader title="Go to" />
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('StudentTabs', { screen: 'ExploreTab' })}
            >
              <View style={[styles.actionIconBox, { backgroundColor: COLORS.infoLight }]}>
                <Ionicons name="compass-outline" size={22} color={COLORS.info} />
              </View>
              <Text style={[TYPOGRAPHY.button, styles.actionLabel]}>Explore</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('StudentTabs', { screen: 'StayTab' })}
            >
              <View style={[styles.actionIconBox, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="bed-outline" size={22} color={COLORS.success} />
              </View>
              <Text style={[TYPOGRAPHY.button, styles.actionLabel]}>My Stay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Complaints')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: COLORS.warningLight }]}>
                <Ionicons name="alert-circle-outline" size={22} color={COLORS.warning} />
              </View>
              <Text style={[TYPOGRAPHY.button, styles.actionLabel]}>Complaints</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Invoices')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: COLORS.purpleLight }]}>
                <Ionicons name="card-outline" size={22} color={COLORS.purple} />
              </View>
              <Text style={[TYPOGRAPHY.button, styles.actionLabel]}>Payments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Residency Context Card */}
        <View style={styles.section}>
          <SectionHeader
            title="My Accommodation"
            actionTitle={activeBooking ? 'Manage ' : undefined}
            onAction={activeBooking ? () => navigation.navigate('StudentTabs', { screen: 'StayTab' }) : undefined}
          />

          {isBookingsLoading ? (
            <View style={styles.stateCard}>
              <Text style={[TYPOGRAPHY.caption, styles.mutedText]}>Checking booking status...</Text>
            </View>
          ) : isBookingsError && !activeBooking ? (
            <ErrorState
              title="Unable to Load Your Stay"
              message="Your booking status could not be retrieved. Check your connection and try again."
              onRetry={refetchResidency}
            />
          ) : activeBooking ? (
            <TouchableOpacity
              style={styles.bookingCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('StudentTabs', { screen: 'StayTab' })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleBox}>
                  <Text style={[TYPOGRAPHY.h3, styles.bookingTitle]}>
                    {activeBooking.status === 'CheckedIn'
                      ? 'Active Residency'
                      : activeBooking.status === 'Approved'
                      ? 'Approved Reservation'
                      : 'Pending Application'}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, styles.mutedText]}>
                    Submitted {new Date(activeBooking.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <StatusBadge status={activeBooking.status} />
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <View>
                  <Text style={[TYPOGRAPHY.caption, styles.mutedText]}>Monthly Rent</Text>
                  <Text style={[TYPOGRAPHY.bodyBold, styles.rentText]}>
                    PKR {activeBooking.monthlyRent?.toLocaleString() || '—'}
                  </Text>
                </View>
                <View style={styles.viewStayBtn}>
                  <Text style={[TYPOGRAPHY.buttonSmall, styles.viewStayText]}>View Details</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.noStayCard}>
              <View style={styles.noStayIconBox}>
                <Ionicons name="home-outline" size={26} color={COLORS.primary} />
              </View>
              <View style={styles.noStayContent}>
                <Text style={[TYPOGRAPHY.bodySemiBold, styles.noStayTitle]}>No Active Booking</Text>
                <Text style={[TYPOGRAPHY.caption, styles.mutedText]}>
                  Browse available rooms and apply for accommodation online.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.browseMiniBtn}
                onPress={() => navigation.navigate('StudentTabs', { screen: 'ExploreTab' })}
                activeOpacity={0.8}
              >
                <Text style={[TYPOGRAPHY.buttonSmall, styles.browseMiniText]}>Browse</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recommended Accommodations */}
        <View style={styles.section}>
          <SectionHeader
            title="Featured Hostels"
            actionTitle="See All"
            onAction={() => navigation.navigate('StudentTabs', { screen: 'ExploreTab' })}
          />

          {isHostelsLoading ? (
            <>
              <HostelCardSkeleton />
              <HostelCardSkeleton />
            </>
          ) : isHostelsError && !hostelsResponse ? (
            <ErrorState
              title="Unable to Load Hostels"
              message="Featured hostels could not be retrieved. Please try again."
              onRetry={refetchHostels}
            />
          ) : topHostels.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="business-outline" size={28} color={COLORS.textMuted} />
              <Text style={[TYPOGRAPHY.caption, styles.mutedText]}>
                No hostels registered yet. Check back soon!
              </Text>
            </View>
          ) : (
            topHostels.map((hostel: Hostel) => (
              <HostelCard
                key={hostel._id}
                hostel={hostel}
                onPress={() => navigation.navigate('HostelDetails', { hostelId: hostel._id })}
              />
            ))
          )}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  homeHeader: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg },
  homeIdentity: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1, minWidth: 0 },
  greetingCopy: { flex: 1, minWidth: 0, gap: SPACING.xxs },
  greetingTitle: { color: COLORS.textPrimary },
  greetingSubtitle: { color: COLORS.textSecondary },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  heroIcon: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center', justifyContent: 'center' },
  searchIcon: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceHover, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  searchCopy: { flex: 1, minWidth: 0, gap: SPACING.xxs },
  searchTitle: { color: COLORS.textPrimary },
  searchHint: { color: COLORS.textSecondary },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  content: {
    paddingHorizontal: SPACING.xl,
  },
  notifBtn: {
    width: 48, height: 48, flexShrink: 0, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: COLORS.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xxl, padding: SPACING.xl, marginBottom: SPACING.xxl, ...SHADOWS.card,
  },
  heroTextContainer: {
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    color: COLORS.textInverse, flex: 1, minWidth: 0,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.84)', marginTop: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, minHeight: 64, paddingHorizontal: SPACING.md, paddingVertical: 10, gap: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.subtle, flexBasis: '47%', flexGrow: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 100, padding: SPACING.md, gap: SPACING.sm,
  },
  actionIconBox: {
    width: 36, height: 36, flexShrink: 0, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: {
    color: COLORS.textPrimary, flexShrink: 1, width: '100%', textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  cardTitleBox: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  bookingTitle: {
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceSubtle,
    marginVertical: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentText: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  viewStayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  viewStayText: {
    color: COLORS.primary,
  },
  noStayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.md,
    ...SHADOWS.subtle,
  },
  noStayIconBox: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noStayContent: {
    flex: 1,
  },
  noStayTitle: {
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  browseMiniBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  browseMiniText: {
    color: COLORS.textInverse,
  },
  stateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  mutedText: {
    color: COLORS.textMuted,
  },
});
