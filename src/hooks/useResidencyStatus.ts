import { useMemo } from 'react';
import { useGetMyBookingsQuery } from '../services/bookingApi';
import type { Booking, Room } from '../types/api';
import type { StudentStayState } from '../constants/booking';

export interface ResidencyStatus {
  // Derived state machine
  stayState: StudentStayState;

  // Semantic boolean helpers
  isActiveResident: boolean;
  isApproved: boolean;
  isPending: boolean;
  isFormerResident: boolean;
  isSeeker: boolean;
  hasActiveBooking: boolean;

  // Resolved booking entities
  activeBooking: Booking | null;
  primaryBooking: Booking | null;
  historicalBookings: Booking[];
  allBookings: Booking[];

  // Current accommodation details (when CheckedIn or Approved)
  currentRoom: Room | null;
  currentHostelId: string | null;

  // Query status
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Authoritative derived residency hook for students.
 * Derives current residency status entirely from server booking state (GET /api/bookings/mine).
 *
 * Priority order for active booking:
 * 1. CheckedIn (Active resident)
 * 2. Approved (Reservation approved, awaiting check-in)
 * 3. Pending (Application submitted)
 */
export const useResidencyStatus = (): ResidencyStatus => {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetMyBookingsQuery();

  const allBookings = data?.data || [];

  return useMemo(() => {
    // 1. Deterministic active booking resolution with strict priority:
    // CheckedIn > Approved > Pending
    const checkedIn = allBookings.find((b) => b.status === 'CheckedIn') || null;
    const approved = allBookings.find((b) => b.status === 'Approved') || null;
    const pending = allBookings.find((b) => b.status === 'Pending') || null;

    const activeBooking = checkedIn || approved || pending || null;

    // 2. Historical bookings: everything except the resolved activeBooking
    const historicalBookings = activeBooking
      ? allBookings.filter((b) => b._id !== activeBooking._id)
      : allBookings;

    // Check for previous completed stays
    const latestCheckedOut = allBookings.find((b) => b.status === 'CheckedOut') || null;

    // 3. Derive central stayState
    let stayState: StudentStayState = 'seeker';
    if (checkedIn) {
      stayState = 'activeResident';
    } else if (approved) {
      stayState = 'approved';
    } else if (pending) {
      stayState = 'pending';
    } else if (latestCheckedOut) {
      stayState = 'formerResident';
    } else {
      stayState = 'seeker';
    }

    // 4. Primary booking for UI representation
    const primaryBooking = activeBooking || allBookings[0] || null;

    // 5. Derive room & hostel information from the active or primary booking
    const relevantBooking = activeBooking || primaryBooking;
    const currentRoom =
      relevantBooking && typeof relevantBooking.roomId === 'object'
        ? (relevantBooking.roomId as Room)
        : null;

    const currentHostelId = currentRoom
      ? typeof currentRoom.hostelId === 'object'
        ? (currentRoom.hostelId as any)?._id || null
        : (currentRoom.hostelId as string)
      : null;

    return {
      stayState,
      isActiveResident: stayState === 'activeResident',
      isApproved: stayState === 'approved',
      isPending: stayState === 'pending',
      isFormerResident: stayState === 'formerResident',
      isSeeker: stayState === 'seeker' || stayState === 'formerResident',
      hasActiveBooking: !!activeBooking,
      activeBooking,
      primaryBooking,
      historicalBookings,
      allBookings,
      currentRoom,
      currentHostelId,
      isLoading,
      isFetching,
      isError,
      error,
      refetch,
    };
  }, [allBookings, isLoading, isFetching, isError, error, refetch]);
};
