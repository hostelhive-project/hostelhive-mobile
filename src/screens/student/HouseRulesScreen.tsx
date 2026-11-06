import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { RADIUS, SHADOWS, SPACING } from '../../constants/layout';
import {
  useGetHostelByIdQuery,
  useGetHostelChatbotInfoQuery,
} from '../../services/hostelApi';
import type { StudentStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<StudentStackParamList, 'HouseRules'>;

export const HouseRulesScreen: React.FC<Props> = ({ route }) => {
  const { hostelId } = route.params;
  const [searchText, setSearchText] = useState('');

  const {
    data: hostelResponse,
    isLoading: isHostelLoading,
    isFetching: isHostelFetching,
    isError: isHostelError,
    refetch: refetchHostel,
  } = useGetHostelByIdQuery(hostelId);
  const {
    data: chatbotInfoResponse,
    isLoading: isChatbotInfoLoading,
    isFetching: isChatbotInfoFetching,
    isError: isChatbotInfoError,
    refetch: refetchChatbotInfo,
  } = useGetHostelChatbotInfoQuery(hostelId);

  const hostel = hostelResponse?.data;
  const chatbotInfo = chatbotInfoResponse?.data;
  const rules = useMemo(() => {
    const propertyRules = hostel?.propertyInfo?.houseRules;
    const chatbotRules = chatbotInfo?.houseRules || chatbotInfo?.rules || [];
    const sourceRules = propertyRules?.length ? propertyRules : chatbotRules;

    return sourceRules
      .filter((rule): rule is string => typeof rule === 'string')
      .map((rule) => rule.trim())
      .filter(Boolean);
  }, [hostel?.propertyInfo?.houseRules, chatbotInfo?.houseRules, chatbotInfo?.rules]);

  const filteredRules = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    if (!query) return rules;
    return rules.filter((rule) => rule.toLocaleLowerCase().includes(query));
  }, [rules, searchText]);

  const handleRetry = () => {
    void Promise.all([refetchHostel(), refetchChatbotInfo()]);
  };

  const isLoading = rules.length === 0 && (isHostelLoading || isChatbotInfoLoading);
  const hasError = rules.length === 0 && !isLoading && (isHostelError || isChatbotInfoError);

  return (
    <ScreenContainer style={styles.container}>
      <AppHeader title="House rules" subtitle={hostel?.name || 'Hostel'} showBack />

      {isLoading ? (
        <LoadingState message="Loading house rules..." />
      ) : hasError ? (
        <ErrorState
          title="Unable to Load House Rules"
          message="The hostel rules could not be retrieved. Please try again."
          onRetry={handleRetry}
        />
      ) : (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={19} color={COLORS.textMuted} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search house rules"
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
              accessibilityLabel="Search house rules"
            />
            {searchText.length > 0 ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setSearchText('')}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="close-circle" size={19} color={COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <FlatList
            data={filteredRules}
            refreshControl={(
              <RefreshControl
                refreshing={
                  (isHostelFetching || isChatbotInfoFetching) &&
                  !isHostelLoading && !isChatbotInfoLoading
                }
                onRefresh={handleRetry}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
                progressBackgroundColor={COLORS.surface}
              />
            )}
            keyExtractor={(rule, index) => `${index}-${rule}`}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[
              styles.listContent,
              filteredRules.length === 0 && styles.emptyListContent,
            ]}
            ListHeaderComponent={(
              <View style={styles.listHeader}>
                <Text style={[TYPOGRAPHY.bodySemiBold, styles.countText]}>
                  {searchText.trim()
                    ? `${filteredRules.length} of ${rules.length} rules`
                    : `${rules.length} ${rules.length === 1 ? 'rule' : 'rules'}`}
                </Text>
                <Text style={[TYPOGRAPHY.caption, styles.helperText]}>
                  Set by the hostel administration
                </Text>
              </View>
            )}
            renderItem={({ item, index }) => (
              <View style={styles.ruleCard}>
                <View style={styles.ruleNumber}>
                  <Text style={styles.ruleNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.ruleText}>{item}</Text>
              </View>
            )}
            ListEmptyComponent={(
              <View style={styles.emptyState}>
                <Ionicons
                  name={rules.length === 0 ? 'document-text-outline' : 'search-outline'}
                  size={28}
                  color={COLORS.textMuted}
                />
                <Text style={[TYPOGRAPHY.bodySemiBold, styles.emptyTitle]}>
                  {rules.length === 0 ? 'No house rules added' : 'No matching rules'}
                </Text>
                <Text style={[TYPOGRAPHY.caption, styles.emptyMessage]}>
                  {rules.length === 0
                    ? 'The hostel has not published any house rules yet.'
                    : 'Try another word or clear your search.'}
                </Text>
              </View>
            )}
          />
        </>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 48,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: COLORS.textPrimary,
    fontSize: 14,
    minWidth: 0,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: SPACING.xs,
  },
  countText: {
    color: COLORS.textPrimary,
  },
  helperText: {
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
    ...SHADOWS.subtle,
  },
  ruleNumber: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
  },
  ruleNumberText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  ruleText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxxl,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  emptyMessage: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
