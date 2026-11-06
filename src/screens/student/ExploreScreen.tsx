import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { HostelCard } from '../../components/hostel/HostelCard';
import { FilterModal } from '../../components/hostel/FilterModal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { useGetExploreHostelsPageQuery } from '../../services/hostelApi';
import { extractErrorMessage } from '../../utils/error';
import type { HostelSearchParams, Hostel, HostelExploreSort } from '../../types/api';
import type { StudentStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<StudentStackParamList>;

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // Search is sent to the API after a short pause while typing.
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<HostelExploreSort>('rating');
  const [page, setPage] = useState(1);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [totalHostels, setTotalHostels] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);

  // B. Server-side filters configured via FilterModal (location, maxPrice, facilities)
  const [serverFilters, setServerFilters] = useState<HostelSearchParams>({});
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const backendQueryParams: HostelSearchParams = useMemo(() => {
    return {
      location: serverFilters.location?.trim() || undefined,
      maxPrice: serverFilters.maxPrice,
      facilities: serverFilters.facilities,
    };
  }, [serverFilters]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchText.trim()), 350);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const filterKey = useMemo(() => JSON.stringify({
    q: debouncedSearch,
    filters: backendQueryParams,
    sort,
  }), [debouncedSearch, backendQueryParams, sort]);

  useEffect(() => {
    loadingMoreRef.current = false;
    setPage(1);
    setHostels([]);
    setTotalHostels(0);
    setHasMore(true);
  }, [filterKey]);

  const queryParams = useMemo(() => ({
    ...backendQueryParams,
    q: debouncedSearch,
    page,
    limit: 12,
    sort,
  }), [backendQueryParams, debouncedSearch, page, sort]);

  const {
    currentData: hostelsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetExploreHostelsPageQuery(queryParams, { refetchOnMountOrArgChange: true });

  const refreshResults = () => {
    loadingMoreRef.current = false;
    if (page === 1) { void refetch(); return; }
    setHostels([]);
    setHasMore(true);
    setPage(1);
  };

  useEffect(() => {
    if (!isFetching) loadingMoreRef.current = false;
  }, [isFetching]);

  useEffect(() => {
    const resultPage = hostelsResponse?.data;
    if (!resultPage) return;

    setHostels((previous) => {
      if (resultPage.page === 1) return resultPage.items;
      const merged = new Map(previous.map((hostel) => [hostel._id, hostel]));
      resultPage.items.forEach((hostel) => merged.set(hostel._id, hostel));
      return Array.from(merged.values());
    });
    setTotalHostels(resultPage.total);
    setHasMore(resultPage.hasMore);
  }, [hostelsResponse]);

  // Count active modal filters
  const activeModalFilterCount = useMemo(() => {
    let count = 0;
    if (serverFilters.location?.trim()) count++;
    if (serverFilters.maxPrice !== undefined) count++;
    if (
      serverFilters.facilities &&
      (Array.isArray(serverFilters.facilities)
        ? serverFilters.facilities.length > 0
        : !!serverFilters.facilities)
    ) {
      count++;
    }
    return count;
  }, [serverFilters]);

  const handleClearSearch = () => {
    setSearchText('');
  };

  const handleResetAll = () => {
    setSearchText('');
    setServerFilters({});
    setSort('rating');
  };

  const sortLabels: Record<HostelExploreSort, string> = {
    rating: 'Top rated',
    'price-asc': 'Lowest price',
    'price-desc': 'Highest price',
  };

  const cycleSort = () => {
    setSort((current) => current === 'rating'
      ? 'price-asc'
      : current === 'price-asc'
        ? 'price-desc'
        : 'rating');
  };

  const loadNextPage = () => {
    if (!error && !isFetching && hasMore && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      setPage((current) => current + 1);
    }
  };

  const handleRemoveLocationFilter = () => {
    setServerFilters((prev) => ({ ...prev, location: undefined }));
  };

  const handleRemoveMaxPrice = () => {
    setServerFilters((prev) => ({ ...prev, maxPrice: undefined }));
  };

  const handleRemoveFacilities = () => {
    setServerFilters((prev) => ({ ...prev, facilities: undefined }));
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState message="Discovering hostels..." />;
    }

    if (error && hostels.length === 0) {
      return (
        <ErrorState
          title="Unable to Load Hostels"
          message={extractErrorMessage(error, 'Could not retrieve hostels from server.')}
          onRetry={refetch}
        />
      );
    }

    if (hostels.length === 0 && !isFetching) {
      return (
        <EmptyState
          icon="business-outline"
          title="No Hostels Match Your Search"
          description="Try adjusting your search keywords, broadening budget limits, or clearing filters."
          actionTitle="Reset All Filters"
          onAction={handleResetAll}
        />
      );
    }

    return (
      <FlatList
        data={hostels}
        keyExtractor={(item: Hostel) => item._id}
        renderItem={({ item }) => (
          <HostelCard
            hostel={item}
            onPress={() => navigation.navigate('HostelDetails', { hostelId: item._id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.45}
        ListFooterComponent={isFetching && page > 1 ? (
          <View style={styles.loadMoreFooter}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={[TYPOGRAPHY.caption, styles.resultsCount]}>Loading more hostels…</Text>
          </View>
        ) : error && hostels.length > 0 ? (
          <TouchableOpacity style={styles.loadMoreFooter} onPress={() => { void refetch(); }}>
            <Text style={[TYPOGRAPHY.captionSemiBold, styles.resultsTitle]}>Could not load more. Tap to retry.</Text>
          </TouchableOpacity>
        ) : undefined}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refreshResults}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    );
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Explore Hostels"
        subtitle="Find and compare student accommodations"
      />

      {/* Visible General Search Bar & Filter Modal Trigger */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hostel, area, or landmark"
            placeholderTextColor={COLORS.textMuted}
            accessibilityLabel="Search hostels by name, location, or landmark"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearIcon}
              accessibilityRole="button"
              accessibilityLabel="Clear hostel search"
            >
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeModalFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setIsFilterModalVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open filters modal"
          accessibilityState={{ selected: activeModalFilterCount > 0 }}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeModalFilterCount > 0 ? COLORS.textInverse : COLORS.textPrimary}
          />
          {activeModalFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeModalFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips */}
      {(serverFilters.location || serverFilters.maxPrice || serverFilters.facilities) && (
        <ScrollView
          horizontal
          style={styles.horizontalFilters}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFiltersRow}
        >
          {serverFilters.location && (
            <TouchableOpacity
              style={styles.activeFilterChip}
              onPress={handleRemoveLocationFilter}
              accessibilityRole="button"
              accessibilityLabel={`Remove area filter: ${serverFilters.location}`}
            >
              <Text style={styles.activeFilterText}>
                Area: {serverFilters.location}
              </Text>
              <Ionicons name="close" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          {serverFilters.maxPrice && (
            <TouchableOpacity
              style={styles.activeFilterChip}
              onPress={handleRemoveMaxPrice}
              accessibilityRole="button"
              accessibilityLabel={`Remove maximum price filter: PKR ${serverFilters.maxPrice.toLocaleString()}`}
            >
              <Text style={styles.activeFilterText}>
                Up to PKR {serverFilters.maxPrice.toLocaleString()}
              </Text>
              <Ionicons name="close" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          {serverFilters.facilities && (
            <TouchableOpacity
              style={styles.activeFilterChip}
              onPress={handleRemoveFacilities}
              accessibilityRole="button"
              accessibilityLabel="Remove amenities filter"
            >
              <Text style={styles.activeFilterText}>
                {Array.isArray(serverFilters.facilities)
                  ? `${serverFilters.facilities.length} amenities`
                  : 'Selected amenities'}
              </Text>
              <Ionicons name="close" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Results Section */}
      <View style={styles.resultsContainer}>
        {!isLoading && !error && totalHostels > 0 ? (
          <View style={styles.resultsHeading}>
            <Text style={[TYPOGRAPHY.h3, styles.resultsTitle]}>Places to stay</Text>
            <View style={styles.resultsControls}>
              <Text style={[TYPOGRAPHY.caption, styles.resultsCount]}>{totalHostels} {totalHostels === 1 ? 'hostel' : 'hostels'}</Text>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={cycleSort}
                accessibilityRole="button"
                accessibilityLabel={`Sort hostels, current option ${sortLabels[sort]}`}
              >
                <Ionicons name="filter" size={15} color={COLORS.primary} />
                <Text style={[TYPOGRAPHY.captionSemiBold, styles.sortLabel]}>{sortLabels[sort]}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {renderContent()}
      </View>

      {/* Backend Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        initialFilters={serverFilters}
        onApply={(newFilters) => setServerFilters(newFilters)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.subtle,
    minWidth: 0,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.textPrimary,
    minWidth: 0,
  },
  clearIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: 'relative',
    ...SHADOWS.subtle,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: COLORS.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.sm,
    gap: 8,
  },
  horizontalFilters: {
    flexGrow: 0,
    flexShrink: 0,
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 4,
  },
  activeFilterText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  resultsHeading: { gap: SPACING.sm, paddingBottom: SPACING.md },
  resultsControls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  resultsTitle: { color: COLORS.textPrimary },
  resultsCount: { color: COLORS.textMuted },
  sortButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sortLabel: { color: COLORS.primary },
  loadMoreFooter: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
});
