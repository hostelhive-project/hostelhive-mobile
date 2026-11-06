import React, { useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppIcon, BrandMark } from '../../components/common/AppIcon';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { OfflineBanner } from '../../components/feedback/OfflineBanner';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';

const slides = [
  {
    title: 'Find a hostel that fits',
    description: 'Compare rooms, amenities, and rent before you choose your next place.',
    icon: 'search' as const,
    illustration: 'hero' as const,
  },
  {
    title: 'Keep your stay on track',
    description: 'Manage your room, rent, and requests together in one clear place.',
    icon: 'bed-outline' as const,
    illustration: 'stay' as const,
  },
  {
    title: 'Get help when you need it',
    description: 'Ask the resident assistant or send a repair request to your hostel team.',
    icon: 'message-circle' as const,
    illustration: 'help' as const,
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { width } = useWindowDimensions();
  const listRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [page, setPage] = useState(0);

  const changePage = async (nextPage: number) => {
    await Haptics.selectionAsync().catch(() => undefined);
    listRef.current?.scrollTo({ x: nextPage * width, y: 0, animated: true });
    setPage(nextPage);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextPage = Math.round(event.nativeEvent.contentOffset.x / width);
    setPage(Math.max(0, Math.min(slides.length - 1, nextPage)));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner />
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <BrandMark size={38} />
          <View>
            <Text style={[TYPOGRAPHY.bodySemiBold, styles.brandName]}>HostelHive</Text>
            <Text style={[TYPOGRAPHY.caption, styles.brandLine]}>Student accommodation</Text>
          </View>
        </View>
        <SecondaryButton title="Skip" onPress={onComplete} variant="ghost" compact style={styles.skipButton} />
      </View>

      <ScrollView
        ref={listRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.pager}
      >
        {slides.map((slide, index) => (
          <View key={slide.title} style={[styles.page, { width }]}>
            {slide.illustration === 'hero' ? (
              <View style={styles.heroFrame}>
                <Image
                  source={require('../../../assets/hostelhive-auth-hero.png')}
                  style={styles.heroImage}
                  resizeMode="cover"
                  accessibilityLabel="A student checking in with hostel administration, with student rooms, a shared lounge, and housekeeping in the background"
                />
              </View>
            ) : (
              <View style={styles.illustrationFrame}>
                {slide.illustration === 'stay' ? (
                  <View style={styles.stayMockup}>
                    <View style={styles.mockHeader}>
                      <View style={styles.mockIcon}><AppIcon name={slide.icon} size={19} color={COLORS.primary} /></View>
                      <View style={styles.mockText}><View style={styles.mockLineLong} /><View style={styles.mockLineShort} /></View>
                      <View style={styles.mockBadge}><AppIcon name="circle-check" size={14} color={COLORS.success} /></View>
                    </View>
                    <View style={styles.mockDivider} />
                    <Text style={[TYPOGRAPHY.captionSemiBold, styles.mockEyebrow]}>ROOM H-1 · DHA, LAHORE</Text>
                    <Text style={[TYPOGRAPHY.h2, styles.mockPrice]}>PKR 19,000<Text style={TYPOGRAPHY.caption}> / month</Text></Text>
                    <View style={styles.mockStatus}><View style={styles.statusDot} /><Text style={[TYPOGRAPHY.captionSemiBold, styles.statusText]}>Active residency</Text></View>
                  </View>
                ) : (
                  <View style={styles.helpMockup}>
                    <View style={styles.botAvatar}><AppIcon name="message-circle" size={22} color="#fff" /></View>
                    <View style={styles.helpBubble}><Text style={[TYPOGRAPHY.bodySmall, styles.helpText]}>Hi! I can help with hostel details, invoices, or a maintenance request.</Text></View>
                    <View style={styles.helpChips}><Text style={[TYPOGRAPHY.caption, styles.helpChip]}>House rules</Text><Text style={[TYPOGRAPHY.caption, styles.helpChip]}>Report an issue</Text></View>
                  </View>
                )}
              </View>
            )}
            <View style={styles.copyBlock}>
              <View style={styles.stepLabel}><Text style={[TYPOGRAPHY.captionSemiBold, styles.stepText]}>0{index + 1}</Text><View style={styles.stepRule} /><Text style={[TYPOGRAPHY.caption, styles.stepText]}>GET STARTED</Text></View>
              <Text style={[TYPOGRAPHY.h1, styles.heading]}>{slide.title}</Text>
              <Text style={[TYPOGRAPHY.body, styles.description]}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel={`Onboarding page ${page + 1} of ${slides.length}`}>
          {slides.map((slide, index) => (
            <View key={slide.title} style={[styles.dot, page === index && styles.activeDot]} />
          ))}
        </View>
        <PrimaryButton
          title={page === slides.length - 1 ? 'Get started' : 'Next'}
          icon={<AppIcon name={page === slides.length - 1 ? 'arrow-right' : 'arrow-right'} size={18} color="#ffffff" />}
          onPress={() => (page === slides.length - 1 ? onComplete() : void changePage(page + 1))}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topBar: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  brandName: { color: COLORS.primary },
  brandLine: { color: COLORS.textSecondary, marginTop: 1 },
  skipButton: { minWidth: 52, paddingHorizontal: SPACING.sm },
  pager: { flex: 1 },
  page: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, justifyContent: 'center' },
  heroFrame: { width: '100%', aspectRatio: 1.58, maxHeight: 260, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: COLORS.primary, ...SHADOWS.card },
  heroImage: { width: '100%', height: '100%' },
  illustrationFrame: { width: '100%', aspectRatio: 1.58, maxHeight: 260, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.cardBorder, backgroundColor: COLORS.surface, padding: SPACING.lg, ...SHADOWS.card },
  stayMockup: { width: '100%', maxWidth: 340, padding: SPACING.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.md },
  mockHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  mockIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#edf2f7', alignItems: 'center', justifyContent: 'center' },
  mockText: { flex: 1, gap: 6 },
  mockLineLong: { height: 8, width: '76%', borderRadius: 4, backgroundColor: '#dce3eb' },
  mockLineShort: { height: 6, width: '48%', borderRadius: 3, backgroundColor: '#e8edf2' },
  mockBadge: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#ecfdf5' },
  mockDivider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.cardBorder, marginVertical: SPACING.md },
  mockEyebrow: { color: COLORS.textSecondary, letterSpacing: 0.35 },
  mockPrice: { marginTop: SPACING.xs, color: COLORS.primary },
  mockStatus: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: SPACING.md, paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADIUS.full, backgroundColor: '#ecfdf5' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  statusText: { color: '#047857' },
  helpMockup: { width: '100%', maxWidth: 340, alignItems: 'flex-start', gap: SPACING.md },
  botAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  helpBubble: { maxWidth: '94%', backgroundColor: COLORS.surface, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.md, borderTopLeftRadius: 4 },
  helpText: { color: COLORS.textPrimary },
  helpChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  helpChip: { color: COLORS.textSecondary, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.full, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: COLORS.surface },
  copyBlock: { marginTop: SPACING.xxl, maxWidth: 430 },
  stepLabel: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  stepText: { color: COLORS.textSecondary, letterSpacing: 0.55 },
  stepRule: { height: 1, width: 28, backgroundColor: COLORS.cardBorder },
  heading: { color: COLORS.primary, marginBottom: SPACING.sm },
  description: { color: COLORS.textSecondary, maxWidth: 380 },
  footer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderSoft, backgroundColor: COLORS.surface },
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center', paddingBottom: SPACING.md },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.cardBorder },
  activeDot: { width: 22, backgroundColor: COLORS.primary },
  nextButton: { width: '100%' },
});
