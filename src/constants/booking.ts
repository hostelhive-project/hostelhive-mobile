import type { BookingStatus } from '../types/api';

/**
 * Derived mobile application stay states for students.
 * NOTE: These are client-side UI/flow states, NOT backend roles.
 */
export type StudentStayState =
  | 'seeker'
  | 'pending'
  | 'approved'
  | 'activeResident'
  | 'formerResident';

export const ACTIVE_BOOKING_STATUSES: readonly BookingStatus[] = [
  'CheckedIn',
  'Approved',
  'Pending',
] as const;
