import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet, TouchableOpacity,
  FlatList,
  useWindowDimensions
} from 'react-native';
import { Image } from 'expo-image';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../store/hooks';
import { ReviewModal } from '../../components/hostel/ReviewModal';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { RoomTypeCard } from '../../components/hostel/RoomTypeCard';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { HostelReviewCard } from '../../components/hostel/HostelReviewCard';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { useResidencyStatus } from '../../hooks/useResidencyStatus';
import {
  useGetHostelByIdQuery,
  useGetRoomCatalogQuery,
  useGetHostelReviewsQuery,
  useGetHostelChatbotInfoQuery,
} from '../../services/hostelApi';
import { extractErrorMessage } from '../../utils/error';
import type { StudentStackParamList } from '../../navigation/types';



/**
 * Local 12-hour time formatter for HH:mm strings.
 * Formats "06:00" -> "6:00 AM", "23:00" -> "11:00 PM".
 * Safely falls back to original string if format is non-standard.
 */
const formatTime12h = (timeStr?: string): string => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return trimmed;

  const hours = parseInt(match[1], 10);
  const minutes = match[2];
  if (isNaN(hours) || hours < 0 || hours > 23) return trimmed;

  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}:${minutes} ${period}`;
};

type Props = NativeStackScreenProps<StudentStackParamList, 'HostelDetails'>;

export const HostelDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { hostelId } = route.params;
  const { width } = useWindowDimensions();
  const [galleryWidth, setGalleryWidth] = useState(width);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Queries
  const {
    data: hostelResponse,
    isLoading: isHostelLoading,
    isFetching: isHostelFetching,
    error: hostelError,
    refetch: refetchHostel,
  } = useGetHostelByIdQuery(hostelId);

  const {
    data: roomsResponse,
    isLoading: isRoomsLoading,
    isFetching: isRoomsFetching,
    isError: isRoomsError,
    refetch: refetchRooms,
  } = useGetRoomCatalogQuery(hostelId, { refetchOnMountOrArgChange: true });

  const {
    data: reviewsResponse,
    isLoading: isReviewsLoading,
    isFetching: isReviewsFetching,
    isError: isReviewsError,
    refetch: refetchReviews,
  } = useGetHostelReviewsQuery(hostelId);

  const {
    data: chatbotInfoResponse,
    isLoading: isChatbotInfoLoading,
    isFetching: isChatbotInfoFetching,
    refetch: refetchChatbotInfo,
  } = useGetHostelChatbotInfoQuery(hostelId);

  const hostel = hostelResponse?.data;
  const roomCatalog = roomsResponse?.data;
  const reviews = reviewsResponse?.data || [];
  const totalReviews = hostel?.reviewCount ?? reviews.length;
  const averageRating = hostel?.ratingAvg ?? 0;
  const chatbotInfo = chatbotInfoResponse?.data;

  // The gallery slider contains only the hostel's gallery images.
  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (hostel?.images && Array.isArray(hostel.images)) {
      hostel.images.forEach((img) => {
        if (img?.trim() && !list.includes(img.trim())) list.push(img.trim());
      });
    }
    return list;
  }, [hostel]);

  const residencyStatus = useResidencyStatus();
  const user = useAppSelector((state) => state.auth.user);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleRefresh = () => {
    void Promise.all([
      refetchHostel(),
      refetchRooms(),
      refetchReviews(),
      refetchChatbotInfo(),
      residencyStatus.refetch(),
    ]);
  };

  // Eligibility: student must have stayed at this hostel (CheckedIn or CheckedOut)
  const hasStayedAtThisHostel = useMemo(() => {
    return residencyStatus.allBookings.some((b) => {
      const isEligibleStatus = b.status === 'CheckedIn' || b.status === 'CheckedOut';
      if (!isEligibleStatus) return false;
      const roomObj = typeof b.roomId === 'object' ? b.roomId : null;
      const bookingHostelId = roomObj?.hostelId
        ? typeof roomObj.hostelId === 'object'
          ? (roomObj.hostelId as any)?._id
          : roomObj.hostelId
        : null;
      return bookingHostelId === hostelId;
    });
  }, [residencyStatus.allBookings, hostelId]);

  // Check if current user has already reviewed this hostel
  const userExistingReview = useMemo(() => {
    if (!user?._id) return null;
    return (
      reviews.find((rev) => {
        const reviewerId = typeof rev.residentId === 'object' ? rev.residentId?._id : rev.residentId;
        return reviewerId === user._id || reviewerId === (user as any)?.id;
      }) || null
    );
  }, [reviews, user]);

  if (isHostelLoading) {
    return (
      <ScreenContainer>
        <AppHeader title="Hostel details" showBack />
        <LoadingState message="Loading hostel details..." />
      </ScreenContainer>
    );
  }

  if (hostelError || !hostel) {
    return (
      <ScreenContainer>
        <AppHeader title="Hostel details" showBack />
        <ErrorState
          title="Hostel Not Found"
          message={extractErrorMessage(hostelError, 'Unable to load property information.')}
          onRetry={refetchHostel}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scrollable
      refreshing={
        (isHostelFetching || isRoomsFetching || isReviewsFetching || isChatbotInfoFetching || residencyStatus.isFetching) &&
        !isHostelLoading && !isRoomsLoading && !isReviewsLoading && !isChatbotInfoLoading
      }
      onRefresh={handleRefresh}
    >
      <AppHeader title="Hostel details" subtitle="Rooms, facilities and resident reviews" showBack onBack={() => navigation.goBack()} />

      {/* Image Gallery */}
      <View style={[styles.galleryContainer, galleryImages.length === 0 && styles.galleryContainerEmpty]}
        onLayout={({ nativeEvent }) => {
          if (nativeEvent.layout.width !== galleryWidth) { setGalleryWidth(nativeEvent.layout.width); setActiveImageIndex(0); }
        }}>
        {galleryImages.length > 0 ? (
          <>
            <FlatList
              key={galleryWidth}
              data={galleryImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `${item}-${index}`}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / galleryWidth);
                setActiveImageIndex(idx);
              }}
              renderItem={({ item, index }) => (
                <Image
                  source={{ uri: item }}
                  style={[styles.galleryImage, { width: galleryWidth }]}
                  contentFit="cover"
                  transition={180}
                  cachePolicy="memory-disk"
                  accessibilityLabel={`Hostel gallery photo ${index + 1} of ${galleryImages.length}`}
                />
              )}
            />
            {galleryImages.length > 1 && (
              <View style={styles.indicatorContainer}>
                {galleryImages.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.indicatorDot,
                      idx === activeImageIndex && styles.indicatorDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
            <View style={styles.photoCounter} accessible accessibilityLabel={`Photo ${activeImageIndex + 1} of ${galleryImages.length}`}>
              <Ionicons name="image-outline" size={14} color={COLORS.textInverse} />
              <Text style={[TYPOGRAPHY.captionSemiBold, styles.photoCounterText]}>{activeImageIndex + 1} / {galleryImages.length}</Text>
            </View>
          </>
        ) : (
          <View style={styles.galleryFallback}>
            <Ionicons name="business" size={60} color={COLORS.textMuted} />
            <Text style={[TYPOGRAPHY.caption, styles.fallbackText]}>
              No property photos uploaded
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Title, Rating & Starting Price */}
        <View style={styles.headerSection}>
          <View style={styles.propertyEyebrow}>
            <View style={styles.categoryTag}>
              <Ionicons name="business-outline" size={14} color={COLORS.primary} />
              <Text style={styles.categoryTagText}>Student hostel</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={15} color="#EAB308" />
              <Text style={styles.ratingValue}>
                {hostel.ratingAvg > 0 ? hostel.ratingAvg.toFixed(1) : 'New'}
              </Text>
              <Text style={styles.reviewCount}>({hostel.reviewCount})</Text>
            </View>
          </View>
          <Text accessibilityRole="header" style={[TYPOGRAPHY.h1, styles.name]}>{hostel.name}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={COLORS.primary} />
            <Text style={[TYPOGRAPHY.body, styles.locationText]}>
              {hostel.location}
            </Text>
          </View>

          <View style={styles.priceBanner}>
            <View style={styles.rentContent}>
              <Text style={styles.priceBannerLabel}>Starting monthly rent</Text>
              <Text style={[TYPOGRAPHY.h2, styles.priceBannerValue]}>
                PKR {hostel.priceTier?.toLocaleString() || '—'}
                <Text style={styles.perMonthText}> / mo</Text>
              </Text>
            </View>
            <View style={styles.rentIcon}>
              <Ionicons name="bed-outline" size={24} color={COLORS.primary} />
            </View>
          </View>
        </View>

        {/* Facilities Section */}
        {hostel.facilities && hostel.facilities.length > 0 && (
          <View style={styles.section}>
            <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>
              Amenities & Facilities
            </Text>
            <View style={styles.facilitiesGrid}>
              {hostel.facilities.map((fac, idx) => (
                <View key={`${fac}-${idx}`} style={styles.facilityCard}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                  <Text style={styles.facilityLabel}>{fac}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ask Hostel Assistant Quick Banner */}
        <TouchableOpacity
          style={styles.chatActionBanner}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('Chatbot', {
              hostelId: hostel?._id || hostelId,
              hostelName: hostel?.name,
              mode: 'seeker',
            })
          }
        >
          <View style={styles.chatBannerLeft}>
            <View style={styles.chatBannerIconBox}>
              <Ionicons name="sparkles" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.chatBannerTextContainer}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.chatBannerTitle]}>
                Ask about {hostel.name}
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.chatBannerSubtitle]}>
                Have questions on rules, timings, or policies? Ask AI
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Public Property Information (Timings, Rules, Contact, Landmarks) */}
        {(() => {
          const propInfo = hostel?.propertyInfo || {
            gateOpenTime: chatbotInfo?.gateOpenTime,
            gateCloseTime: chatbotInfo?.gateCloseTime,
            houseRules: chatbotInfo?.houseRules || chatbotInfo?.rules,
            receptionContact: chatbotInfo?.receptionContact || chatbotInfo?.contactNumber,
            nearbyLandmarks: chatbotInfo?.nearbyLandmarks,
          };
          const rawGateOpen = propInfo.gateOpenTime || chatbotInfo?.gateOpenTime;
          const rawGateClose = propInfo.gateCloseTime || chatbotInfo?.gateCloseTime;
          const gateOpen = rawGateOpen ? formatTime12h(rawGateOpen) : '';
          const gateClose = rawGateClose ? formatTime12h(rawGateClose) : '';
          const contact = propInfo.receptionContact || chatbotInfo?.receptionContact || chatbotInfo?.contactNumber;
          const landmarks = propInfo.nearbyLandmarks || chatbotInfo?.nearbyLandmarks;
          const rules = (propInfo.houseRules && propInfo.houseRules.length > 0)
            ? propInfo.houseRules
            : (chatbotInfo?.houseRules || chatbotInfo?.rules || []);
          const visibleRules = rules.slice(0, 5);

          const hasInfo = Boolean(gateOpen || gateClose || contact || landmarks || rules.length > 0);
          if (!hasInfo) return null;

          return (
            <View style={styles.section}>
              <Text style={[TYPOGRAPHY.h3, styles.sectionTitle]}>Property Information</Text>
              <View style={styles.infoCard}>
                {gateOpen ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Gate Opens:</Text>
                    <Text style={styles.infoVal}>{gateOpen}</Text>
                  </View>
                ) : null}

                {gateClose ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Gate Closes:</Text>
                    <Text style={styles.infoVal}>{gateClose}</Text>
                  </View>
                ) : null}

                {contact ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Reception Contact:</Text>
                    <Text style={styles.infoVal}>{contact}</Text>
                  </View>
                ) : null}

                {landmarks ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Nearby Landmarks:</Text>
                    <Text style={styles.infoVal}>{landmarks}</Text>
                  </View>
                ) : null}

                {rules.length > 0 ? (
                  <View style={styles.rulesSection}>
                    <Text style={styles.rulesHeading}>House Rules:</Text>
                    {visibleRules.map((rule, idx) => (
                      <Text key={idx} style={styles.ruleItem}>
                        • {rule}
                      </Text>
                    ))}
                    {rules.length > 5 ? (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`View all ${rules.length} house rules`}
                        activeOpacity={0.7}
                        style={styles.rulesToggle}
                        onPress={() => navigation.navigate('HouseRules', { hostelId })}
                      >
                        <Text style={styles.rulesToggleText}>
                          View all {rules.length} rules
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })()}

        {/* Room layouts keep this overview short, regardless of room count. */}
        <View style={styles.section}>
          <Text style={[TYPOGRAPHY.h2, styles.sectionTitle]}>Rooms & availability</Text>
          <Text style={[TYPOGRAPHY.caption, styles.sectionSubtitle]}>
            Compare layouts, then choose a specific room.
          </Text>
          {isRoomsLoading ? (
            <LoadingState message="Checking room availability..." />
          ) : isRoomsError && !roomsResponse ? (
            <ErrorState title="Unable to Load Rooms" message="Room availability could not be retrieved. Please try again." onRetry={refetchRooms} />
          ) : !roomCatalog || roomCatalog.summary.totalRooms === 0 ? (
            <EmptyState icon="bed-outline" title="No rooms listed yet" description="This property does not currently have any rooms registered." />
          ) : (
            <View style={styles.roomsList}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
                {roomCatalog.summary.totalRooms} rooms · {roomCatalog.summary.availableRooms} available · {roomCatalog.summary.availableBeds} beds available
              </Text>
              {isRoomsError && <ErrorState message="Could not refresh availability. Try again for the latest counts." onRetry={refetchRooms} />}
              {roomCatalog.types.map((summary) => (
                <RoomTypeCard key={summary.layoutType} summary={summary}
                  onPress={() => navigation.navigate('Rooms', { hostelId, layoutType: summary.layoutType })} />
              ))}
              <SecondaryButton title={`View all ${roomCatalog.summary.totalRooms} rooms`}
                onPress={() => navigation.navigate('Rooms', { hostelId })}
                icon={<Ionicons name="arrow-forward" size={18} color={COLORS.primary} />} />
            </View>
          )}
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.reviewsSectionHeader}>
            <View style={styles.reviewsHeading}>
              <Text style={[TYPOGRAPHY.h2, styles.sectionTitle]}>
                Student reviews
              </Text>
              <Text style={[TYPOGRAPHY.caption, styles.reviewsSubcaption]}>
                Ratings and experiences from hostel residents
              </Text>
            </View>

            {hasStayedAtThisHostel && !userExistingReview && (
              <TouchableOpacity
                style={styles.writeReviewBtn}
                activeOpacity={0.8}
                onPress={() => setShowReviewModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Write a hostel review"
              >
                <Ionicons name="create-outline" size={15} color={COLORS.surface} />
                <Text style={styles.writeReviewBtnText}>Write Review</Text>
              </TouchableOpacity>
            )}
          </View>

          <View accessible accessibilityLabel={totalReviews > 0 && Number.isFinite(averageRating) ? 'Overall rating ' + averageRating.toFixed(1) + ' out of 5 from ' + totalReviews + ' reviews' : 'No ratings yet'} style={styles.reviewSummary}>
            <View style={styles.reviewSummaryScore}>
              <Ionicons name={totalReviews > 0 ? 'star' : 'star-outline'} size={26} color={COLORS.warning} />
              <Text style={[TYPOGRAPHY.display, styles.reviewAverage]}>{totalReviews > 0 && Number.isFinite(averageRating) ? averageRating.toFixed(1) : '\u2014'}<Text style={[TYPOGRAPHY.body, styles.reviewScale]}> / 5</Text></Text>
            </View>
            <View style={styles.reviewSummaryCopy}>
              <Text style={[TYPOGRAPHY.bodySemiBold, styles.reviewAverage]}>Overall rating</Text>
              <Text style={[TYPOGRAPHY.caption, styles.reviewScale]}>{totalReviews > 0 ? 'Based on ' + totalReviews + ' student ' + (totalReviews === 1 ? 'review' : 'reviews') : 'No student ratings yet'}</Text>
            </View>
          </View>

          {!hasStayedAtThisHostel && (
            <View style={styles.eligibilityNoteCard}>
              <Ionicons name="shield-checkmark-outline" size={15} color={COLORS.primary} />
              <Text style={styles.eligibilityNoteText}>
                Reviews are verified and submitted only by students who have stayed at this hostel.
              </Text>
            </View>
          )}

          {isReviewsLoading ? (
            <LoadingState message="Loading student reviews..." />
          ) : isReviewsError && !reviewsResponse ? (
            <ErrorState
              title="Unable to Load Reviews"
              message="Student reviews could not be retrieved. Please try again."
              onRetry={refetchReviews}
            />
          ) : reviews.length === 0 ? (
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="No Reviews Yet"
              description="Be the first resident to share your experience after staying at this hostel."
            />
          ) : (
            <View style={styles.reviewsList}>
              {[
                ...reviews.filter((review) => review._id === userExistingReview?._id),
                ...reviews.filter((review) => review._id !== userExistingReview?._id),
              ].slice(0, 3).map((review) => (
                <HostelReviewCard key={review._id} review={review} isOwn={review._id === userExistingReview?._id} />
              ))}
              <SecondaryButton title={`View all ${reviews.length} reviews`} onPress={() => navigation.navigate('Reviews', { hostelId })} />
            </View>
          )}
        </View>
      </View>

      {/* Review Submission Modal */}
      <ReviewModal
        visible={showReviewModal}
        hostelId={hostelId}
        hostelName={hostel?.name || 'Hostel'}
        onClose={() => setShowReviewModal(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  propertyEyebrow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  rentContent: { flex: 1, minWidth: 0 },
  rentIcon: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceHover, alignItems: 'center', justifyContent: 'center' },
  photoCounter: { position: 'absolute', right: SPACING.md, bottom: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.backdrop, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full },
  photoCounterText: { color: COLORS.textInverse },
  galleryContainer: {
    height: 220, alignSelf: 'stretch', marginHorizontal: SPACING.xl, marginTop: SPACING.lg, borderRadius: RADIUS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderSoft, backgroundColor: COLORS.surfaceSubtle, position: 'relative',
  },
  galleryContainerEmpty: { height: 132, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft },
  galleryImage: {
    width: '100%',
    height: 220,
  },
  galleryFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    gap: 8,
  },
  fallbackText: {
    color: COLORS.textMuted,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorDotActive: {
    backgroundColor: COLORS.textInverse,
    width: 16,
  },
  content: {
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.xxxl,
  },
  headerSection: {
    marginBottom: SPACING.xxl,
  },
  name: {
    color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.sm,
  },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warningLight, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.full, gap: 4,
  },
  ratingValue: {
    ...TYPOGRAPHY.captionSemiBold, color: COLORS.warningText,
  },
  reviewCount: {
    ...TYPOGRAPHY.caption, color: COLORS.warningText,
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs, marginBottom: SPACING.lg,
  },
  locationText: {
    color: COLORS.textSecondary,
    flex: 1,
  },
  priceBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  priceBannerLabel: {
    ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.xs,
  },
  priceBannerValue: {
    ...TYPOGRAPHY.h1, color: COLORS.primary,
  },
  perMonthText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  categoryTag: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceHover, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, gap: 6,
  },
  categoryTagText: {
    ...TYPOGRAPHY.captionMedium, color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityCard: {
    flexDirection: 'row', alignItems: 'center', maxWidth: '100%', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  facilityLabel: {
    ...TYPOGRAPHY.bodySmall, color: COLORS.textPrimary, flexShrink: 1,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },
  infoKey: {
    ...TYPOGRAPHY.caption, flex: 1, minWidth: 0, color: COLORS.textSecondary,
  },
  infoVal: {
    ...TYPOGRAPHY.bodyMedium, flex: 1.6, minWidth: 0, color: COLORS.textPrimary, textAlign: 'right',
  },
  rulesSection: {
    marginTop: SPACING.xs,
  },
  rulesHeading: {
    ...TYPOGRAPHY.bodySemiBold, color: COLORS.textPrimary, marginBottom: SPACING.sm,
  },
  ruleItem: {
    ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginBottom: SPACING.xs,
  },
  rulesToggle: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: SPACING.xs, marginTop: SPACING.xs,
  },
  rulesToggleText: {
    ...TYPOGRAPHY.captionSemiBold, color: COLORS.primary,
  },
  roomsList: {
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  reviewsList: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  chatActionBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.infoLight, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.infoBorder, marginBottom: SPACING.xxl, gap: SPACING.sm,
  },
  chatBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  chatBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBannerTextContainer: {
    flex: 1,
  },
  chatBannerTitle: {
    color: COLORS.textPrimary,
  },
  chatBannerSubtitle: {
    ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.xs,
  },
  reviewsHeading: { flex: 1, minWidth: 160 },
  reviewSummary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  reviewSummaryScore: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  reviewAverage: { color: COLORS.textPrimary },
  reviewScale: { color: COLORS.textSecondary },
  reviewSummaryCopy: { flex: 1, minWidth: 140, gap: SPACING.xs },
  reviewsSectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  reviewsSubcaption: {
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  writeReviewBtn: {
    minHeight: 48,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  writeReviewBtnText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '600',
  },
  eligibilityNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  eligibilityNoteText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
});

