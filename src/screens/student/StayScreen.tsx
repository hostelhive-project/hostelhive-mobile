import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { useNavigation } from '@react-navigation/native';
import { showDialog } from '../../utils/dialog';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import {
  useCancelBookingMutation,
} from '../../services/bookingApi';
import { useGetMyComplaintsQuery } from '../../services/complaintApi';
import { useListInvoicesForBookingQuery } from '../../services/billingApi';
import { useResidencyStatus } from '../../hooks/useResidencyStatus';
import type { Booking, Room } from '../../types/api';

export const StayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    primaryBooking,
    historicalBookings: historyBookings,
    isActiveResident,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useResidencyStatus();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const {
    data: complaintsData,
    isError: isComplaintsError,
    isLoading: isComplaintsLoading,
    isFetching: isComplaintsFetching,
    refetch: refetchComplaints,
  } = useGetMyComplaintsQuery(undefined, {
    skip: !isActiveResident,
  });

  const {
    data: invoicesData,
    isError: isInvoicesError,
    isLoading: isInvoicesLoading,
    isFetching: isInvoicesFetching,
    refetch: refetchInvoices,
  } = useListInvoicesForBookingQuery(primaryBooking?._id || '', {
    skip: !primaryBooking?._id,
  });

  const handleRefresh = () => {
    void Promise.all([
      refetch(),
      ...(isActiveResident ? [refetchComplaints()] : []),
      ...(primaryBooking?._id ? [refetchInvoices()] : []),
    ]);
  };

  const openComplaintsCount = useMemo(() => {
    if (!complaintsData?.data) return 0;
    return complaintsData.data.filter((c) => c.status !== 'Resolved').length;
  }, [complaintsData]);

  const unpaidInvoicesCount = useMemo(() => {
    if (!invoicesData?.data) return 0;
    return invoicesData.data.filter(
      (inv) => inv.status === 'Unpaid' || inv.status === 'Overdue' || inv.status === 'PartiallyPaid'
    ).length;
  }, [invoicesData]);

  const handleCancelBooking = (booking: Booking) => {
    const isApproved = booking.status === 'Approved';
    showDialog(
      'Cancel Booking Application',
      isApproved
        ? 'Are you sure you want to cancel your approved booking? This will release your reserved bed slot.'
        : 'Are you sure you want to cancel your pending booking application?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await cancelBooking(booking._id).unwrap();
              if (res.success) {
                showDialog(
                  'Booking Cancelled',
                  'Your booking application has been cancelled and the room slot is released.'
                );
              }
            } catch (err: any) {
              const msg =
                err?.data?.message || err?.message || 'Failed to cancel booking. Please try again.';
              showDialog('Cancellation Error', msg);
            }
          },
        },
      ]
    );
  };

  const renderPrimaryCard = (booking: Booking) => {
    const { status, monthlyRent, createdAt, roomId, emergencyContact, rejectionReason } = booking;
    const room = typeof roomId === 'object' ? (roomId as Room) : null;
    const isApproved = status === 'Approved';
    const isActionable = status === 'Pending' || isApproved;

    return (
      <View style={styles.primaryCard}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleContainer}>
            <Text style={[TYPOGRAPHY.h2, styles.cardTitle]}>
              {status === 'CheckedIn'
                ? 'Active Residency'
                : status === 'Approved'
                ? 'Approved Reservation'
                : status === 'Pending'
                ? 'Pending Application'
                : status === 'CheckedOut'
                ? 'Stay Completed'
                : 'Booking Details'}
            </Text>
            <Text style={[TYPOGRAPHY.caption, styles.cardDate]}>
              Submitted on {new Date(createdAt).toLocaleDateString()}
            </Text>
          </View>
          <StatusBadge status={status} />
        </View>

        {/* Room & Rent Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="bed-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.summaryTextGroup}>
              <Text style={styles.summaryLabel}>Your room</Text>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.summaryValue]}>
                {room ? `Room ${room.roomNumber} (${room.layoutType})` : 'Room Assigned'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.summaryTextGroup}>
              <Text style={styles.summaryLabel}>Monthly rent</Text>
              <Text style={[TYPOGRAPHY.h2, styles.summaryValue]}>
                PKR {monthlyRent?.toLocaleString() || '—'} / month
              </Text>
            </View>
          </View>

          {emergencyContact ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryIconBox}>
                <Ionicons name="call-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.summaryTextGroup}>
                <Text style={styles.summaryLabel}>Emergency contact</Text>
                <Text style={[TYPOGRAPHY.bodySemiBold, styles.summaryValue]}>
                  {emergencyContact}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Status Callout Box */}
        {status === 'Pending' && (
          <View style={[styles.statusBox, styles.statusBoxPending]}>
            <Ionicons name="time" size={22} color={COLORS.warning} />
            <View style={styles.statusBoxTextContainer}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.statusBoxTitlePending]}>
                Under Review
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.statusBoxTextPending]}>
                Hostel administration is reviewing your application and verifying documents. You will
                be notified once approved.
              </Text>
            </View>
          </View>
        )}

        {status === 'Approved' && (
          <View style={[styles.statusBox, styles.statusBoxApproved]}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.info} />
            <View style={styles.statusBoxTextContainer}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.statusBoxTitleApproved]}>
                Bed Reserved!
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.statusBoxTextApproved]}>
                Your application has been approved and your bed slot is reserved. Please visit the
                hostel for physical check-in by the manager.
              </Text>
            </View>
          </View>
        )}

        {status === 'CheckedIn' && (
          <View style={[styles.statusBox, styles.statusBoxCheckedIn]}>
            <Ionicons name="shield-checkmark" size={22} color={COLORS.success} />
            <View style={styles.statusBoxTextContainer}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.statusBoxTitleCheckedIn]}>
                Active Resident
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.statusBoxTextCheckedIn]}>
                Contact your hostel manager when you are ready to check out.
              </Text>
            </View>
          </View>
        )}

        {status === 'Rejected' && (
          <View style={[styles.statusBox, styles.statusBoxRejected]}>
            <Ionicons name="close-circle" size={22} color={COLORS.error} />
            <View style={styles.statusBoxTextContainer}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.statusBoxTitleRejected]}>
                Application Not Approved
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.statusBoxTextRejected]}>
                {rejectionReason || 'The administration was unable to approve this booking request.'}
              </Text>
            </View>
          </View>
        )}

        {status === 'Cancelled' && (
          <View style={[styles.statusBox, styles.statusBoxCancelled]}>
            <Ionicons name="information-circle" size={22} color={COLORS.textSecondary} />
            <View style={styles.statusBoxTextContainer}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.statusBoxTitleCancelled]}>
                Booking Cancelled
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.statusBoxTextCancelled]}>
                This booking application was cancelled. The room slot has been released.
              </Text>
            </View>
          </View>
        )}

        {status === 'CheckedOut' && (
          <View style={[styles.statusBox, styles.statusBoxCheckedOut]}>
            <Ionicons name="checkmark-done-circle" size={22} color={COLORS.textSecondary} />
            <View style={styles.statusBoxTextContainer}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.statusBoxTitleCheckedOut]}>
                Stay Completed
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.statusBoxTextCheckedOut]}>
                You have successfully checked out of this hostel.
              </Text>
            </View>
          </View>
        )}

        {/* Lifecycle Actions */}
        {isActionable && (
          <View style={styles.actionContainer}>
            <SecondaryButton
              title={isApproved ? 'Cancel Reserved Booking' : 'Cancel Application'}
              onPress={() => handleCancelBooking(booking)}
              isLoading={isCancelling}
              disabled={isCancelling}
              style={styles.cancelBtn}
            />
          </View>
        )}

        {!isActionable && (status === 'Rejected' || status === 'Cancelled' || status === 'CheckedOut') && (
          <View style={styles.actionContainer}>
            <PrimaryButton
              title="Explore Other Hostels"
              onPress={() => navigation.navigate('ExploreTab')}
              style={styles.exploreBtn}
            />
            {status === 'CheckedOut' && (
              <>
                <SecondaryButton
                  title="View Invoices & Receipts"
                  onPress={() => navigation.navigate('Invoices', { bookingId: booking._id })}
                  style={styles.historyComplaintsBtn}
                />
                <SecondaryButton
                  title="View Past Complaints"
                  onPress={() => navigation.navigate('Complaints')}
                  style={styles.historyComplaintsBtn}
                />
                <SecondaryButton
                  title="Review Hostel Experience"
                  onPress={() => {
                    const roomObj = typeof booking.roomId === 'object' ? booking.roomId : null;
                    const bookingHostelId = roomObj?.hostelId
                      ? typeof roomObj.hostelId === 'object'
                        ? (roomObj.hostelId as any)?._id
                        : roomObj.hostelId
                      : null;
                    if (bookingHostelId) {
                      navigation.navigate('HostelDetails', { hostelId: bookingHostelId });
                    } else {
                      navigation.navigate('ExploreTab');
                    }
                  }}
                  style={styles.historyComplaintsBtn}
                />
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderResidentServices = () => (
    <View style={styles.residentServicesCard}>
      <View style={styles.servicesHeader}>
        <View style={styles.servicesHeaderLeft}>
          <Text style={[TYPOGRAPHY.h3, styles.servicesTitle]}>Resident Services</Text>
          <Text style={[TYPOGRAPHY.caption, styles.servicesSubtitle]}>
            Everything you need during your stay
          </Text>
        </View>
      </View>

      {/* Rent & Payments Service */}
      <TouchableOpacity
        style={[styles.serviceItem, styles.serviceItemMarginBottom]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Invoices', { bookingId: primaryBooking?._id })}
      >
        <View style={styles.serviceIconBox}>
          <Ionicons name="card-outline" size={22} color={COLORS.primary} />
        </View>
        <View style={styles.serviceContent}>
          <View style={styles.serviceItemTitleRow}>
            <Text style={[TYPOGRAPHY.button, styles.serviceItemTitle]}>
              Rent & Invoices
            </Text>
            {isInvoicesError ? (
              <View style={styles.unavailableBadge}>
                <Text style={[TYPOGRAPHY.smallBadge, styles.unavailableBadgeText]}>Unavailable</Text>
              </View>
            ) : unpaidInvoicesCount > 0 ? (
              <View style={styles.dueBadge}>
                <Text style={[TYPOGRAPHY.smallBadge, styles.dueBadgeText]}>
                  {unpaidInvoicesCount} due
                </Text>
              </View>
            ) : invoicesData?.data && invoicesData.data.length > 0 ? (
              <View style={styles.settledBadge}>
                <Text style={[TYPOGRAPHY.smallBadge, styles.settledBadgeText]}>
                  Paid up
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[TYPOGRAPHY.caption, styles.serviceItemDescription]}>
            Pay rent and find your payment receipts.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Complaints Service */}
      <TouchableOpacity
        style={[styles.serviceItem, styles.serviceItemMarginBottom]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Complaints')}
      >
        <View style={styles.serviceIconBox}>
          <Ionicons name="construct-outline" size={22} color={COLORS.primary} />
        </View>
        <View style={styles.serviceContent}>
          <View style={styles.serviceItemTitleRow}>
            <Text style={[TYPOGRAPHY.button, styles.serviceItemTitle]}>
              Repairs & complaints
            </Text>
            {isComplaintsError ? (
              <View style={styles.unavailableBadge}>
                <Text style={[TYPOGRAPHY.smallBadge, styles.unavailableBadgeText]}>UNAVAILABLE</Text>
              </View>
            ) : openComplaintsCount > 0 ? (
              <View style={styles.activeBadge}>
                <Text style={[TYPOGRAPHY.smallBadge, styles.activeBadgeText]}>
                  {openComplaintsCount} open
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[TYPOGRAPHY.caption, styles.serviceItemDescription]}>
            Track repairs and follow complaint updates.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Hostel AI Assistant */}
      <TouchableOpacity
        style={styles.serviceItem}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Chatbot', { mode: 'resident' })}
      >
        <View style={styles.serviceIconBox}>
          <Ionicons name="sparkles" size={22} color={COLORS.primary} />
        </View>
        <View style={styles.serviceContent}>
          <View style={styles.serviceItemTitleRow}>
            <Text style={[TYPOGRAPHY.button, styles.serviceItemTitle]}>
              Hostel assistant
            </Text>
            <View style={styles.settledBadge}>
              <Text style={[TYPOGRAPHY.smallBadge, styles.settledBadgeText]}>
                Resident access
              </Text>
            </View>
          </View>
          <Text style={[TYPOGRAPHY.caption, styles.serviceItemDescription]}>
            Ask about Wi-Fi, rules and hostel timings.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      <View style={styles.serviceActionRow}>
        <SecondaryButton
          title="New complaint"
          onPress={() => navigation.navigate('NewComplaint')}
          style={styles.halfBtn}
        />
        <SecondaryButton
          title={unpaidInvoicesCount > 0 ? 'Pay Rent' : 'View Invoices'}
          onPress={() => navigation.navigate('Invoices', { bookingId: primaryBooking?._id })}
          style={styles.halfBtn}
        />
      </View>
    </View>
  );

  return (
    <ScreenContainer
      scrollable
      refreshing={
        (isFetching || isComplaintsFetching || isInvoicesFetching) &&
        !isLoading && !isComplaintsLoading && !isInvoicesLoading
      }
      onRefresh={handleRefresh}
    >
      <AppHeader
        title="My Stay"
        variant="main"
        subtitle="Your room, rent and resident services"
        rightAction={
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.7}
            disabled={isFetching}
            style={styles.refreshButton}
            accessibilityRole="button"
            accessibilityLabel="Refresh stay details"
            accessibilityState={{ disabled: isFetching, busy: isFetching }}
          >
            {isFetching ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="refresh-outline" size={22} color={COLORS.textPrimary} />
            )}
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        {isLoading ? (
          <LoadingState message="Fetching your residency status..." />
        ) : isError && !primaryBooking ? (
          <ErrorState
            title="Unable to Load Stay Information"
            message="Your booking history could not be retrieved. Check your connection and try again."
            onRetry={refetch}
          />
        ) : !primaryBooking ? (
          <EmptyState
            icon="home-outline"
            title="No Stay Information"
            description="You do not currently have any active or past hostel reservations."
            actionTitle="Find Accommodation"
            onAction={() => navigation.navigate('ExploreTab')}
          />
        ) : (
          <>
            {/* Primary / Active Booking Card */}
            {renderPrimaryCard(primaryBooking)}

            {/* Resident Services (Exclusive to Active CheckedIn Residents) */}
            {primaryBooking.status === 'CheckedIn' && renderResidentServices()}

            {/* Past Bookings Section */}
            {historyBookings.length > 0 && (
              <View style={styles.historySection}>
                <Text style={[TYPOGRAPHY.h3, styles.historyTitle]}>Booking History</Text>
                {historyBookings.map((hb) => {
                  const hRoom = typeof hb.roomId === 'object' ? (hb.roomId as Room) : null;
                  return (
                    <View key={hb._id} style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                        <View>
                          <Text style={[TYPOGRAPHY.bodySemiBold, styles.historyRoomText]}>
                            {hRoom ? `Room ${hRoom.roomNumber}` : 'Hostel Room'}
                          </Text>
                          <Text style={[TYPOGRAPHY.caption, styles.historyDateText]}>
                            {new Date(hb.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <StatusBadge status={hb.status} />
                      </View>
                      <View style={styles.historyDetails}>
                        <Text style={[TYPOGRAPHY.caption, styles.historyRentText]}>
                          PKR {hb.monthlyRent?.toLocaleString() || '—'} / month
                        </Text>
                      </View>
                      <SecondaryButton title="View invoices & receipts" compact onPress={() => navigation.navigate('Invoices', { bookingId: hb._id })} />
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
  },
  refreshButton: {
    width: 48, height: 48, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceHover, alignItems: 'center', justifyContent: 'center',
  },
  primaryCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderTopWidth: 3, borderColor: COLORS.cardBorder, borderTopColor: COLORS.primary, marginBottom: SPACING.xxl, ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md,
  },
  headerTitleContainer: {
    flex: 1, minWidth: 140,
  },
  cardTitle: {
    color: COLORS.textPrimary,
  },
  cardDate: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryContainer: {
    gap: SPACING.xs, marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },
  summaryIconBox: {
    width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceHover, justifyContent: 'center', alignItems: 'center',
  },
  summaryTextGroup: {
    flex: 1,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.xs,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  statusBox: {
    flexDirection: 'row', padding: SPACING.md, borderRadius: RADIUS.md, gap: SPACING.sm, alignItems: 'flex-start', borderLeftWidth: 3, borderWidth: 1,
  },
  statusBoxTextContainer: {
    flex: 1,
  },
  statusBoxPending: {
    backgroundColor: COLORS.warningLight,
    borderColor: '#FED7AA',
  },
  statusBoxTitlePending: {
    color: COLORS.warning,
    marginBottom: 2,
  },
  statusBoxTextPending: {
    color: COLORS.warning,
    lineHeight: 18,
  },
  statusBoxApproved: {
    backgroundColor: COLORS.infoLight,
    borderColor: '#BAE6FD',
  },
  statusBoxTitleApproved: {
    color: COLORS.info,
    marginBottom: 2,
  },
  statusBoxTextApproved: {
    color: COLORS.info,
    lineHeight: 18,
  },
  statusBoxCheckedIn: {
    backgroundColor: COLORS.successLight,
    borderColor: '#BBF7D0',
  },
  statusBoxTitleCheckedIn: {
    color: COLORS.success,
    marginBottom: 2,
  },
  statusBoxTextCheckedIn: {
    color: COLORS.success,
    lineHeight: 18,
  },
  statusBoxRejected: {
    backgroundColor: COLORS.errorLight,
    borderColor: '#FECDD3',
  },
  statusBoxTitleRejected: {
    color: COLORS.error,
    marginBottom: 2,
  },
  statusBoxTextRejected: {
    color: COLORS.error,
    lineHeight: 18,
  },
  statusBoxCancelled: {
    backgroundColor: COLORS.surfaceSubtle,
    borderColor: COLORS.cardBorder,
  },
  statusBoxTitleCancelled: {
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statusBoxTextCancelled: {
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  statusBoxCheckedOut: {
    backgroundColor: COLORS.surfaceSubtle,
    borderColor: COLORS.cardBorder,
  },
  statusBoxTitleCheckedOut: {
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statusBoxTextCheckedOut: {
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: SPACING.xs,
  },
  cancelBtn: {
    borderColor: COLORS.error,
  },
  exploreBtn: {
    width: '100%',
  },
  historySection: {
    marginTop: SPACING.sm,
  },
  historyTitle: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  historyCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: SPACING.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  historyRoomText: {
    color: COLORS.textPrimary,
  },
  historyDateText: {
    color: COLORS.textMuted,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRentText: {
    color: COLORS.textSecondary,
  },
  residentServicesCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: SPACING.xxl, ...SHADOWS.card,
  },
  servicesHeader: {
    marginBottom: SPACING.md,
  },
  servicesHeaderLeft: {
    gap: 2,
  },
  servicesTitle: {
    color: COLORS.textPrimary,
  },
  servicesSubtitle: {
    color: COLORS.textSecondary,
  },
  serviceItem: {
    minHeight: 88, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingVertical: SPACING.md, gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },
  serviceIconBox: {
    width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceHover, justifyContent: 'center', alignItems: 'center',
  },
  serviceContent: {
    flex: 1,
    minWidth: 0,
  },
  serviceItemTitleRow: {
    gap: SPACING.xs, alignItems: 'flex-start', marginBottom: SPACING.xs,
  },
  serviceItemTitle: {
    color: COLORS.textPrimary,
  },
  serviceItemDescription: {
    ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary,
  },
  activeBadge: {
    backgroundColor: COLORS.warningLight, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  activeBadgeText: {
    color: COLORS.warningText,
  },
  unavailableBadge: {
    backgroundColor: COLORS.dangerLight, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  unavailableBadgeText: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  dueBadge: {
    backgroundColor: COLORS.dangerLight, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  dueBadgeText: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  settledBadge: {
    backgroundColor: COLORS.successLight, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  settledBadgeText: {
    color: COLORS.successText,
  },
  serviceItemMarginBottom: {
    marginBottom: SPACING.xs,
  },
  serviceActionRow: {
    flexDirection: 'column', gap: SPACING.sm, marginTop: SPACING.lg,
  },
  halfBtn: {
    flex: 1,
  },
  historyComplaintsBtn: {
    marginTop: SPACING.sm,
    width: '100%',
  },
});
