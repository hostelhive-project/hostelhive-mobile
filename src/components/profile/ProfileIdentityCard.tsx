import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';

interface ProfileIdentityCardProps {
  name: string;
  email?: string;
  imageUri?: string | null;
  role: string;
}

export const ProfileIdentityCard: React.FC<ProfileIdentityCardProps> = ({ name, email, imageUri, role }) => (
  <View style={styles.card}>
    <View style={styles.identityRow}>
      <Avatar name={name} uri={imageUri || undefined} size={64} role={role} />
      <View style={styles.copy}>
        <Text style={[TYPOGRAPHY.h2, styles.name]}>{name}</Text>
        <View style={styles.roleBadge}>
          <Text style={[TYPOGRAPHY.captionSemiBold, styles.role]}>{role}</Text>
        </View>
      </View>
    </View>
    <Text selectable style={[TYPOGRAPHY.bodySmall, styles.email]}>{email || 'Email not available'}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { gap: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.cardBorder, backgroundColor: COLORS.surface, ...SHADOWS.card },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  copy: { flex: 1, minWidth: 0 },
  name: { color: COLORS.textPrimary, marginBottom: SPACING.xs },
  email: { color: COLORS.textSecondary, flexShrink: 1 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.surfaceSubtle, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  role: { color: COLORS.textSecondary },
});
