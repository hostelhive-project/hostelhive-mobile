export type NotificationType =
  | 'RentDue'
  | 'ComplaintUpdate'
  | 'BookingUpdate'
  | 'TaskAssigned'
  | 'Announcement';

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedEntityId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UnreadCountResponse {
  count: number;
}

