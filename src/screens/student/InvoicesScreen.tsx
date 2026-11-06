import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { useFocusEffect, useIsFocused, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { AppModal } from '../../components/ui/AppModal';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { showDialog } from '../../utils/dialog';
import { useResidencyStatus } from '../../hooks/useResidencyStatus';
import {
  useListInvoicesForBookingQuery,
  useInitiateCheckoutMutation,
} from '../../services/billingApi';
import type { StudentStackParamList } from '../../navigation/types';
import type { Invoice } from '../../types/billing';

import * as WebBrowser from 'expo-web-browser';

import { useAppSelector } from '../../store/hooks';
import { readCheckout, rememberCheckout } from '../../utils/checkoutContext';
import { useScreenOperation } from '../../hooks/useScreenOperation';

type RouteProps = RouteProp<StudentStackParamList, 'Invoices'>;

export const InvoicesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const isFocused = useIsFocused();
  const userId = useAppSelector((state) => state.auth.user?._id);
  const handledReturn = useRef<string | null>(null);
  const { activeBooking, primaryBooking, isActiveResident, isLoading: isCheckingResidency } =
    useResidencyStatus();

  // Prefer route-provided bookingId, fallback to active or primary booking
  const targetBookingId = route.params?.bookingId || activeBooking?._id || primaryBooking?._id;
  const beginOperation = useScreenOperation(`${userId || ''}:${targetBookingId || ''}`);

  const {
    currentData: invoicesResponse,
    isLoading: isLoadingInvoices,
    isFetching,
    isError: isInvoicesError,
    refetch,
  } = useListInvoicesForBookingQuery(targetBookingId || '', {
    skip: !targetBookingId,
  });

  const [initiateCheckout, { isLoading: isInitiatingCheckout }] = useInitiateCheckoutMutation();

  const [selectedInvoiceForCheckout, setSelectedInvoiceForCheckout] = useState<Invoice | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isVerifyingStatus, setIsVerifyingStatus] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('Verifying payment with Stripe...');

  useFocusEffect(React.useCallback(() => {
    setSelectedInvoiceForCheckout(null);
    setShowCheckoutModal(false);
    setIsVerifyingStatus(false);
  }, [targetBookingId, userId]));

  const refreshInvoices = () => {
    if (targetBookingId) return refetch();
  };

  const handleCloseCheckoutModal = () => {
    if (!isVerifyingStatus) setShowCheckoutModal(false);
  };

  const invoices = useMemo(() => invoicesResponse?.data || [], [invoicesResponse]);

  // Derive dues
  const unpaidInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === 'Unpaid' || inv.status === 'Overdue' || inv.status === 'PartiallyPaid'),
    [invoices]
  );

  const totalOutstandingDue = useMemo(
    () => unpaidInvoices.reduce((sum, inv) => sum + (inv.totalDue || 0), 0),
    [unpaidInvoices]
  );

  // Latest or currently pending invoice
  const currentInvoice = useMemo(() => {
    if (unpaidInvoices.length > 0) return unpaidInvoices[0];
    return invoices.length > 0 ? invoices[0] : null;
  }, [unpaidInvoices, invoices]);

  const historicalInvoices = useMemo(() => {
    if (!currentInvoice) return [];
    return invoices.filter((inv) => inv._id !== currentInvoice._id);
  }, [invoices, currentInvoice]);

  // Controlled Webhook Delay Handling: retries up to 4 times with backoff
  const pollPaymentConfirmation = async (invoiceId: string) => {
    if (!targetBookingId) return;
    const operation = beginOperation('verification');
    if (!operation) return;
    try {
      setIsVerifyingStatus(true);
      setShowCheckoutModal(true);
      setVerificationMessage('Confirming payment with Stripe webhook...');

      for (let attempt = 1; attempt <= 4; attempt++) {
        if (!operation.isCurrent()) return;
        try {
          const updated = await refetch().unwrap();
          if (!operation.isCurrent()) return;
          const refetchedInvoices = updated?.data || [];
          const match = refetchedInvoices.find((inv) => inv._id === invoiceId);

          if (match?.status === 'Paid') {
            setIsVerifyingStatus(false);
            setShowCheckoutModal(false);
            showDialog(
              'Payment Confirmed!',
              `Your payment of PKR ${match.totalDue.toLocaleString()} for ${match.billingMonth} has been received and confirmed via Stripe.`
            );
            return;
          }
        } catch {
          // ignore transient network errors during poll
        }

        if (!operation.isCurrent()) return;

        if (attempt < 4) {
          setVerificationMessage(`Confirming payment (attempt ${attempt + 1}/4)...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      if (!operation.isCurrent()) return;
      setIsVerifyingStatus(false);
      setVerificationMessage(
        'Payment is not confirmed yet. You can check again shortly; the invoice will update after Stripe confirms it.'
      );
      showDialog(
        'Payment Processing',
        'We could not confirm this payment yet. If you completed checkout, Stripe may still be processing it. Check the payment status again shortly.'
      );
    } finally {
      if (operation.isCurrent()) setIsVerifyingStatus(false);
      operation.finish();
    }
  };

  // Resolve the exact invoice before handling a cold or warm checkout return.
  React.useEffect(() => {
    const status = route.params?.paymentStatus;
    if (!status) { handledReturn.current = null; return; }
    if (!isFocused) return;
    const key = status + ':' + (route.params?.invoiceId || route.params?.session_id || 'stored');
    if (handledReturn.current === key) return;
    let active = true;
    void (async () => {
      const saved = route.params?.invoiceId || await readCheckout(userId).catch(() => null);
      if (!active) return;
      if (saved && /^[a-f\d]{24}$/i.test(saved)) {
        handledReturn.current = key;
        navigation.replace('InvoiceDetail', { invoiceId: saved, paymentStatus: status });
      } else if (!isCheckingResidency) {
        handledReturn.current = key;
        navigation.setParams({ paymentStatus: undefined });
        if (targetBookingId) void refetch();
        showDialog('Checkout return', 'Open the invoice you paid to check its current payment status. A browser return alone does not confirm payment.');
      }
    })();
    return () => { active = false; };
  }, [route.params?.paymentStatus, route.params?.invoiceId, route.params?.session_id, userId, isCheckingResidency, targetBookingId, refetch, navigation, isFocused]);

  const handlePayNow = async (invoice: Invoice) => {
    if (invoice.status === 'Paid') {
      showDialog('Already Settled', 'This invoice has already been paid in full.');
      return;
    }

    const operation = beginOperation('checkout');
    if (!operation) return;
    try {
      await rememberCheckout(userId, invoice._id).catch(() => undefined);
      if (!operation.isCurrent()) return;
      setSelectedInvoiceForCheckout(invoice);
      const res = await initiateCheckout({ invoiceId: invoice._id }).unwrap();
      if (!operation.isCurrent()) return;

      if (res?.success && res?.data?.checkoutUrl) {
        setShowCheckoutModal(true);
        setVerificationMessage('Stripe Checkout session in progress...');

        let authResult: WebBrowser.WebBrowserAuthSessionResult | null = null;
        try {
          // Native in-app browser sheet (closes automatically when Stripe redirects to hostelhive://)
          authResult = await WebBrowser.openAuthSessionAsync(
            res.data.checkoutUrl,
            'hostelhive://payments/success'
          );
        } catch {
          if (!operation.isCurrent()) return;
          // Fallback to Linking.openURL if WebBrowser fails
          const canOpen = await Linking.canOpenURL(res.data.checkoutUrl);
          if (!operation.isCurrent()) return;
          if (canOpen) {
            await Linking.openURL(res.data.checkoutUrl);
          } else {
            showDialog('Browser Error', 'Unable to open Stripe Checkout URL on this device.');
            setShowCheckoutModal(false);
            return;
          }
        }

        if (!operation.isCurrent()) return;
        if (authResult?.type === 'success' && authResult.url.includes('/cancel')) {
          setShowCheckoutModal(false);
          if (targetBookingId) void refetch();
          return;
        }
        if (authResult?.type === 'success') {
          // In-app browser closed automatically on redirect -> trigger controlled refetch
          await pollPaymentConfirmation(invoice._id);
        } else if (authResult?.type === 'cancel' || authResult?.type === 'dismiss') {
          // The checkout window closed. Refresh the invoice, then return to the invoice screen.
          setShowCheckoutModal(false);
          setIsVerifyingStatus(false);
          refreshInvoices();
        }
      }
    } catch (err: any) {
      if (!operation.isCurrent()) return;
      const msg =
        err?.data?.message ||
        err?.message ||
        'Could not initiate Stripe checkout. Please try again or contact hostel administration.';
      showDialog('Payment Error', msg);
      setShowCheckoutModal(false);
    } finally {
      operation.finish();
    }
  };

  const handleVerifyStatus = async () => {
    const targetId = selectedInvoiceForCheckout?._id || currentInvoice?._id;
    if (targetId) {
      await pollPaymentConfirmation(targetId);
    } else {
      refreshInvoices();
    }
  };

  const formatBillingMonth = (monthStr: string) => {
    if (!monthStr) return 'Billing Cycle';
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  if (isCheckingResidency || (targetBookingId && !invoicesResponse && !isInvoicesError)) {
    return (
      <ScreenContainer>
        <AppHeader title="Rent & Invoices" showBack />
        <LoadingState message="Loading your invoices & dues..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <AppHeader
        title="Rent & Invoices"
        subtitle={
          isActiveResident
            ? 'Monthly rent schedule & secure Stripe payments'
            : 'Billing records for your stay'
        }
        showBack
      />

      {isInvoicesError && !invoicesResponse ? (
        <ErrorState
          title="Unable to Load Invoices"
          message="Your billing records could not be retrieved. Check your connection and try again."
          onRetry={refreshInvoices}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoadingInvoices}
              onRefresh={() => { void refreshInvoices(); }}
              tintColor={COLORS.primary}
            />
          }
        >
        {/* Dues Summary Banner */}
        {invoices.length > 0 && <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Total Outstanding Dues</Text>
              <Text style={[TYPOGRAPHY.h1, styles.summaryAmount]}>
                PKR {totalOutstandingDue.toLocaleString()}
              </Text>
            </View>
            <View
              style={[
                styles.summaryStatusBadge,
                totalOutstandingDue === 0
                  ? styles.summaryBadgeSettled
                  : styles.summaryBadgeDue,
              ]}
            >
              <Ionicons
                name={totalOutstandingDue === 0 ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={totalOutstandingDue === 0 ? COLORS.success : COLORS.danger}
              />
              <Text
                style={[
                  TYPOGRAPHY.captionSemiBold,
                  {
                    color: totalOutstandingDue === 0 ? COLORS.success : COLORS.danger,
                  },
                ]}
              >
                {totalOutstandingDue === 0 ? 'All Settled' : `${unpaidInvoices.length} Due`}
              </Text>
            </View>
          </View>

          {currentInvoice && currentInvoice.status !== 'Paid' && (
            <View style={styles.summaryDueDateRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.summaryDueDateText}>
                Nearest Due Date: {new Date(currentInvoice.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>}

        {/* Current Active Invoice Card */}
        {currentInvoice ? (
          <View style={styles.section}>
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>
              {currentInvoice.status === 'Paid' ? 'Current Cycle (Settled)' : 'Immediate Action Required'}
            </Text>

            <View style={styles.invoiceCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={[TYPOGRAPHY.bodySemiBold, styles.cardMonth]}>
                    {formatBillingMonth(currentInvoice.billingMonth)}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, styles.cardRef]}>
                    Cycle: {currentInvoice.billingMonth}
                  </Text>
                </View>
                <StatusBadge status={currentInvoice.status} />
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardDetailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Monthly Rent</Text>
                  <Text style={[TYPOGRAPHY.bodySemiBold, styles.detailValue]}>
                    PKR {currentInvoice.rentAmount?.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Due</Text>
                  <Text style={[TYPOGRAPHY.h3, styles.detailDueValue]}>
                    PKR {currentInvoice.totalDue?.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={[TYPOGRAPHY.bodySemiBold, styles.detailValue]}>
                    {new Date(currentInvoice.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                {currentInvoice.status !== 'Paid' ? (
                  <PrimaryButton
                    title={isInitiatingCheckout ? 'Generating Stripe Session...' : 'Pay with Card (Stripe)'}
                    onPress={() => handlePayNow(currentInvoice)}
                    isLoading={isInitiatingCheckout}
                    disabled={isInitiatingCheckout}
                    style={styles.payBtn}
                  />
                ) : (
                  <View style={styles.paidCallout}>
                    <Ionicons name="checkmark-done-circle" size={20} color={COLORS.success} />
                    <Text style={[TYPOGRAPHY.bodySemiBold, styles.paidCalloutText]}>
                      Paid in Full via Stripe
                    </Text>
                  </View>
                )}

                <SecondaryButton
                  title="View Invoice & Audit Details"
                  onPress={() =>
                    navigation.navigate('InvoiceDetail', { invoiceId: currentInvoice._id })
                  }
                  style={styles.detailsBtn}
                />
              </View>
            </View>
          </View>
        ) : null}

        {/* Historical Invoices */}
        {historicalInvoices.length > 0 && (
          <View style={styles.section}>
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Billing History</Text>
            {historicalInvoices.map((inv) => (
              <TouchableOpacity
                key={inv._id}
                style={styles.historyCard}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('InvoiceDetail', { invoiceId: inv._id })
                }
              >
                <View style={styles.historyHeader}>
                  <View>
                    <Text style={[TYPOGRAPHY.bodySemiBold, styles.historyMonth]}>
                      {formatBillingMonth(inv.billingMonth)}
                    </Text>
                    <Text style={[TYPOGRAPHY.caption, styles.historyDueDate]}>
                      Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <StatusBadge status={inv.status} />
                </View>

                <View style={styles.historyBottom}>
                  <Text style={[TYPOGRAPHY.caption, styles.historyAmountLabel]}>Amount:</Text>
                  <Text style={[TYPOGRAPHY.bodySemiBold, styles.historyAmount]}>
                    PKR {inv.totalDue?.toLocaleString()}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={styles.historyChevron} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {invoices.length === 0 && (
          <EmptyState
            icon="receipt-outline"
            title="No Invoices Yet"
            description={
              isActiveResident
                ? 'Your monthly rent invoice will appear here once the billing cycle is initiated by hostel administration.'
                : 'No invoice records found for your hostel stay.'
            }
          />
        )}
        </ScrollView>
      )}

      {/* Stripe Checkout In-Flight Modal */}
      <AppModal
        visible={showCheckoutModal}
        onClose={handleCloseCheckoutModal}
        title={isVerifyingStatus ? 'Verifying payment' : 'Stripe checkout'}
        subtitle={isVerifyingStatus
          ? verificationMessage
          : 'Complete your card payment in the Stripe Checkout window. Your invoice status updates after the server confirms payment.'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalIconBox}>
            <Ionicons name="card" size={32} color={COLORS.primary} />
          </View>
          <Text style={[TYPOGRAPHY.body, styles.modalDescription]}>
            The invoice is marked paid only after the signed Stripe webhook confirms settlement.
          </Text>
            <View style={styles.modalNoticeBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.success} />
              <Text style={[TYPOGRAPHY.caption, styles.modalNoticeText]}>
                Payments are processed via Stripe Connect. You can return here and check the confirmed status.
              </Text>
            </View>
            <View style={styles.modalButtonContainer}>
              <PrimaryButton
                title={isVerifyingStatus ? 'Verifying...' : 'Check Payment Status'}
                onPress={handleVerifyStatus}
                isLoading={isVerifyingStatus}
                disabled={isVerifyingStatus}
                style={styles.modalBtn}
              />

              <SecondaryButton
                title="Dismiss"
                onPress={handleCloseCheckoutModal}
                disabled={isVerifyingStatus}
                style={styles.modalBtn}
              />
            </View>
        </View>
      </AppModal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  summaryAmount: {
    color: COLORS.textPrimary,
  },
  summaryStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  summaryBadgeSettled: {
    backgroundColor: COLORS.successLight,
    borderColor: '#BBF7D0',
  },
  summaryBadgeDue: {
    backgroundColor: COLORS.dangerLight,
    borderColor: '#FECDD3',
  },
  summaryDueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  summaryDueDateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  invoiceCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
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
  cardHeaderLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  cardMonth: {
    color: COLORS.textPrimary,
  },
  cardRef: {
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  cardDetailsGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailValue: {
    color: COLORS.textPrimary,
  },
  detailDueValue: {
    color: COLORS.primary,
  },
  cardActions: {
    gap: SPACING.sm,
  },
  payBtn: {
    width: '100%',
  },
  detailsBtn: {
    width: '100%',
  },
  paidCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.successLight,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  paidCalloutText: {
    color: COLORS.success,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  historyMonth: {
    color: COLORS.textPrimary,
  },
  historyDueDate: {
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  historyAmountLabel: {
    color: COLORS.textMuted,
    marginRight: 4,
  },
  historyAmount: {
    color: COLORS.textPrimary,
    flex: 1,
  },
  historyChevron: {
    marginLeft: SPACING.xs,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalDescription: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  modalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceSubtle,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
  },
  modalNoticeText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  modalButtonContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  modalBtn: {
    width: '100%',
  },
});

