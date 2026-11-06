import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { HostelReviewCard } from '../../components/hostel/HostelReviewCard';
import { ReviewRating } from '../../components/hostel/ReviewRating';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useGetHostelByIdQuery, useGetHostelReviewsQuery } from '../../services/hostelApi';
import { useAppSelector } from '../../store/hooks';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import type { StudentStackParamList } from '../../navigation/types';

export function ReviewsScreen({ route }: NativeStackScreenProps<StudentStackParamList, 'Reviews'>) {
  const { hostelId } = route.params;
  const userId = useAppSelector((state) => state.auth.user?._id);
  const { currentData: hostelResponse, isFetching: isFetchingHostel, error: hostelError, refetch: refetchHostel } = useGetHostelByIdQuery(hostelId, { refetchOnMountOrArgChange: true });
  const { currentData: data, isFetching, error, refetch } = useGetHostelReviewsQuery(hostelId, { refetchOnMountOrArgChange: true });
  const hostel = hostelResponse?.data;
  const reviews = data?.data ?? [];
  const reviewCount = hostel?.reviewCount ?? reviews.length;
  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchHostel()]);
  };
  return (
    <ScreenContainer>
      <AppHeader title="Student reviews" subtitle={hostel?.name} showBack />
      {!data && !error ? <LoadingState message="Loading reviews..." /> : error && !data ? <ErrorState message="Unable to load reviews." onRetry={handleRefresh} /> : (
        <FlatList data={reviews} keyExtractor={(item) => item._id} initialNumToRender={6} windowSize={5}
          contentContainerStyle={styles.list} refreshing={isFetching || isFetchingHostel} onRefresh={handleRefresh}
          ListHeaderComponent={
            <View style={styles.summary}>
              <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>{reviewCount} resident reviews</Text>
              {hostel && reviewCount > 0 ? <ReviewRating rating={hostel.ratingAvg} /> : (
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                  {!hostel ? (hostelError ? 'Overall rating unavailable. Pull to refresh.' : 'Loading overall rating...') : 'No student ratings yet.'}
                </Text>
              )}
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>Feedback from students who have stayed at this hostel.</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          ListEmptyComponent={<EmptyState title="No reviews yet" description="Resident feedback will appear here." />}
          renderItem={({ item }) => <HostelReviewCard review={item} isOwn={(typeof item.residentId === 'object' ? item.residentId?._id : item.residentId) === userId} />}
        />
      )}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({ list: { padding: SPACING.lg, paddingBottom: SPACING.xxxl }, summary: { gap: SPACING.sm, marginBottom: SPACING.lg } });
