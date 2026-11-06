import React from 'react';
import { View, Text, StyleSheet, Platform, TextStyle, StyleProp } from 'react-native';
import { COLORS } from '../../constants/colors';

interface ChatMarkdownProps {
  content: string;
  baseTextStyle?: StyleProp<TextStyle>;
}

interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'bold_italic' | 'code';
  content: string;
}

interface MarkdownBlock {
  type: 'paragraph' | 'bullet' | 'numbered' | 'header' | 'code_block' | 'empty';
  text?: string;
  number?: string;
  indent?: number;
  level?: number;
  code?: string;
}

// Inline token regex:
// 1) ***bold-italic*** or ___bold-italic___
// 2) **bold** or __bold__
// 3) *italic* or _italic_
// 4) `code`
const INLINE_REGEX = /(\*\*\*[^*]+?\*\*\*|___[^_]+?___|\*\*[^*]+?\*\*|__[^_]+?__|\*(?!\s)[^*\n]+?(?<!\s)\*|(?<!\w)_(?!\s)[^_\n]+?(?<!\s)_(?!\w)|`[^`\n]+?`)/g;

function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_REGEX.lastIndex = 0;

  while ((match = INLINE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    if ((raw.startsWith('***') && raw.endsWith('***')) || (raw.startsWith('___') && raw.endsWith('___'))) {
      tokens.push({ type: 'bold_italic', content: raw.slice(3, -3) });
    } else if ((raw.startsWith('**') && raw.endsWith('**')) || (raw.startsWith('__') && raw.endsWith('__'))) {
      tokens.push({ type: 'bold', content: raw.slice(2, -2) });
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ type: 'italic', content: raw.slice(1, -1) });
    } else if (raw.startsWith('_') && raw.endsWith('_')) {
      tokens.push({ type: 'italic', content: raw.slice(1, -1) });
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ type: 'code', content: raw.slice(1, -1) });
    }

    lastIndex = INLINE_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return tokens;
}

function parseBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check fenced code block
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          type: 'code_block',
          code: codeBuffer.join('\n'),
        });
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (trimmed === '') {
      blocks.push({ type: 'empty' });
      continue;
    }

    // Header: #, ##, ###
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      blocks.push({
        type: 'header',
        level: headerMatch[1].length,
        text: headerMatch[2],
      });
      continue;
    }

    // Bullet list: - item, * item, + item, • item
    const bulletMatch = line.match(/^(\s*)([-*+•])\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({
        type: 'bullet',
        indent: Math.floor(bulletMatch[1].length / 2),
        text: bulletMatch[3],
      });
      continue;
    }

    // Numbered list: 1. item, 2) item
    const numberMatch = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (numberMatch) {
      blocks.push({
        type: 'numbered',
        number: numberMatch[2],
        indent: Math.floor(numberMatch[1].length / 2),
        text: numberMatch[3],
      });
      continue;
    }

    // Regular paragraph line
    blocks.push({
      type: 'paragraph',
      text: line,
    });
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      type: 'code_block',
      code: codeBuffer.join('\n'),
    });
  }

  return blocks;
}

export const ChatMarkdown: React.FC<ChatMarkdownProps> = ({ content, baseTextStyle }) => {
  if (!content) return null;

  const blocks = parseBlocks(content);

  const renderInline = (text: string) => {
    const tokens = parseInlineTokens(text);
    return tokens.map((token, index) => {
      switch (token.type) {
        case 'bold':
          return (
            <Text key={index} style={styles.bold}>
              {token.content}
            </Text>
          );
        case 'italic':
          return (
            <Text key={index} style={styles.italic}>
              {token.content}
            </Text>
          );
        case 'bold_italic':
          return (
            <Text key={index} style={styles.boldItalic}>
              {token.content}
            </Text>
          );
        case 'code':
          return (
            <Text key={index} style={styles.inlineCode}>
              {token.content}
            </Text>
          );
        case 'text':
        default:
          return <Text key={index}>{token.content}</Text>;
      }
    });
  };

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'empty':
            return <View key={index} style={styles.paragraphSpacer} />;

          case 'header':
            return (
              <Text key={index} style={[styles.baseText, styles.headerText, baseTextStyle]}>
                {renderInline(block.text || '')}
              </Text>
            );

          case 'bullet':
            return (
              <View
                key={index}
                style={[
                  styles.listRow,
                  (block.indent ?? 0) > 0 && { paddingLeft: (block.indent ?? 0) * 14 },
                ]}
              >
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={[styles.baseText, styles.listText, baseTextStyle]}>
                  {renderInline(block.text || '')}
                </Text>
              </View>
            );

          case 'numbered':
            return (
              <View
                key={index}
                style={[
                  styles.listRow,
                  (block.indent ?? 0) > 0 && { paddingLeft: (block.indent ?? 0) * 14 },
                ]}
              >
                <Text style={styles.numberSymbol}>{block.number}.</Text>
                <Text style={[styles.baseText, styles.listText, baseTextStyle]}>
                  {renderInline(block.text || '')}
                </Text>
              </View>
            );

          case 'code_block':
            return (
              <View key={index} style={styles.codeBlock}>
                <Text style={styles.codeBlockText}>{block.code}</Text>
              </View>
            );

          case 'paragraph':
          default:
            return (
              <Text key={index} style={[styles.baseText, styles.paragraphText, baseTextStyle]}>
                {renderInline(block.text || '')}
              </Text>
            );
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  baseText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  paragraphText: {
    marginBottom: 2,
  },
  paragraphSpacer: {
    height: 6,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  italic: {
    fontStyle: 'italic',
    color: COLORS.textPrimary,
  },
  boldItalic: {
    fontWeight: '700',
    fontStyle: 'italic',
    color: COLORS.textPrimary,
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#F3F4F6',
    color: COLORS.primary,
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  headerText: {
    fontWeight: '700',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 1.5,
  },
  bulletSymbol: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
    marginRight: 6,
    width: 12,
    textAlign: 'center',
  },
  numberSymbol: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
    marginRight: 6,
    minWidth: 16,
    fontWeight: '600',
  },
  listText: {
    flex: 1,
  },
  codeBlock: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 8,
    marginVertical: 4,
  },
  codeBlockText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: COLORS.textPrimary,
  },
});

export default ChatMarkdown;

