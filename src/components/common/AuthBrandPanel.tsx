import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from './AppIcon';
import { BackButton } from './BackButton';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';

interface AuthBrandPanelProps {
  showBack?: boolean;
  onBack?: () => void;
}

/** A compact app identity row keeps the authentication task in focus. */
export const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({ showBack = false, onBack }) => (
  <View style={styles.panel}>
    {showBack ? <BackButton onPress={onBack} style={styles.backButton} /> : null}
    <View style={styles.brandRow}>
      <BrandMark size={38} />
      <View style={styles.brandCopy}>
        <Text style={[TYPOGRAPHY.bodySemiBold, styles.brandName]}>HostelHive</Text>
        <Text style={[TYPOGRAPHY.caption, styles.tagline]}>Student accommodation</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  panel: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, marginBottom: SPACING.xl, minHeight: 56 },
  backButton: { width: 48, height: 48, backgroundColor: 'transparent', borderWidth: 0, elevation: 0, shadowOpacity: 0 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1, minWidth: 0 },
  brandCopy: { flex: 1, minWidth: 0 },
  brandName: { color: COLORS.primary },
  tagline: { color: COLORS.textSecondary, marginTop: 1 },
});
