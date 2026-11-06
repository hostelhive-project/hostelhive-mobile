import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import { legalDocuments } from '../../content/legalDocuments';
import type { AuthStackParamList } from '../../navigation/types';

export function LegalDocumentScreen({ route }: NativeStackScreenProps<AuthStackParamList, 'LegalDocument'>) {
  const document = legalDocuments[route.params.kind];
  return <ScreenContainer scrollable><AppHeader title={document.title} showBack /><View style={styles.body}><Text style={[TYPOGRAPHY.caption, styles.text]}>Updated {document.updated}</Text>{document.sections.map((section) => <View key={section.heading} style={styles.section}><Text accessibilityRole="header" style={[TYPOGRAPHY.h3, styles.text]}>{section.heading}</Text><Text selectable style={[TYPOGRAPHY.body, styles.text]}>{section.body}</Text></View>)}</View></ScreenContainer>;
}
const styles = StyleSheet.create({ body: { padding: SPACING.xl, gap: SPACING.xl }, section: { gap: SPACING.sm }, text: { color: COLORS.textPrimary } });
