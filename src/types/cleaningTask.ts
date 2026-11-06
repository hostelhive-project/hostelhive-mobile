export type CleaningTaskType = 'Routine' | 'DeepClean' | 'Emergency';
export type CleaningTaskStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Delayed';

export interface CleaningTaskRoom {
  _id: string;
  roomNumber: string;
  floor?: number;
  layoutType?: string;
  hostelId?: string;
}

export interface CleaningTaskStaff {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface CleaningTask {
  _id: string;
  roomId: CleaningTaskRoom;
  assignedStaffId: CleaningTaskStaff | string;
  taskType: CleaningTaskType;
  status: CleaningTaskStatus;
  scheduledTime: string;
  startedAt?: string | null;
  completedAt?: string | null;
  staffNotes?: string;
  beforeImageUri?: string | null;
  afterImageUri?: string | null;
  uiStatusBadgeColor?: string;
  delayReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface StartTaskPayload {
  beforeImageUri?: string;
}

export interface CompleteTaskPayload {
  afterImageUri: string;
  staffNotes?: string;
}

export interface DelayTaskPayload {
  reason?: string;
}

