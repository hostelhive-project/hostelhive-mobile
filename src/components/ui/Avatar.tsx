import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, TYPOGRAPHY } from '../../theme';

interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  size?: number;
  role?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, uri, size = 52, role }) => {
  const initials = (name || 'HostelHive').trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return (
    <View accessibilityRole="image" accessibilityLabel={`${role ? `${role} ` : ''}profile picture for ${name || 'user'}`} style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} contentFit="cover" style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[TYPOGRAPHY.bodySemiBold, styles.initials, { fontSize: size * 0.32, lineHeight: size * 0.4 }]}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#edf2f7', borderWidth: 1, borderColor: COLORS.cardBorder },
  initials: { color: COLORS.primary },
});
