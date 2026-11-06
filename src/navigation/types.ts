import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Room, RoomLayoutType } from '../types/api';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string } | undefined;
  ActivateStaffInvite: { email?: string } | undefined;
  LegalDocument: { kind: 'privacy' | 'terms' | 'guidelines' };
};

export type StudentTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  StayTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

export type StudentStackParamList = {
  StudentTabs: NavigatorScreenParams<StudentTabParamList> | undefined;
  HostelDetails: { hostelId: string };
  Rooms: { hostelId: string; layoutType?: RoomLayoutType };
  Reviews: { hostelId: string };
  HouseRules: { hostelId: string };
  BookingApplication: {
    room: Room;
    hostelId: string;
    hostelName: string;
    fallbackRent: number;
    hostelBanner?: string;
  };
  RoomPreview?: {
    room: Room;
    hostelId: string;
    hostelName: string;
    fallbackRent: number;
    hostelBanner?: string;
  };
  Complaints: undefined;
  NewComplaint: undefined;
  ComplaintDetail: { complaintId: string };
  Invoices?: { bookingId?: string; invoiceId?: string; paymentStatus?: string; session_id?: string };
  InvoiceDetail: { invoiceId: string; paymentStatus?: string };
  Chatbot?: { hostelId?: string; hostelName?: string; mode?: 'resident' | 'seeker' };
};

export type StaffTabParamList = {
  TasksTab: undefined;
  ComplaintsTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

export type StaffStackParamList = {
  StaffTabs: NavigatorScreenParams<StaffTabParamList> | undefined;
  TaskDetail: { taskId: string };
  StaffComplaintDetail: { complaintId: string };
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  StudentApp: NavigatorScreenParams<StudentStackParamList>;
  StaffApp: NavigatorScreenParams<StaffStackParamList>;
  AdminNotice: undefined;
};

