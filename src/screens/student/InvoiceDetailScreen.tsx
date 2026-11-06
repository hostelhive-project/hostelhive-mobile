import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
  TouchableOpacity,
  Platform,
  Share,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { useFocusEffect, useIsFocused, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CopyableField } from '../../components/ui/CopyableField';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { AppModal } from '../../components/ui/AppModal';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { showDialog } from '../../utils/dialog';
import {
  useGetInvoiceByIdQuery,
  useListPaymentsForInvoiceQuery,
  useLazyGetPaymentBlockchainRecordQuery,
  useLazyGetInvoiceReceiptQuery,
  useInitiateCheckoutMutation,
} from '../../services/billingApi';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildInvoiceReceiptHtml, buildInvoiceReceiptText } from '../../utils/invoiceReceipt';
import type { StudentStackParamList } from '../../navigation/types';

import * as WebBrowser from 'expo-web-browser';

type RouteProps=RouteProp<StudentStackParamList, 'InvoiceDetail'>;

import { useAppSelector } from '../../store/hooks';
import { rememberCheckout } from '../../utils/checkoutContext';
import { useScreenOperation } from '../../hooks/useScreenOperation';

export const InvoiceDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const userId = useAppSelector((state) => state.auth.user?._id);
  const returnHandled = useRef<string | null>(null);
  const isFocused = useIsFocused();
  const { invoiceId } = route.params;
  const beginOperation = useScreenOperation(`${userId || ''}:${invoiceId}`);

  const {
    currentData: invoiceResponse,
    isLoading: isLoadingInvoice,
    isFetching: isFetchingInvoice,
    isError: isInvoiceError,
    refetch: refetchInvoice,
  } = useGetInvoiceByIdQuery(invoiceId);

  const {
    currentData: paymentsResponse,
    isLoading: isLoadingPayments,
    isFetching: isFetchingPayments,
    isError: isPaymentsError,
    refetch: refetchPayments,
  } = useListPaymentsForInvoiceQuery(invoiceId);

  const [initiateCheckout, { isLoading: isInitiatingCheckout }] = useInitiateCheckoutMutation();
  const [getPaymentBlockchainRecord, {
    isFetching: isFetchingBlockchainRecord,
    originalArgs: verifyingPaymentId,
  }] = useLazyGetPaymentBlockchainRecordQuery();
  const [getInvoiceReceipt, { isFetching: isLoadingReceipt }] = useLazyGetInvoiceReceiptQuery();

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isVerifyingStatus, setIsVerifyingStatus] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('Verifying payment with Stripe...');

  useFocusEffect(React.useCallback(() => {
    setShowCheckoutModal(false);
    setIsVerifyingStatus(false);
  }, [invoiceId, userId]));

  const handleCloseCheckoutModal = () => {
    if (!isVerifyingStatus) setShowCheckoutModal(false);
  };

  const invoice = invoiceResponse?.data;
  const payments = paymentsResponse?.data || [];

  const handleRefresh = async () => {
    await Promise.all([refetchInvoice(), refetchPayments()]);
  };

  // Controlled Webhook Delay Handling: retries up to 4 times with backoff
  const pollPaymentConfirmation = async () => {
    const operation = beginOperation('verification');
    if (!operation) return;
    try {
      setIsVerifyingStatus(true);
      setShowCheckoutModal(true);
      setVerificationMessage('Confirming payment with Stripe webhook...');

      for (let attempt = 1; attempt <= 4; attempt++) {
        if (!operation.isCurrent()) return;
        try {
          const [invRes] = await Promise.all([refetchInvoice().unwrap(), refetchPayments()]);
          if (!operation.isCurrent()) return;
          if (invRes?.data?.status === 'Paid') {
            setIsVerifyingStatus(false);
            setShowCheckoutModal(false);
            showDialog(
              'Payment Confirmed!',
              `Your payment of PKR ${invRes.data.totalDue.toLocaleString()} for ${invRes.data.billingMonth} has been received and confirmed via Stripe.`
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

  useEffect(() => {
    const status = route.params.paymentStatus;
    if (!status) { returnHandled.current = null; return; }
    const key = `${invoiceId}:${status}`;
    if (!isFocused || !invoice || returnHandled.current === key) return;
    returnHandled.current = key;
    navigation.setParams({ paymentStatus: undefined });
    if (status === 'success') void pollPaymentConfirmation();
    else { void handleRefresh(); showDialog('Checkout closed', 'Check the invoice status below. No payment is confirmed until the server receives payment confirmation.'); }
  }, [route.params?.paymentStatus, invoiceId, invoice, navigation, isFocused]);

  const handlePayNow = async () => {
    if (!invoice) return;
    if (invoice.status === 'Paid') {
      showDialog('Already Settled', 'This invoice has already been paid in full.');
      return;
    }

    const operation = beginOperation('checkout');
    if (!operation) return;
    try {
      await rememberCheckout(userId, invoice._id).catch(() => undefined);
      if (!operation.isCurrent()) return;
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
          await handleRefresh();
          return;
        }
        if (authResult?.type === 'success') {
          // In-app browser closed automatically on redirect -> trigger controlled refetch
          await pollPaymentConfirmation();
        } else if (authResult?.type === 'cancel' || authResult?.type === 'dismiss') {
          // The checkout window closed. Refresh the invoice, then return to the detail screen.
          setShowCheckoutModal(false);
          setIsVerifyingStatus(false);
          await handleRefresh();
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
    await pollPaymentConfirmation();
  };

  const loadReceipt = async () => {
    if (!invoice) throw new Error('Invoice details are still loading. Please try again.');
    const result = await getInvoiceReceipt(invoice._id).unwrap();
    if (!result.data) throw new Error('The receipt is not available yet. Please try again.');
    return result.data;
  };

  const handleSaveReceipt = async () => {
    try {
      const receipt = await loadReceipt();
      await Print.printAsync({ html: buildInvoiceReceiptHtml(receipt) });
    } catch (error: any) {
      showDialog('Unable to Open Receipt', error?.data?.message || error?.message || 'Please try again.');
    }
  };

  const handleShareReceipt = async () => {
    try {
      const receipt = await loadReceipt();
      const message = buildInvoiceReceiptText(receipt);
      if (Platform.OS === 'web') {
        await Share.share({ message, title: `HostelHive receipt ${receipt.receiptNumber}` });
        return;
      }

      const file = await Print.printToFileAsync({ html: buildInvoiceReceiptHtml(receipt) });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showDialog('Sharing Unavailable', 'This device cannot share the receipt PDF. Use Save / Print PDF instead.');
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `Share ${receipt.receiptNumber}`,
      });
    } catch (error: any) {
      showDialog('Unable to Share Receipt', error?.data?.message || error?.message || 'Please try again.');
    }
  };

  const handleViewPaymentOnExplorer = async (paymentId: string) => {
    try {
      const result = await getPaymentBlockchainRecord(paymentId).unwrap();
      const record = result.data;

      if (!record?.explorerUrl) {
        showDialog(
          'Explorer Link Unavailable',
          `This record is on ${record?.network || 'the configured ledger'}, but it does not have a public explorer transaction URL. It may have been recorded in simulated mode.`
        );
        return;
      }

      await Linking.openURL(record.explorerUrl);
    } catch (error: any) {
      showDialog(
        'Blockchain Record Unavailable',
        error?.data?.message || error?.message || 'Unable to load the public explorer link. Please try again.'
      );
    }
  };

  const formatBillingMonth = (monthStr?: string) => {
    if (!monthStr) return 'Billing Cycle';
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  if (!invoice && !isInvoiceError) {
    return (
      <ScreenContainer>
        <AppHeader title="Invoice details" showBack />
        <LoadingState message="Loading invoice details..." />
      </ScreenContainer>
    );
  }

  if (isInvoiceError || !invoice) {
    return (
      <ScreenContainer style={styles.container}>
        <AppHeader title="Invoice" showBack />
        <ErrorState
          title="Invoice Not Found"
          message="Unable to retrieve details for this invoice. It may not exist or you may not have access."
          onRetry={handleRefresh}
        />
      </ScreenContainer>
    );
  }

  const isPaid = invoice.status === 'Paid';

  return (
    <ScreenContainer style={styles.container}>
      <AppHeader
        title="Invoice Details"
        subtitle={`Cycle: ${invoice.billingMonth}`}
        showBack
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={(isFetchingInvoice || isFetchingPayments) && !isLoadingInvoice}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Main Invoice Card */}
        <View style={styles.invoiceCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[TYPOGRAPHY.h2, styles.monthTitle]}>
                {formatBillingMonth(invoice.billingMonth)}
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.invoiceIdText]}>
                Invoice ID: #{invoice._id.slice(-8).toUpperCase()}
              </Text>
              <CopyableField value={invoice._id} label="Invoice ID" leadingIcon="file-text" style={styles.copyField} />
            </View>
            <StatusBadge status={invoice.status} />
          </View>

          <View style={styles.divider} />

          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Rent Base Amount</Text>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.breakdownValue]}>
                PKR {invoice.rentAmount?.toLocaleString()}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Total Due</Text>
              <Text style={[TYPOGRAPHY.h3, styles.totalDueValue]}>
                PKR {invoice.totalDue?.toLocaleString()}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Due Date</Text>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.breakdownValue]}>
                {new Date(invoice.dueDate).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Issued On</Text>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.breakdownValue]}>
                {new Date(invoice.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Action button if unpaid */}
          {!isPaid ? (
            <View style={styles.actionSection}>
              <PrimaryButton
                title={isInitiatingCheckout ? 'Starting Stripe Session...' : 'Pay with Card (Stripe)'}
                onPress={handlePayNow}
                isLoading={isInitiatingCheckout}
                disabled={isInitiatingCheckout}
                style={styles.payBtn}
              />
              <Text style={styles.stripeNoteText}>
                Secure card payment through Stripe.
              </Text>
            </View>
          ) : (
            <View style={styles.paidActions}>
              <View style={styles.paidConfirmationBox}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <View style={styles.paidConfirmationTextGroup}>
                  <Text style={[TYPOGRAPHY.bodySemiBold, styles.paidConfirmationTitle]}>
                    {invoice.totalDue === 0 ? 'No payment required' : invoice.refundedAmount
                      ? 'Payment has a refund' : invoice.disputeStatus ? 'Payment has a dispute' : 'Payment Completed'}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, styles.paidConfirmationSubtitle]}>
                    {invoice.refundedAmount ? `Refunded: PKR ${invoice.refundedAmount.toLocaleString()}. See transaction adjustments below.`
                      : invoice.disputeStatus ? `Dispute status: ${invoice.disputeStatus}.`
                        : invoice.totalDue === 0 ? 'This invoice has no rent due.' : 'Your payment has been confirmed.'}
                  </Text>
                </View>
              </View>
              <View style={styles.receiptActions}>
                <SecondaryButton
                  title={isLoadingReceipt ? 'Preparing receipt...' : 'Save / Print PDF'}
                  onPress={handleSaveReceipt}
                  isLoading={isLoadingReceipt}
                  disabled={isLoadingReceipt}
                  style={styles.receiptButton}
                />
                <SecondaryButton
                  title={isLoadingReceipt ? 'Preparing receipt...' : 'Share receipt'}
                  onPress={handleShareReceipt}
                  isLoading={isLoadingReceipt}
                  disabled={isLoadingReceipt}
                  style={styles.receiptButton}
                />
              </View>
            </View>
          )}
        </View>

        {/* Payment History / Transactions Section */}
        <View style={styles.transactionsSection}>
          <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Payment Transactions</Text>

          {isLoadingPayments ? (
            <LoadingState message="Loading payment history..." />
          ) : isPaymentsError && !paymentsResponse ? (
            <ErrorState
              title="Unable to Load Payment History"
              message="Payment transactions could not be retrieved. Please try again."
              onRetry={refetchPayments}
            />
          ) : payments.length === 0 ? (
            <View style={styles.emptyPaymentsBox}>
              <Ionicons name="card-outline" size={32} color={COLORS.textMuted} />
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.emptyPaymentsTitle]}>
                No Payments Recorded
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.emptyPaymentsSubtitle]}>
                No transaction attempts have been logged for this invoice yet.
              </Text>
            </View>
          ) : (
            payments.map((p) => (
              <View key={p._id} style={styles.paymentCard}>
                <View style={styles.paymentCardHeader}>
                  <View style={styles.paymentMethodRow}>
                    <View style={styles.methodIconBox}>
                      <Ionicons name="card" size={18} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={[TYPOGRAPHY.bodySemiBold, styles.paymentMethodTitle]}>
                        {p.paymentMethod} Payment
                      </Text>
                      <Text style={[TYPOGRAPHY.caption, styles.paymentDateText]}>
                        {new Date(p.transactionDate || p.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={p.paymentStatus} />
                </View>

                <View style={styles.paymentDivider} />

                <View style={styles.paymentDetailsGrid}>
                  {(p.refundedAmount || p.disputeStatus) ? (
                    <Text style={[TYPOGRAPHY.caption, { color: COLORS.warning }]}>
                      {p.refundedAmount ? `Refunded: PKR ${p.refundedAmount.toLocaleString()}. ` : ''}
                      {p.disputeStatus ? `Dispute: ${p.disputeStatus}.` : ''}
                    </Text>
                  ) : null}
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Amount</Text>
                    <Text style={[TYPOGRAPHY.bodySemiBold, styles.paymentDetailValue]}>
                      PKR {p.amount?.toLocaleString()}
                    </Text>
                  </View>

                  {p.transactionReference ? (
                    <View style={styles.copySection}>
                      <Text style={styles.paymentDetailLabel}>{p.paymentMethod === 'Card' ? 'Stripe Session ID' : 'Payment Reference'}</Text>
                      <CopyableField value={p.transactionReference} label={p.paymentMethod === 'Card' ? 'Stripe session ID' : 'Payment reference'} leadingIcon="card-outline" />
                    </View>
                  ) : null}

                  {/* Blockchain Audit Record */}
                  <View style={styles.blockchainRow}>
                    <View style={styles.blockchainSummaryRow}>
                      <View style={styles.blockchainHeader}>
                        <Ionicons
                          name={p.blockchainRef ? 'shield-checkmark' : 'time-outline'}
                          size={16}
                          color={p.blockchainRef ? COLORS.success : COLORS.warning}
                        />
                        <Text style={styles.blockchainLabel}>Blockchain Audit Ref</Text>
                      </View>
                      {p.blockchainRef ? (
                        <CopyableField value={p.blockchainRef} label="Blockchain audit reference" leadingIcon="shield-checkmark-outline" />
                      ) : (
                        <Text style={[TYPOGRAPHY.caption, styles.blockchainPendingText]}>
                          {p.paymentStatus === 'Paid'
                            ? 'Audit reference pending'
                            : 'Not generated'}
                        </Text>
                      )}
                    </View>
                    {p.blockchainRef && (
                      <TouchableOpacity
                        style={styles.explorerButton}
                        onPress={() => handleViewPaymentOnExplorer(p._id)}
                        disabled={isFetchingBlockchainRecord}
                        accessibilityRole="button"
                        accessibilityLabel="View payment audit record on blockchain explorer"
                      >
                        <Text style={[TYPOGRAPHY.captionSemiBold, styles.explorerButtonText]}>
                          {isFetchingBlockchainRecord && verifyingPaymentId === p._id
                            ? 'Loading explorer link...'
                            : 'View on Explorer'}
                        </Text>
                        {!(isFetchingBlockchainRecord && verifyingPaymentId === p._id) && (
                          <Ionicons name="open-outline" size={16} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Stripe In-Flight Modal */}
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
            <View style={styles.modalButtonContainer}>
              <PrimaryButton
                title={isVerifyingStatus ? 'Verifying...' : 'Check Payment Status'}
                onPress={handleVerifyStatus}
                isLoading={isVerifyingStatus}
                disabled={isVerifyingStatus}
                style={styles.modalBtn}
              />

              <SecondaryButton
                title="Close"
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
  invoiceCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  monthTitle: {
    color: COLORS.textPrimary,
  },
  invoiceIdText: {
    color: COLORS.textMuted,
    marginTop: 2,
  },
  copyField: { marginTop: SPACING.sm },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.lg,
  },
  breakdownContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  breakdownLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  breakdownValue: {
    color: COLORS.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  totalDueValue: {
    color: COLORS.primary,
  },
  actionSection: {
    marginTop: SPACING.xs,
  },
  payBtn: {
    width: '100%',
  },
  stripeNoteText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  paidConfirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.successLight,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  paidActions: {
    gap: SPACING.md,
  },
  receiptActions: {
    gap: SPACING.sm,
  },
  receiptButton: {
    width: '100%',
  },
  paidConfirmationTextGroup: {
    flex: 1,
  },
  paidConfirmationTitle: {
    color: COLORS.success,
  },
  paidConfirmationSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  transactionsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyPaymentsBox: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.xs,
  },
  emptyPaymentsTitle: {
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  emptyPaymentsSubtitle: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 12,
  },
  paymentCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodTitle: {
    color: COLORS.textPrimary,
  },
  paymentDateText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  paymentDetailsGrid: {
    gap: SPACING.sm,
  },
  copySection: { gap: SPACING.xs },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDetailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  paymentDetailValue: {
    color: COLORS.textPrimary,
  },
  blockchainRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: SPACING.xs,
  },
  blockchainSummaryRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: SPACING.sm,
    minWidth: 0,
  },
  blockchainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blockchainLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  blockchainPendingText: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  explorerButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  explorerButtonText: {
    color: COLORS.primary,
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
    marginBottom: SPACING.lg,
  },
  modalButtonContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  modalBtn: {
    width: '100%',
  },
});

