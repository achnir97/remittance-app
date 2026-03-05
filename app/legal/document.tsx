import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';
import { DocumentUploader } from '../../components/legal/DocumentUploader';
import { ClauseCard } from '../../components/legal/ClauseCard';
import { HotlineCard } from '../../components/legal/HotlineCard';
import { DisclaimerFooter } from '../../components/legal/DisclaimerFooter';
import { useLegalDocument } from '../../hooks/useLegalDocument';

const DEFAULT_QUESTION = 'What does this document say? Are there any clauses I should be concerned about?';

export default function DocumentScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const { status, result, error, analyze, reset } = useLegalDocument();

  const handleAnalyze = () => {
    if (!imageUri) return;
    analyze(imageUri, question || DEFAULT_QUESTION);
  };

  const handleNewDocument = () => {
    reset();
    setImageUri(null);
    setQuestion('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('legal.document.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image picker (only show if no result yet) */}
        {status !== 'done' && (
          <View style={styles.section}>
            <DocumentUploader onImageSelected={setImageUri} />

            {imageUri && (
              <View style={styles.preview}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                <TouchableOpacity style={styles.removeBtn} onPress={() => { setImageUri(null); reset(); }}>
                  <Ionicons name="close-circle" size={24} color={theme.colors.red} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Question input */}
        {status !== 'done' && (
          <View style={styles.section}>
            <TextInput
              style={styles.questionInput}
              value={question}
              onChangeText={setQuestion}
              placeholder={i18n.t('legal.document.questionPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              multiline
            />
          </View>
        )}

        {/* Analyze button */}
        {status !== 'done' && (
          <TouchableOpacity
            style={[styles.analyzeBtn, (!imageUri || status === 'processing') && styles.analyzeBtnDisabled]}
            onPress={handleAnalyze}
            disabled={!imageUri || status === 'processing'}
          >
            {status === 'processing' ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.analyzeBtnText}>{i18n.t('legal.document.analyzing')}</Text>
              </>
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.analyzeBtnText}>Analyze Document</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {status === 'done' && result && (
          <View style={styles.results}>
            {/* Document type */}
            {result.document_type && (
              <View style={styles.docTypeBadge}>
                <Text style={styles.docTypeText}>
                  {result.document_type.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            )}

            {/* Answer to question */}
            {result.answer_to_question && (
              <View style={styles.answerBox}>
                <Text style={styles.answerLabel}>Answer</Text>
                <Text style={styles.answerText}>{result.answer_to_question}</Text>
              </View>
            )}

            {/* Full translation */}
            {result.full_translation && (
              <View style={styles.translationBox}>
                <Text style={styles.sectionTitle}>{i18n.t('legal.document.translation')}</Text>
                <Text style={styles.translationText}>{result.full_translation}</Text>
              </View>
            )}

            {/* Key clauses */}
            {result.key_clauses && result.key_clauses.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>{i18n.t('legal.document.keyClauses')}</Text>
                {result.key_clauses.map((clause, i) => (
                  <ClauseCard key={i} clause={clause} />
                ))}
              </View>
            )}

            {/* Hotline */}
            {result.hotline && <HotlineCard hotline={result.hotline} />}

            {/* Disclaimer */}
            {result.disclaimer && <DisclaimerFooter text={result.disclaimer} />}

            {/* New document button */}
            <TouchableOpacity style={styles.newDocBtn} onPress={handleNewDocument}>
              <Ionicons name="refresh" size={16} color="#9B72FF" />
              <Text style={styles.newDocText}>Analyze Another Document</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  content: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  preview: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.radius.md,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  questionInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(155, 114, 255, 0.4)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.select({ ios: 10, android: 8 })!,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.bg2,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#9B72FF',
    borderRadius: theme.radius.full,
    paddingVertical: 14,
    marginBottom: theme.spacing.md,
  },
  analyzeBtnDisabled: {
    opacity: 0.4,
  },
  analyzeBtnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.red,
    flex: 1,
  },
  results: {
    gap: theme.spacing.sm,
  },
  docTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(155, 114, 255, 0.15)',
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  docTypeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: '#9B72FF',
    letterSpacing: 0.5,
  },
  answerBox: {
    backgroundColor: 'rgba(155, 114, 255, 0.12)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  answerLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: '#9B72FF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  answerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },
  translationBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  translationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 21,
  },
  newDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#9B72FF',
    borderRadius: theme.radius.full,
  },
  newDocText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: '#9B72FF',
  },
});
