import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { AppIcon as Ionicons } from '../../components/common/AppIcon';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppHeader } from '../../components/common/AppHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { AppModal } from '../../components/ui/AppModal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/layout';
import { showDialog } from '../../utils/dialog';
import {
  useGetTaskByIdQuery,
  useStartTaskMutation,
  useCompleteTaskMutation,
  useDelayTaskMutation,
} from '../../services/cleaningTaskApi';
import { useUploadImageMutation } from '../../services/uploadApi';
import { createUploadFormData, promptImageSource } from '../../utils/uploadHelpers';
import type { CleaningTaskType, CleaningTaskRoom } from '../../types/cleaningTask';

const TASK_TYPE_CONFIG: Record<
  CleaningTaskType,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  Routine: { label: 'Routine Cleaning', icon: 'sparkles-outline', color: COLORS.primary },
  DeepClean: { label: 'Deep Clean', icon: 'water-outline', color: COLORS.info },
  Emergency: { label: 'Emergency Cleanup', icon: 'flash-outline', color: COLORS.error },
};

export const StaffTaskDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const taskId = route.params?.taskId;

  const { data: taskRes, isLoading, isFetching, error, refetch } = useGetTaskByIdQuery(taskId, {
    skip: !taskId,
  });
  const task = taskRes?.data;

  const [startTask, { isLoading: isStarting }] = useStartTaskMutation();
  const [completeTask, { isLoading: isCompleting }] = useCompleteTaskMutation();
  const [delayTask, { isLoading: isDelaying }] = useDelayTaskMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();

  // Local state for before photo and completing task
  const [beforeImageUri, setBeforeImageUri] = useState<string | null>(null);
  const [isUploadingBefore, setIsUploadingBefore] = useState(false);
  const [afterImageUri, setAfterImageUri] = useState<string | null>(null);
  const [isUploadingAfter, setIsUploadingAfter] = useState(false);
  const [staffNotes, setStaffNotes] = useState<string>('');

  // Delay Modal State
  const [isDelayModalVisible, setIsDelayModalVisible] = useState(false);
  const [delayReason, setDelayReason] = useState('');

  if (isLoading) {
    return (
      <ScreenContainer>
        <AppHeader title="Task Details" onBack={() => navigation.goBack()} />
        <LoadingState message="Loading cleaning task..." />
      </ScreenContainer>
    );
  }

  if (error || !task) {
    return (
      <ScreenContainer>
        <AppHeader title="Task Details" onBack={() => navigation.goBack()} />
        <ErrorState
          title="Task Unavailable"
          message="This cleaning task could not be found or you do not have permission to view it."
          onRetry={refetch}
        />
      </ScreenContainer>
    );
  }

  const room = (typeof task.roomId === 'object' ? task.roomId : {}) as CleaningTaskRoom;
  const typeCfg = TASK_TYPE_CONFIG[task.taskType] || TASK_TYPE_CONFIG.Routine;

  const handlePickBeforePhoto = () => {
    promptImageSource({
      title: 'Before Cleaning Photo',
      message: 'Choose how you want to upload proof of room condition before cleaning:',
      pickerOptions: {
        allowsEditing: true,
        quality: 0.8,
      },
      onImageSelected: async (asset) => {
        try {
          setIsUploadingBefore(true);
          // eslint-disable-next-line no-console
          console.log('[STAFF BEFORE PHOTO] Selected asset:', {
            uri: asset.uri,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            width: asset.width,
            height: asset.height,
          });

          const formData = await createUploadFormData(asset, '/cleaning');
          const uploadRes = await uploadImage(formData).unwrap();

          // eslint-disable-next-line no-console
          console.log('[STAFF BEFORE PHOTO] Upload success:', uploadRes);

          if (uploadRes?.data?.url) {
            setBeforeImageUri(uploadRes.data.url);
          } else {
            throw new Error('Upload did not return image URL');
          }
        } catch (err: any) {
          // eslint-disable-next-line no-console
          console.error('[STAFF BEFORE PHOTO] Upload error:', err);
          const msg =
            err?.data?.message ||
            err?.error ||
            err?.message ||
            'Image upload failed. Please try again.';
          const statusText = err?.status ? ` (Status: ${err.status})` : '';
          showDialog('Upload Error', `${msg}${statusText}`);
        } finally {
          setIsUploadingBefore(false);
        }
      },
    });
  };

  const handleStartTask = async () => {
    if (isStarting || isUploadingBefore) return;
    const finalBeforeImage = beforeImageUri || task.beforeImageUri;
    if (!finalBeforeImage) {
      showDialog(
        'Photo Required',
        'A before-cleaning photo is required before starting the task to verify room condition.'
      );
      return;
    }

    try {
      await startTask({
        taskId: task._id,
        body: beforeImageUri ? { beforeImageUri } : undefined,
      }).unwrap();
      showDialog('Task Started', 'The task has been marked In Progress.');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Unable to start task. Please try again.';
      showDialog('Start Error', msg);
    }
  };

  const handlePickAfterPhoto = () => {
    promptImageSource({
      title: 'After Cleaning Photo',
      message: 'Choose how you want to upload proof of completed cleaning:',
      pickerOptions: {
        allowsEditing: true,
        quality: 0.8,
      },
      onImageSelected: async (asset) => {
        try {
          setIsUploadingAfter(true);
          // eslint-disable-next-line no-console
          console.log('[STAFF AFTER PHOTO] Selected asset:', {
            uri: asset.uri,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
          });

          const formData = await createUploadFormData(asset, '/cleaning');
          const uploadRes = await uploadImage(formData).unwrap();

          // eslint-disable-next-line no-console
          console.log('[STAFF AFTER PHOTO] Upload success:', uploadRes);

          if (uploadRes?.data?.url) {
            setAfterImageUri(uploadRes.data.url);
          } else {
            throw new Error('Upload did not return image URL');
          }
        } catch (err: any) {
          // eslint-disable-next-line no-console
          console.error('[STAFF AFTER PHOTO] Upload error:', err);
          const msg =
            err?.data?.message ||
            err?.error ||
            err?.message ||
            'Image upload failed. Please try again.';
          const statusText = err?.status ? ` (Status: ${err.status})` : '';
          showDialog('Upload Error', `${msg}${statusText}`);
        } finally {
          setIsUploadingAfter(false);
        }
      },
    });
  };

  const handleCompleteTask = async () => {
    const finalPhoto = afterImageUri || task.afterImageUri;
    if (!finalPhoto) {
      showDialog(
        'Photo Required',
        'An after-cleaning photo is required to verify proof of work before completing this task.'
      );
      return;
    }

    try {
      await completeTask({
        taskId: task._id,
        body: {
          afterImageUri: finalPhoto,
          staffNotes: staffNotes.trim() || undefined,
        },
      }).unwrap();

      showDialog(
        'Task Completed',
        'Cleaning task has been marked complete. Good job!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to complete task. Please try again.';
      showDialog('Completion Error', msg);
    }
  };

  const handleDelaySubmit = async () => {
    if (!delayReason.trim()) {
      showDialog('Reason Required', 'Please provide a brief reason for the delay.');
      return;
    }

    try {
      await delayTask({
        taskId: task._id,
        body: {
          reason: delayReason.trim(),
        },
      }).unwrap();

      setIsDelayModalVisible(false);
      setDelayReason('');
      showDialog('Task Marked Delayed', 'The delay reason has been recorded.');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to record delay. Please try again.';
      showDialog('Delay Error', msg);
    }
  };

  return (
    <ScreenContainer
      scrollable
      refreshing={isFetching && !isLoading}
      onRefresh={() => { void refetch(); }}
    >
      <AppHeader
        title="Task Details"
        subtitle={`Room ${room.roomNumber || '—'} Housekeeping`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* Status & Type Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <StatusBadge status={task.status} />

            <View style={styles.typeBadge}>
              <Ionicons name={typeCfg.icon} size={14} color={typeCfg.color} style={{ marginRight: 4 }} />
              <Text style={[styles.typeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
            </View>
          </View>

          {task.status === 'Delayed' && task.delayReason && (
            <View style={styles.delayBox}>
              <Ionicons name="warning-outline" size={16} color={COLORS.error} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.delayTitle}>Reason for Delay</Text>
                <Text style={styles.delayReasonText}>{task.delayReason}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Room & Assignment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location & Timing</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Room Number</Text>
            <Text style={styles.detailValue}>Room {room.roomNumber || '—'}</Text>
          </View>

          {room.floor !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Floor Level</Text>
              <Text style={styles.detailValue}>Floor {room.floor}</Text>
            </View>
          )}

          {room.layoutType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Room Layout</Text>
              <Text style={styles.detailValue}>{room.layoutType}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled Time</Text>
            <Text style={styles.detailValue}>
              {new Date(task.scheduledTime).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {task.startedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Started At</Text>
              <Text style={styles.detailValue}>
                {new Date(task.startedAt).toLocaleString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}

          {task.completedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Completed At</Text>
              <Text style={styles.detailValue}>
                {new Date(task.completedAt).toLocaleString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Proof of Work: Photos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Proof of Work (Photos)</Text>
          <Text style={styles.photoGuidance}>
            Photograph the same area from the same angle before and after cleaning, in good light. Include the floor and relevant surfaces. Keep faces and personal documents out of view.
          </Text>
          <Text style={styles.photoGuidance}>
            When enabled, these photos are sent to Groq for an advisory cleanliness assessment. Your administrator makes the final decision.
          </Text>

          {/* Before Photo Section */}
          <View style={styles.photoContainer}>
            <Text style={styles.photoLabel}>
              1. Before cleaning {!task.beforeImageUri && <Text style={styles.requiredStar}>*</Text>}
            </Text>
            {task.beforeImageUri ? (
              <Image source={{ uri: task.beforeImageUri }} style={styles.photoPreview} resizeMode="cover" />
            ) : task.status === 'Scheduled' || task.status === 'Delayed' ? (
              beforeImageUri ? (
                <View>
                  <Image source={{ uri: beforeImageUri }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.changePhotoBtn}
                    onPress={handlePickBeforePhoto}
                    disabled={isUploadingBefore || isStarting}
                    accessibilityRole="button"
                    accessibilityLabel="Replace before-cleaning photo"
                    accessibilityState={{ disabled: isUploadingBefore || isStarting, busy: isUploadingBefore }}
                  >
                    <Ionicons name="camera-reverse-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.changePhotoText}>Replace Before Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={handlePickBeforePhoto}
                  disabled={isUploadingBefore || isStarting}
                  accessibilityRole="button"
                  accessibilityLabel="Add required before-cleaning photo"
                  accessibilityState={{ disabled: isUploadingBefore || isStarting, busy: isUploadingBefore }}
                >
                  {isUploadingBefore ? (
                    <View style={styles.uploadLoadingBox}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.uploadLoadingText}>Uploading Before Photo...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                      <Text style={styles.uploadPrompt}>Capture or Upload Before Photo</Text>
                      <Text style={styles.uploadHint}>Document room condition before starting</Text>
                    </>
                  )}
                </TouchableOpacity>
              )
            ) : (
              <View style={styles.pendingPhotoBox}>
                <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
                <Text style={styles.pendingPhotoText}>
                  No before-cleaning photo provided
                </Text>
              </View>
            )}
          </View>

          {/* After Photo Section */}
          <View style={styles.photoContainer}>
            <Text style={styles.photoLabel}>
              2. After cleaning {task.status === 'InProgress' ? <Text style={styles.requiredStar}>*</Text> : null}
            </Text>

            {task.status === 'Completed' && task.afterImageUri ? (
              <Image source={{ uri: task.afterImageUri }} style={styles.photoPreview} resizeMode="cover" />
            ) : task.status === 'InProgress' ? (
              afterImageUri ? (
                <View>
                  <Image source={{ uri: afterImageUri }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.changePhotoBtn}
                    onPress={handlePickAfterPhoto}
                    disabled={isUploadingAfter || isUploading}
                    accessibilityRole="button"
                    accessibilityLabel="Replace after-cleaning photo"
                    accessibilityState={{ disabled: isUploadingAfter || isUploading, busy: isUploadingAfter }}
                  >
                    <Ionicons name="camera-reverse-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.changePhotoText}>Replace Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={handlePickAfterPhoto}
                  disabled={isUploadingAfter || isUploading}
                  accessibilityRole="button"
                  accessibilityLabel="Add required after-cleaning photo"
                  accessibilityState={{ disabled: isUploadingAfter || isUploading, busy: isUploadingAfter }}
                >
                  {isUploadingAfter || isUploading ? (
                    <View style={styles.uploadLoadingBox}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.uploadLoadingText}>Uploading Photo...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                      <Text style={styles.uploadPrompt}>Capture or Upload Photo</Text>
                      <Text style={styles.uploadHint}>Required to verify cleaning completion</Text>
                    </>
                  )}
                </TouchableOpacity>
              )
            ) : (
              <View style={styles.pendingPhotoBox}>
                <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
                <Text style={styles.pendingPhotoText}>
                  After-photo can be uploaded once task is In Progress
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Staff Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Staff Notes</Text>

          {task.status === 'Completed' ? (
            <Text style={styles.notesReadOnly}>
              {task.staffNotes || 'No notes submitted with this task.'}
            </Text>
          ) : task.status === 'InProgress' ? (
            <View>
              <TextInput
                style={styles.notesInput}
                placeholder="Add optional notes (e.g. replaced towels, noticed leak, etc.)"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                value={staffNotes}
                onChangeText={setStaffNotes}
                maxLength={1000}
                accessibilityLabel="Optional staff notes for this cleaning task"
              />
              <Text style={styles.charCount}>{staffNotes.length}/1000</Text>
            </View>
          ) : (
            <Text style={styles.notesReadOnly}>
              {task.staffNotes || 'Notes can be entered when completing the task.'}
            </Text>
          )}
        </View>

        {/* Action Controls */}
        <View style={styles.actionSection}>
          {(task.status === 'Scheduled' || task.status === 'Delayed') && (
            <View style={styles.buttonCol}>
              {!beforeImageUri && !task.beforeImageUri ? <Text style={styles.actionHint}>Add a before-cleaning photo above before starting this task.</Text> : null}
              <PrimaryButton
                title={task.status === 'Delayed' ? 'Resume Task' : 'Start Task'}
                onPress={handleStartTask}
                isLoading={isStarting}
                disabled={isStarting || isUploadingBefore}
                icon={<Ionicons name="play" size={18} color="#FFFFFF" />}
              />
              <SecondaryButton
                title="Report Delay"
                onPress={() => setIsDelayModalVisible(true)}
                disabled={isStarting || isUploadingBefore}
                style={styles.delayBtn}
                icon={<Ionicons name="time-outline" size={18} color={COLORS.textPrimary} />}
              />
            </View>
          )}

          {task.status === 'InProgress' && (
            <View style={styles.buttonCol}>
              {!afterImageUri && !task.afterImageUri ? <Text style={styles.actionHint}>Add an after-cleaning photo above to document the completed work.</Text> : null}
              <PrimaryButton
                title="Complete Task"
                onPress={handleCompleteTask}
                isLoading={isCompleting}
                disabled={isCompleting || isUploading || isUploadingAfter}
                icon={<Ionicons name="checkmark-done" size={18} color="#FFFFFF" />}
              />
              <SecondaryButton
                title="Report Delay"
                onPress={() => setIsDelayModalVisible(true)}
                disabled={isCompleting || isUploading || isUploadingAfter}
                style={styles.delayBtn}
                icon={<Ionicons name="time-outline" size={18} color={COLORS.textPrimary} />}
              />
            </View>
          )}

          {task.status === 'Completed' && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <Text style={styles.completedBannerText}>This cleaning task has been marked as completed.</Text>
            </View>
          )}
        </View>
      </View>

      {/* Delay Reason Modal */}
      <AppModal
        visible={isDelayModalVisible}
        onClose={() => { if (!isDelaying) setIsDelayModalVisible(false); }}
        title="Report task delay"
        subtitle="Briefly explain why this room task cannot proceed as scheduled."
      >
        <View>
            <TextInput
              style={styles.delayInput}
              placeholder="e.g. Resident studying, room locked, plumbing leak..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              value={delayReason}
              onChangeText={setDelayReason}
              maxLength={300}
              accessibilityLabel="Reason for delaying this task"
            />
            <Text style={styles.charCount}>{delayReason.length}/300</Text>

            <View style={styles.modalActionRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => { setIsDelayModalVisible(false); setDelayReason(''); }}
                disabled={isDelaying}
                style={styles.modalActionButton}
              />
              <PrimaryButton
                title="Save delay"
                onPress={handleDelaySubmit}
                isLoading={isDelaying}
                variant="danger"
                style={styles.modalActionButton}
              />
            </View>
        </View>
      </AppModal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  bannerCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  bannerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    maxWidth: '100%',
  },
  typeText: {
    ...TYPOGRAPHY.captionSemiBold,
    flexShrink: 1,
  },
  delayBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  delayTitle: {
    ...TYPOGRAPHY.captionSemiBold,
    color: COLORS.error,
    marginBottom: 2,
  },
  delayReasonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.errorText,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceSubtle,
  },
  detailLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    flex: 1,
    minWidth: 0,
  },
  detailValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  photoContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  photoGuidance: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  photoLabel: {
    ...TYPOGRAPHY.captionSemiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  requiredStar: {
    color: COLORS.error,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceSubtle,
  },
  changePhotoBtn: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  changePhotoText: {
    ...TYPOGRAPHY.captionSemiBold,
    flexShrink: 1,
    color: COLORS.primary,
    marginLeft: 4,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
  },
  uploadLoadingBox: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  uploadLoadingText: {
    ...TYPOGRAPHY.captionSemiBold,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  uploadPrompt: {
    ...TYPOGRAPHY.bodySemiBold,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  uploadHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  pendingPhotoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  pendingPhotoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    flex: 1,
  },
  notesReadOnly: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  notesInput: {
    ...TYPOGRAPHY.body,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceSubtle,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  actionSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  buttonCol: {
    gap: SPACING.md,
  },
  actionHint: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  delayBtn: {
    marginTop: 0,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.successLight,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    gap: 8,
  },
  completedBannerText: {
    ...TYPOGRAPHY.bodyMedium,
    flex: 1,
    color: COLORS.successText,
  },
  delayInput: {
    ...TYPOGRAPHY.body,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'column-reverse',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  modalActionButton: { width: '100%' },
});

