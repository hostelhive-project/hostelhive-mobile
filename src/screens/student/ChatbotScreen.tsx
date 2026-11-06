import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { useSendMessageMutation, useGetChatHistoryQuery } from '../../services/chatbotApi';
import { useGetHostelChatbotInfoQuery } from '../../services/hostelApi';
import { useResidencyStatus } from '../../hooks/useResidencyStatus';
import type { StudentStackParamList } from '../../navigation/types';
import type { ChatMessage, SendMessagePayload } from '../../types/chatbot';
import { ChatMarkdown } from '../../components/common/ChatMarkdown';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';

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

type RouteProps = RouteProp<StudentStackParamList, 'Chatbot'>;

export const ChatbotScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();

  const { hostelId, hostelName: routeHostelName, mode: routeMode } = route.params || {};

  const { isActiveResident, primaryBooking } = useResidencyStatus();

  // Mode is resident if explicitly requested or if user is active resident and no other hostel is viewed
  const isResidentMode = routeMode === 'resident' || (isActiveResident && !hostelId);

  // For seeker mode, fetch public facts
  const { data: publicInfoResponse } = useGetHostelChatbotInfoQuery(hostelId || '', {
    skip: !hostelId,
  });
  const publicInfo = publicInfoResponse?.data;

  // Active hostel display name
  const effectiveHostelName = useMemo(() => {
    if (routeHostelName) return routeHostelName;
    if (isResidentMode && primaryBooking?.roomId) {
      const room = primaryBooking.roomId as any;
      if (room.hostelId?.name) return room.hostelId.name;
    }
    return 'HostelHive';
  }, [routeHostelName, isResidentMode, primaryBooking]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showFactsBanner, setShowFactsBanner] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const [sendMessageMutation, { isLoading: isSending }] = useSendMessageMutation();

  // Load server history if a sessionId is active
  const { data: historyResponse, isFetching: isLoadingHistory } = useGetChatHistoryQuery(
    sessionId || '',
    { skip: !sessionId }
  );

  // Initialize welcome message
  useEffect(() => {
    const welcomeText = isResidentMode
      ? `Hello! I am your resident assistant for ${effectiveHostelName}. I can answer questions about Wi-Fi access, house rules, facility timings, and hostel contact details. How can I help you today?`
      : `Welcome! Ask me any questions about ${effectiveHostelName} regarding facilities, policies, check-in timings, or how to book your stay.`;

    setMessages([
      {
        sessionId: 'initial',
        sender: 'Bot',
        message: welcomeText,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [isResidentMode, effectiveHostelName]);

  // Sync server history if available
  useEffect(() => {
    if (historyResponse?.data && historyResponse.data.length > 0) {
      setMessages(historyResponse.data);
    }
  }, [historyResponse]);

  const handleSend = async (prompt = inputText) => {
    const trimmed = prompt.trim();
    if (!trimmed || isSending) return;

    if (trimmed.length > 1000) {
      return;
    }

    // Optimistic user message
    const userMsg: ChatMessage = {
      sessionId: sessionId || 'temp',
      sender: 'User',
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    try {
      const payload: SendMessagePayload = {
        message: trimmed,
      };

      if (!isResidentMode && hostelId && typeof hostelId === 'string' && hostelId.trim().length === 24) {
        payload.hostelId = hostelId.trim();
      }

      if (
        sessionId &&
        typeof sessionId === 'string' &&
        sessionId.trim().length > 0 &&
        sessionId !== 'temp' &&
        sessionId !== 'initial'
      ) {
        payload.sessionId = sessionId.trim();
      }

      const res = await sendMessageMutation(payload).unwrap();

      if (res?.data) {
        if (!sessionId && res.data.sessionId) {
          setSessionId(res.data.sessionId);
        }

        const botMsg: ChatMessage = {
          sessionId: res.data.sessionId,
          sender: 'Bot',
          message: res.data.reply,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        sessionId: sessionId || 'temp',
        sender: 'Bot',
        message:
          'Unable to get a response right now. Please check your internet connection or try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'User';

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={14} color={COLORS.primary} />
          </View>
        )}

        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          {isUser ? (
            <Text style={[styles.messageText, styles.userMessageText]}>
              {item.message}
            </Text>
          ) : (
            <ChatMarkdown content={item.message} />
          )}

          {item.createdAt && (
            <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.botTimeText]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer style={styles.container}>
      {/* Top Header */}
      <AppHeader
        title={isResidentMode ? `${effectiveHostelName} Assistant` : `Ask about ${effectiveHostelName}`}
        subtitle={isResidentMode ? 'Resident assistant' : 'Hostel & discovery assistant'}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={<>
          <View style={styles.onlineDot} />
          {publicInfo && (
          <TouchableOpacity
            style={styles.infoToggleBtn}
            activeOpacity={0.7}
            onPress={() => setShowFactsBanner((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showFactsBanner ? 'Hide hostel facts' : 'Show hostel facts'}
            accessibilityState={{ expanded: showFactsBanner }}
          >
            <Ionicons
              name={showFactsBanner ? 'chevron-up' : 'information-circle-outline'}
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>
          )}
        </>}
      />

      {/* Collapsible Verified Facts Pill for Seekers */}
      {showFactsBanner && publicInfo && (
        <View style={styles.factsCard}>
          <View style={styles.factsHeader}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            <Text style={[TYPOGRAPHY.bodySemiBold, styles.factsTitle]}>Verified Hostel Facts</Text>
          </View>
          <View style={styles.factsGrid}>
            {publicInfo.gateOpenTime && (
              <Text style={styles.factItem}>Gate Opens: <Text style={styles.factBold}>{formatTime12h(publicInfo.gateOpenTime)}</Text></Text>
            )}
            {publicInfo.gateCloseTime && (
              <Text style={styles.factItem}>Gate Closes: <Text style={styles.factBold}>{formatTime12h(publicInfo.gateCloseTime)}</Text></Text>
            )}
            {(publicInfo.receptionContact || publicInfo.contactNumber) && (
              <Text style={styles.factItem}>Reception: <Text style={styles.factBold}>{publicInfo.receptionContact || publicInfo.contactNumber}</Text></Text>
            )}
            {publicInfo.nearbyLandmarks && (
              <Text style={styles.factItem}>Landmarks: <Text style={styles.factBold}>{publicInfo.nearbyLandmarks}</Text></Text>
            )}
          </View>
        </View>
      )}

      {/* Messages Thread */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            isSending ? (
              <View style={styles.typingIndicator}>
                <View style={styles.botAvatar}>
                  <Ionicons name="sparkles" size={14} color={COLORS.primary} />
                </View>
                <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={[TYPOGRAPHY.caption, styles.typingText]}>Thinking...</Text>
                </View>
              </View>
            ) : undefined
          }
        />

        {messages.length === 1 && !isLoadingHistory && !isSending ? (
          <View style={styles.suggestions}>
            <Text style={[TYPOGRAPHY.captionSemiBold, styles.suggestionsTitle]}>Try asking</Text>
            <View style={styles.suggestionRow}>
              {(isResidentMode
                ? ['What are the house rules?', 'How do I report a repair?', 'How can I pay my rent?']
                : ['What amenities are available?', 'What are the house rules?', 'How much is monthly rent?']
              ).map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  onPress={() => { void handleSend(prompt); }}
                  accessibilityRole="button"
                  style={styles.suggestionChip}
                >
                  <Text style={[TYPOGRAPHY.captionMedium, styles.suggestionText]}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* AI Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            AI answers use hostel information. Confirm important details with hostel administration.
          </Text>
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isResidentMode ? 'Ask about Wi-Fi, rules, timings...' : 'Ask about this hostel...'}
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={1000}
            editable={!isSending}
            accessibilityLabel="Message the HostelHive assistant"
            accessibilityHint="Ask about hostel information or your stay"
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isSending) && styles.sendBtnDisabled,
            ]}
            onPress={() => { void handleSend(); }}
            disabled={!inputText.trim() || isSending}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isSending ? 'Sending message' : 'Send message'}
            accessibilityState={{ disabled: !inputText.trim() || isSending, busy: isSending }}
          >
            <Ionicons
              name="send"
              size={18}
              color={!inputText.trim() || isSending ? COLORS.textMuted : COLORS.surface}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  infoToggleBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factsCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  factsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  factsTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  factsGrid: {
    gap: 3,
  },
  factItem: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  factBold: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  keyboardContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  suggestions: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.sm },
  suggestionsTitle: { color: COLORS.textSecondary },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  suggestionChip: { minHeight: 44, maxWidth: '100%', justifyContent: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.cardBorder },
  suggestionText: { color: COLORS.primary },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  botBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  userMessageText: {
    color: COLORS.surface,
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botTimeText: {
    color: COLORS.textMuted,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  typingText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  disclaimerContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: SPACING.xs,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minWidth: 0,
    fontFamily: 'Inter_400Regular',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.cardBorder,
  },
});

