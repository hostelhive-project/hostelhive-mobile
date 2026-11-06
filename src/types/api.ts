export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string>;
  details?: string[];
}

export type UserRole = 'Student' | 'Admin' | 'CleaningStaff';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  residentCode?: string | null;
  profileImageUrl?: string | null;
  hostelId?: string | null;
  deviceToken?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BookingStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'CheckedIn'
  | 'CheckedOut';

export type RoomLayoutType = 'Single' | 'Shared-2' | 'Shared-4';

export interface Room {
  _id: string;
  hostelId: string;
  roomNumber: string;
  layoutType: RoomLayoutType;
  capacity: number;
  occupiedCount: number;
  isLocked: boolean;
  monthlyRent?: number | null;
  uiColorTag?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  _id: string;
  studentId: string | User;
  roomId: string | Room;
  monthlyRent: number;
  status: BookingStatus;
  bookingDate: string;
  emergencyContact?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  termsAcceptedAt?: string;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyInfo {
  gateOpenTime?: string;
  gateCloseTime?: string;
  houseRules?: string[];
  receptionContact?: string;
  nearbyLandmarks?: string;
}

export interface PublicChatbotInfo {
  gateOpenTime?: string;
  gateCloseTime?: string;
  houseRules?: string[];
  receptionContact?: string;
  nearbyLandmarks?: string;
  // Legacy aliases
  checkInTime?: string;
  checkOutTime?: string;
  rules?: string[];
  contactNumber?: string;
}

export interface Hostel {
  _id: string;
  name: string;
  location: string;
  priceTier: number;
  facilities: string[];
  bannerImage?: string;
  images: string[];
  propertyInfo?: PropertyInfo;
  ratingAvg: number;
  reviewCount: number;
  ownerAdminId?: string;
  stripeAccountId?: string | null;
  stripeOnboardingComplete?: boolean;
  chatbotInfo?: PublicChatbotInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewResidentInfo {
  _id: string;
  name: string;
}

export interface Review {
  _id: string;
  hostelId: string;
  residentId: ReviewResidentInfo | string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HostelSearchParams {
  location?: string;
  maxPrice?: number;
  facilities?: string | string[];
}

export type HostelExploreSort = 'rating' | 'price-asc' | 'price-desc';

